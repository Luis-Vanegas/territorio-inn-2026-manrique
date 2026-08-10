import manrique from './manrique.json';

/**
 * Constantes geográficas de la Comuna 3, derivadas del polígono oficial.
 *
 * Todo sale de lib/geo/manrique.json, que genera scripts/extraer-manrique.mjs.
 * Ningún número está escrito a mano: si mañana cambia el límite oficial, se
 * re-corre el script y el mapa, la validación y los bounds se acomodan solos.
 *
 * El tipado es de tupla y no de array porque tsconfig tiene
 * noUncheckedIndexedAccess: con `number[]`, desestructurar da `number | undefined`.
 */

export type Coordenada = readonly [lat: number, lng: number];

/**
 * [minLng, minLat, maxLng, maxLat] — orden GeoJSON.
 * El import de JSON tipa `bbox` como number[], así que TypeScript no puede
 * saber que tiene exactamente cuatro elementos. El script que lo genera sí lo
 * garantiza, y el self-check de scripts/verificar-geo.mjs lo comprueba.
 */
export const BBOX_MANRIQUE = manrique.bbox as unknown as readonly [
  number, number, number, number,
];

/**
 * Centro por área del polígono. Leaflet pide [lat, lng]; el GeoJSON guarda
 * [lng, lat]. Invertir el par es el error clásico que manda el mapa al océano.
 */
export const CENTRO_MANRIQUE: Coordenada = [
  manrique.metadata.centro[1] as number,
  manrique.metadata.centro[0] as number,
];

/**
 * Límite de paneo, en el orden [[sur, oeste], [norte, este]] que espera Leaflet.
 * Se agrega un margen para que el borde de la comuna no quede pegado al canto
 * de la pantalla — sin él, un emprendimiento sobre el límite queda medio tapado.
 */
const MARGEN_GRADOS = 0.004; // ~450 m

export const LIMITES_MAPA: readonly [Coordenada, Coordenada] = [
  [BBOX_MANRIQUE[1] - MARGEN_GRADOS, BBOX_MANRIQUE[0] - MARGEN_GRADOS],
  [BBOX_MANRIQUE[3] + MARGEN_GRADOS, BBOX_MANRIQUE[2] + MARGEN_GRADOS],
];

export const ZOOM = {
  inicial: 14,
  minimo: 13,
  maximo: 18,
  /** Al elegir ubicación conviene arrancar más cerca, para poder afinar la cuadra. */
  seleccion: 16,
} as const;

/** El polígono en sí, para el <GeoJSON> de Leaflet y para turf. */
export const POLIGONO_MANRIQUE = manrique;
