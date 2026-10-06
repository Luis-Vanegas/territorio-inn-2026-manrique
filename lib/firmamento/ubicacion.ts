import { barrioDe } from '@/lib/geo/barrioOficial';
import { BARRIOS_COMUNA_3 } from '@/lib/geo/constantes';
import { dentroDeManrique, metrosAlBorde } from '@/lib/geo/dentroDeManrique';

/**
 * ¿Cuadran el punto y el barrio de una ficha? Una sola revisión para las alertas
 * del equipo (`calidad.ts`) y el aviso al dueño en su panel: cada uno lo dice con
 * sus palabras, pero la regla es la misma. Es una ayuda, no bloquea nada: la
 * regla de admisión sigue siendo `dentroDeManrique` en el schema.
 */

const sinTildes = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const BARRIOS = new Map(BARRIOS_COMUNA_3.map((b) => [sinTildes(b), b]));

export type RevisionUbicacion = {
  dentro: boolean;
  /** Metros al límite de la comuna; 0 si está dentro. */
  metrosFuera: number;
  /** El barrio declarado en la grafía oficial, o null si no es uno de los 15. */
  declarado: string | null;
  /** El barrio donde cae el punto, o null (fuera, o en un hueco entre dos). */
  oficial: string | null;
};

export function revisarUbicacion(f: {
  latitud: number;
  longitud: number;
  barrio: string;
  barrio_oficial?: string | null;
}): RevisionUbicacion {
  const dentro = dentroDeManrique(f.latitud, f.longitud);
  return {
    dentro,
    metrosFuera: dentro ? 0 : metrosAlBorde(f.latitud, f.longitud),
    declarado: BARRIOS.get(sinTildes(f.barrio)) ?? null,
    // El oficial guardado (033) y, si la fila es anterior al relleno, el del punto.
    oficial: f.barrio_oficial ?? (dentro ? barrioDe(f.latitud, f.longitud) : null),
  };
}

/** Hay algo que el dueño debería revisar: punto fuera o barrio que no cuadra con el punto. */
export function ubicacionPorRevisar(r: RevisionUbicacion): boolean {
  return !r.dentro || !r.declarado || (r.oficial !== null && r.declarado !== r.oficial);
}
