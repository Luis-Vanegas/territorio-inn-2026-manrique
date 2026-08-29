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

/**
 * Barrios de la Comuna 3 que ofrece el formulario de registro.
 *
 * Estaba escrita a mano y DUPLICADA en el registro y en la página de
 * autogestión. Hoy las dos copias coincidían, pero es el mismo patrón que ya
 * dejó voseo sin corregir en lib/actions y etiquetas sin asociar en dos
 * formularios: dos copias de una lista se desincronizan en cuanto alguien
 * agrega un barrio en una sola.
 *
 * OJO — esta lista no está verificada contra una fuente oficial. El GeoJSON
 * de lib/geo/manrique.json solo trae el polígono de la comuna, sin barrios,
 * así que no hay de dónde derivarla. Una vecina del territorio mencionó
 * "Manrique Jardín", que no está acá; el mapa del inicio listaba "San Pablo",
 * que tampoco. Antes de darla por buena hay que contrastarla con el listado
 * de la Alcaldía. Mientras tanto el selector ofrece "Otro" con campo libre,
 * así que a nadie le impide registrarse — pero un barrio que falta obliga a
 * escribirlo a mano, y eso es fricción justo en el paso donde la gente
 * abandona.
 */
export const BARRIOS_COMUNA_3: string[] = [
  'El Raizal',
  'El Pomar',
  'La Salle',
  'Las Granjas',
  'Santa Inés',
  'Campo Valdés No. 1',
  'San José de la Cima No. 1',
  'San José de la Cima No. 2',
  'La Cruz',
  'Oriente',
  'Versalles No. 1',
  'Versalles No. 2',
  'Manrique Oriental',
  'Manrique Central No. 2',
  'María Cano - Carambolas',
];
