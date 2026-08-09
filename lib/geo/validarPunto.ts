import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { POLIGONO_MANRIQUE, BBOX_MANRIQUE } from './constantes';

/**
 * Verifica que un punto caiga dentro del límite oficial de la Comuna 3.
 *
 * Se usa en los dos lados a propósito:
 *  - en el cliente, para avisar mientras la persona arrastra el pin;
 *  - en la server action, porque el cliente se puede saltar con un curl.
 *
 * No hay estado ni I/O: el mismo módulo corre en el navegador y en el server.
 */

const FEATURES = POLIGONO_MANRIQUE.features as unknown as Feature<
  Polygon | MultiPolygon
>[];

/**
 * Descarte rápido por bounding box antes de la prueba real.
 * El point-in-polygon recorre 377 vértices; la comparación de bbox son cuatro
 * números. Con el pin arrastrándose y disparando en cada movimiento, importa.
 */
function dentroDelBbox(lat: number, lng: number): boolean {
  const [minLng, minLat, maxLng, maxLat] = BBOX_MANRIQUE;
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
}

export function estaDentroDeManrique(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (!dentroDelBbox(lat, lng)) return false;

  // GeoJSON usa [lng, lat]. Invertirlos acá es el bug que hace que la
  // validación diga "fuera de Manrique" para direcciones que sí están.
  const pt = point([lng, lat]);

  return FEATURES.some((f) => booleanPointInPolygon(pt, f));
}
