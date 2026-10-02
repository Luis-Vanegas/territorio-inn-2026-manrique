/**
 * Punto en polígono, una sola vez. Lo comparten `dentroDeManrique.ts` (la comuna)
 * y `barrioOficial.ts` (cada barrio): sin esto, el ray casting vivía en dos lados.
 *
 * Pura y sin imports de valor: los verificadores la cargan con
 * `--experimental-strip-types`.
 */

export type Anillo = readonly (readonly number[])[]; // [lng, lat][]

/** Los anillos de una geometría GeoJSON Polygon o MultiPolygon (otra cosa: ninguno). */
export function anillosDe(geometria: { type: string; coordinates: unknown }): Anillo[] {
  if (geometria.type === 'Polygon') return geometria.coordinates as Anillo[];
  if (geometria.type === 'MultiPolygon') return (geometria.coordinates as Anillo[][]).flat();
  return [];
}

/**
 * Ray casting even-odd sobre un conjunto de anillos: un hueco, si lo hubiera,
 * queda fuera. Sin dependencias: @turf pesa de más para mandarlo al navegador.
 */
export function dentroDeAnillos(anillos: readonly Anillo[], lat: number, lng: number): boolean {
  let dentro = false;
  for (const anillo of anillos) {
    for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
      const [xi, yi] = anillo[i] as [number, number];
      const [xj, yj] = anillo[j] as [number, number];
      if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
        dentro = !dentro;
      }
    }
  }
  return dentro;
}
