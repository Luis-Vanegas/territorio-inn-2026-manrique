import 'server-only';

import datosOsmJson from '@/public/firmamento/constelaciones.json';
import modeloJson from '@/public/modelo_categoria.json';
import { POLIGONO_MANRIQUE } from '@/lib/geo/constantes';
import type { DatosConstelaciones } from '@/lib/geo/constelaciones';
import {
  aplanarComercios,
  contarPorCategoria,
  lineaMezcla,
  nombreCategoriaOsm,
  SIN_CATEGORIA,
} from '@/lib/geo/comerciosOsm';
import { grupoDeCategoria, type Grupo } from '@/lib/categorias/grupos';
import { obtenerDatosAbiertos, type DatosAbiertos } from '@/lib/db/datos.repo';
import { listarAprobados, type Portafolio } from '@/lib/db/portafolios.repo';

/**
 * Todo lo que lee /firmamento, resuelto en el servidor y en un solo lugar.
 *
 * - OSM: `public/firmamento/constelaciones.json`, import estático (solo viaja
 *   en el bundle del servidor; el navegador lo pide por fetch para el mapa).
 * - Aliados: el repo de datos abiertos (`obtenerDatosAbiertos`, regla k = 5),
 *   no un fetch a nuestra propia API. Si la base no responde, la página sigue y
 *   dice que no pudo consultarlo: no se inventa ni se deja en cero.
 * - Modelo: solo la ficha de métricas de `public/modelo_categoria.json`.
 *
 * Ninguna cifra de este archivo se escribe a mano.
 */

const osm = datosOsmJson as unknown as DatosConstelaciones & {
  metodo: {
    algoritmo: string;
    min_cluster_size: number;
    min_samples: number;
    cluster_selection_method: string;
    semilla: number;
  };
  resumen: DatosConstelaciones['resumen'] & { constelaciones_sin_calle?: number };
};

const modelo = modeloJson as unknown as {
  entrenado_con: number;
  fecha_corrida: string;
  umbral_confianza: number;
  metricas: {
    f1_macro_holdout: number;
    accuracy_holdout: number;
    f1_macro_linea_base_mayoritaria: number;
    f1_macro_holdout_geografico_comuna3: number;
    n_holdout: number;
    n_holdout_geografico: number;
  };
};

export type FilaConstelacion = {
  id: string;
  codigo: string;
  nombre: string;
  tamano: number;
  radioM: number;
  mezcla: string;
};

export type BarraCategoria = { id: string; nombre: string; n: number; grupo: Grupo };

/** El cielo proyectado: coordenadas ya en unidades del SVG, sin lat/lon crudos en el cliente. */
export type Cielo = {
  ancho: number;
  alto: number;
  contorno: string;
  constelaciones: { id: string; lineas: string; estrellas: [number, number][] }[];
  sueltos: [number, number][];
};

export type DatosFirmamento = {
  osm: {
    totalComercios: number;
    conNombre: number;
    sinNombre: number;
    constelaciones: number;
    sueltos: number;
    sinCalle: number | null;
    osmBase: string;
    fechaCorrida: string;
    licencia: string;
    minCluster: number;
    minMuestras: number;
    seleccion: string;
  };
  filas: FilaConstelacion[];
  barras: BarraCategoria[];
  cielo: Cielo;
  /** Posición horizontal (0 a 1, oeste a este) de cada comercio, para el horizonte. */
  posicionesHorizonte: number[];
  red: { datos: DatosAbiertos | null; portafolios: Portafolio[] };
  modelo: {
    entrenadoCon: number;
    fecha: string;
    umbralPorcentaje: number;
    f1Macro: number;
    f1LineaBase: number;
    exactitud: number;
    nHoldout: number;
    f1Comuna3: number;
    nComuna3: number;
  };
};

// ── Proyección del cielo ────────────────────────────────────────────────

const ANCHO_CIELO = 600;
const MARGEN_CIELO = 14;

function proyectar(): Cielo {
  const anillo = (
    POLIGONO_MANRIQUE.features[0]!.geometry as unknown as { coordinates: number[][][] }
  ).coordinates[0]!;
  const lons = anillo.map((p) => p[0] as number);
  const lats = anillo.map((p) => p[1] as number);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  // A esta latitud un grado de longitud mide cos(lat) veces uno de latitud:
  // sin esta corrección la comuna saldría ensanchada.
  const cos = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const k = (ANCHO_CIELO - 2 * MARGEN_CIELO) / ((maxLon - minLon) * cos);
  const alto = Math.round((maxLat - minLat) * k + 2 * MARGEN_CIELO);

  const r1 = (n: number) => Math.round(n * 10) / 10;
  const punto = (lat: number, lon: number): [number, number] => [
    r1(MARGEN_CIELO + (lon - minLon) * cos * k),
    r1(MARGEN_CIELO + (maxLat - lat) * k),
  ];

  const contorno =
    anillo
      .map((p, i) => {
        const [x, y] = punto(p[1] as number, p[0] as number);
        return `${i === 0 ? 'M' : 'L'}${x} ${y}`;
      })
      .join(' ') + ' Z';

  return {
    ancho: ANCHO_CIELO,
    alto,
    contorno,
    constelaciones: osm.constelaciones.map((c) => ({
      id: c.id,
      estrellas: c.estrellas.map((e) => punto(e.lat, e.lon)),
      lineas: c.aristas
        .flatMap((a) => {
          const de = c.estrellas[a.de];
          const hasta = c.estrellas[a.a];
          if (!de || !hasta) return [];
          const [x1, y1] = punto(de.lat, de.lon);
          const [x2, y2] = punto(hasta.lat, hasta.lon);
          return [`M${x1} ${y1} L${x2} ${y2}`];
        })
        .join(' '),
    })),
    sueltos: osm.puntos_sueltos.map((e) => punto(e.lat, e.lon)),
  };
}

// ── Lectura ─────────────────────────────────────────────────────────────

export async function leerFirmamento(): Promise<DatosFirmamento> {
  const [abiertos, aprobados] = await Promise.allSettled([
    obtenerDatosAbiertos(),
    listarAprobados(),
  ]);
  if (abiertos.status === 'rejected') {
    console.error('[firmamento] datos abiertos no disponibles', abiertos.reason);
  }
  if (aprobados.status === 'rejected') {
    console.error('[firmamento] aliados no disponibles', aprobados.reason);
  }

  const comercios = aplanarComercios(osm);
  const lonsComercios = comercios.map((e) => e.lon);
  const minLon = Math.min(...lonsComercios);
  const rango = Math.max(...lonsComercios) - minLon || 1;

  const barras: BarraCategoria[] = Object.entries(contarPorCategoria(comercios))
    .map(([id, n]) => {
      const categoria = id === SIN_CATEGORIA ? null : id;
      return {
        id,
        nombre: nombreCategoriaOsm(categoria),
        n,
        grupo: grupoDeCategoria(categoria),
      };
    })
    .sort((a, b) => b.n - a.n);

  const { metricas } = modelo;

  return {
    osm: {
      totalComercios: osm.resumen.total_comercios,
      conNombre: osm.resumen.con_nombre ?? 0,
      sinNombre: osm.resumen.sin_nombre ?? 0,
      constelaciones: osm.resumen.constelaciones,
      sueltos: osm.resumen.puntos_sueltos,
      sinCalle: osm.resumen.constelaciones_sin_calle ?? null,
      osmBase: osm.osm_base,
      fechaCorrida: osm.fecha_corrida,
      licencia: 'ODbL 1.0',
      minCluster: osm.metodo.min_cluster_size,
      minMuestras: osm.metodo.min_samples,
      seleccion: osm.metodo.cluster_selection_method,
    },
    filas: osm.constelaciones.map((c) => ({
      id: c.id,
      codigo: c.codigo ?? c.id.toUpperCase(),
      nombre: c.nombre ?? c.id,
      tamano: c.tamano,
      radioM: Math.round(c.radio_m),
      mezcla: lineaMezcla(c),
    })),
    barras,
    cielo: proyectar(),
    posicionesHorizonte: lonsComercios.map((lon) => (lon - minLon) / rango),
    red: {
      datos: abiertos.status === 'fulfilled' ? abiertos.value : null,
      portafolios: aprobados.status === 'fulfilled' ? aprobados.value : [],
    },
    modelo: {
      entrenadoCon: modelo.entrenado_con,
      fecha: modelo.fecha_corrida,
      umbralPorcentaje: Math.round(modelo.umbral_confianza * 100),
      f1Macro: metricas.f1_macro_holdout,
      f1LineaBase: metricas.f1_macro_linea_base_mayoritaria,
      exactitud: metricas.accuracy_holdout,
      nHoldout: metricas.n_holdout,
      f1Comuna3: metricas.f1_macro_holdout_geografico_comuna3,
      nComuna3: metricas.n_holdout_geografico,
    },
  };
}
