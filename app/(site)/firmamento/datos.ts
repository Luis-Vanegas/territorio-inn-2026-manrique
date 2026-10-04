import 'server-only';

import datosOsmJson from '@/public/firmamento/constelaciones.json';
import { BARRIOS_COMUNA_3 } from '@/lib/geo/constantes';
import { barrioDe } from '@/lib/geo/barrioOficial';
import type { DatosConstelaciones } from '@/lib/geo/constelaciones';
import {
  aplanarComercios,
  contarPorBarrio,
  contarPorCategoria,
  lineaMezcla,
  nombreCategoriaOsm,
  SIN_CATEGORIA,
} from '@/lib/geo/comerciosOsm';
import { grupoDeCategoria, type Grupo } from '@/lib/categorias/grupos';
import { obtenerDatosAbiertos, type DatosAbiertos } from '@/lib/db/datos.repo';

/**
 * Los datos públicos del territorio (portada, «El barrio en cifras») y del panel
 * de entidad, resueltos en el servidor y en un solo lugar. Vive acá por historia
 * (era la página pública /firmamento, que ahora redirige a /).
 *
 * - OSM: `public/firmamento/constelaciones.json`, import estático (solo viaja
 *   en el bundle del servidor; el navegador lo pide por fetch para el mapa).
 * - Aliados: SOLO el repo de datos abiertos (`obtenerDatosAbiertos`, regla k = 5),
 *   no un fetch a nuestra propia API. Si la base no responde, la página sigue y
 *   dice que no pudo consultarlo: no se inventa ni se deja en cero.
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

export type FilaConstelacion = {
  id: string;
  codigo: string;
  nombre: string;
  tamano: number;
  radioM: number;
  mezcla: string;
  /** Barrio oficial donde cae el centro de la constelación; null en un hueco entre polígonos. */
  barrio: string | null;
};

export type BarraCategoria = { id: string; nombre: string; n: number; grupo: Grupo };

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
  /** Comercios de OSM por barrio oficial (públicos): los 15 barrios, con 0 donde no hay. */
  barrios: { barrio: string; valor: number }[];
  red: { datos: DatosAbiertos | null };
};

// ── Lectura ─────────────────────────────────────────────────────────────

export async function leerFirmamento(): Promise<DatosFirmamento> {
  // Solo agregados: /firmamento nunca recibe aliados individuales (nombre,
  // dirección, coordenadas, contacto). Eso vive en /aliados.
  const [abiertos] = await Promise.allSettled([obtenerDatosAbiertos()]);
  if (abiertos.status === 'rejected') {
    console.error('[firmamento] datos abiertos no disponibles', abiertos.reason);
  }

  const comercios = aplanarComercios(osm);

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
      barrio: barrioDe(c.centroide.lat, c.centroide.lon),
    })),
    barras,
    barrios: contarPorBarrio(comercios, BARRIOS_COMUNA_3),
    red: {
      datos: abiertos.status === 'fulfilled' ? abiertos.value : null,
    },
  };
}
