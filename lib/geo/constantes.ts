import manrique from './manrique.json';

/**
 * Constantes geográficas de la Comuna 3, derivadas del polígono oficial.
 *
 * El registro ya no limita la ubicación a Manrique (ver migración 006): estas
 * constantes quedan solo como referencia visual y centro por defecto del mapa,
 * no como un límite que se hace cumplir.
 *
 * El tipado es de tupla y no de array porque tsconfig tiene
 * noUncheckedIndexedAccess: con `number[]`, desestructurar da `number | undefined`.
 */

export type Coordenada = readonly [lat: number, lng: number];

/**
 * Centro por área del polígono. Leaflet pide [lat, lng]; el GeoJSON guarda
 * [lng, lat]. Invertir el par es el error clásico que manda el mapa al océano.
 */
export const CENTRO_MANRIQUE: Coordenada = [
  manrique.metadata.centro[1] as number,
  manrique.metadata.centro[0] as number,
];

export const ZOOM = {
  inicial: 14,
  /** Bajo a propósito: sin límite de paneo, tiene que poder alejarse hasta ver el mundo entero. */
  minimo: 2,
  maximo: 18,
  /** Al elegir ubicación conviene arrancar más cerca, para poder afinar la cuadra. */
  seleccion: 16,
} as const;

/** El polígono en sí, para el <GeoJSON> de Leaflet — ahora solo referencia visual. */
export const POLIGONO_MANRIQUE = manrique;
