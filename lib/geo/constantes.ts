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

/**
 * Teselas del mapa base.
 *
 * ── Por qué se fue CARTO ──
 *
 * El sitio usaba `basemaps.cartocdn.com/light_all`, el endpoint gratuito y
 * sin clave. El 2026-08-29 CARTO empezó a estampar «API KEY REQUIRED» en
 * diagonal sobre cada tesela. Lo peor del cambio es cómo se manifiesta: la
 * petición sigue devolviendo 200 con un PNG válido, así que no hay error en
 * consola, no falla ningún chequeo y el mapa "funciona" — solo que ilegible.
 * Lo detectó una persona mirando la pantalla, no una herramienta.
 *
 * ── Por qué Esri y no OpenStreetMap ──
 *
 * Las dos sirven sin clave (verificado con una tesela real de Medellín: las
 * dos responden 200 con imagen). Pero el OSM estándar es a todo color —verdes
 * de parque, amarillos de vía— y pelea con la paleta editorial de tres
 * colores. World Light Gray Base es un lienzo gris claro, que es justo lo que
 * daba `light_all`: el mapa es el fondo, los puntos terracota son la
 * información.
 *
 * Ojo con el orden: Esri sirve {z}/{y}/{x}, con la Y antes que la X. Y no
 * tiene subdominios {s} ni variante retina {r}.
 *
 * La atribución es obligatoria y sale del propio servicio
 * (`.../MapServer?f=json`, campo copyrightText). No inventarla.
 *
 * Vive acá y no en cada mapa porque estaba duplicada en dos componentes: el
 * día que este proveedor haga lo mismo que CARTO, se cambia en un solo lugar.
 */
export const TESELAS = {
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  atribucion:
    'Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> y la comunidad GIS',
} as const;
