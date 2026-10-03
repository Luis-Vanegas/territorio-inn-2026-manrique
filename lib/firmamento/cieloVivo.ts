import 'server-only';

import barriosJson from '@/lib/geo/barrios-manrique.json';
import datosOsmJson from '@/public/firmamento/constelaciones.json';
import { POLIGONO_MANRIQUE } from '@/lib/geo/constantes';
import { fechaLarga, type DatosConstelaciones } from '@/lib/geo/constelaciones';
import { grupoDeCategoria, type IdGrupo } from '@/lib/categorias/grupos';
import { crearProyeccion } from './proyeccion';

/**
 * Geometría de la Constelación viva (DESIGN.md › Firmamento › Constelación viva),
 * resuelta UNA vez por proceso en el servidor: al navegador llega el SVG ya
 * dibujado, nunca los lat/lon ni los JSON de origen.
 */

const osm = datosOsmJson as unknown as DatosConstelaciones;
const barrios = barriosJson as unknown as {
  features: { properties: { nombre: string }; geometry: { coordinates: number[][][] } }[];
};

const ANCHO = 600;
const MARGEN = 16;
const DESTACADAS = 5;
/** Distancia mínima entre dos nombres, en unidades del viewBox (~1/5 del ancho). */
const SEPARACION = 120;

export type EstrellaViva = { x: number; y: number; grupo: IdGrupo };
export type Destacada = { codigo: string; nombre: string; x: number; y: number; radio: number };

export type CieloVivo = {
  ancho: number;
  alto: number;
  contorno: string;
  barrios: string[];
  /** Ordenadas del centro de la comuna hacia afuera: así se encienden. */
  estrellas: EstrellaViva[];
  /** Un trayecto por constelación (su árbol de expansión mínima). */
  lineas: string[];
  /** Las más grandes, con nombres cortos distintos. */
  destacadas: Destacada[];
  conteo: { comercios: number; constelaciones: number; barrios: number };
  fechaOsm: string;
};

/** «Carrera 31 · Tienda y víveres» → «Carrera 31»; «Barrio El Raizal · …» → «El Raizal». */
function nombreCorto(nombre: string | null, codigo: string): string {
  return (nombre ?? codigo).split(' · ')[0]!.replace(/^Barrio /, '');
}

function construir(): CieloVivo {
  const anillo = (POLIGONO_MANRIQUE.features[0]!.geometry as unknown as { coordinates: number[][][] })
    .coordinates[0]!;
  const p = crearProyeccion(anillo, ANCHO, MARGEN);
  const [cx, cy] = [p.ancho / 2, p.alto / 2];

  const todas = [...osm.constelaciones.flatMap((c) => c.estrellas), ...osm.puntos_sueltos];
  const estrellas = todas
    .map((e) => {
      const [x, y] = p.punto(e.lat, e.lon);
      return { x, y, grupo: grupoDeCategoria(e.categoria).id };
    })
    .sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));

  const lineas = osm.constelaciones.map((c) =>
    c.aristas
      .flatMap((a) => {
        const de = c.estrellas[a.de];
        const hasta = c.estrellas[a.a];
        if (!de || !hasta) return [];
        const [x1, y1] = p.punto(de.lat, de.lon);
        const [x2, y2] = p.punto(hasta.lat, hasta.lon);
        return [`M${x1} ${y1}L${x2} ${y2}`];
      })
      .join(''),
  );

  // Las más grandes, sin repetir nombre (C04 y C05 son las dos «El Raizal») y
  // separadas entre sí: las cinco mayores caen en el mismo núcleo y sus nombres
  // se encimaban. Así además se ve que hay constelaciones en varios barrios.
  const destacadas: Destacada[] = [];
  for (const c of [...osm.constelaciones].sort((a, b) => b.tamano - a.tamano)) {
    const codigo = c.codigo ?? c.id.toUpperCase();
    const nombre = nombreCorto(c.nombre, codigo);
    const [x, y] = p.punto(c.centroide.lat, c.centroide.lon);
    const choca = destacadas.some((d) => d.nombre === nombre || Math.hypot(d.x - x, d.y - y) < SEPARACION);
    if (choca) continue;
    // El halo sigue al radio p90 pero acotado: las constelaciones del borde son
    // ralas y su p90 se salía del contorno de la comuna.
    const radio = Math.min(Math.max(p.metros(c.radio_p90_m), 14), 30);
    destacadas.push({ codigo, nombre, x, y, radio });
    if (destacadas.length === DESTACADAS) break;
  }

  return {
    ancho: p.ancho,
    alto: p.alto,
    contorno: p.trazo(anillo),
    barrios: barrios.features.map((f) => p.trazo(f.geometry.coordinates[0]!)),
    estrellas,
    lineas,
    destacadas,
    conteo: {
      comercios: todas.length,
      constelaciones: osm.constelaciones.length,
      barrios: barrios.features.length,
    },
    fechaOsm: fechaLarga(osm.osm_base),
  };
}

export const CIELO_VIVO: CieloVivo = construir();
