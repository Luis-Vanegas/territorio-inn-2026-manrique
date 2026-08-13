import type { Coordenada } from './constantes';

/**
 * Distancia entre dos puntos, en metros (Haversine).
 *
 * Haversine y no Vincenty: a escala de barrio el error de asumir la Tierra
 * esférica es de centímetros, y acá el dato se redondea a cuadras. Vincenty
 * sería más código para una precisión que nadie va a ver.
 */
export function distanciaMetros(a: Coordenada, b: Coordenada): number {
  const R = 6_371_000;
  const rad = (g: number) => (g * Math.PI) / 180;

  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Distancia legible para alguien parado en la calle.
 *
 * Bajo el kilómetro se redondea a 50 m: el GPS de un celular tiene entre 5 y
 * 20 m de error, así que "a 327 m" es precisión inventada. "a 350 m" es honesto.
 */
export function formatearDistancia(metros: number): string {
  if (metros < 100) return 'a menos de 100 m';
  if (metros < 1000) return `a ${Math.round(metros / 50) * 50} m`;
  if (metros < 10_000) return `a ${(metros / 1000).toFixed(1)} km`;
  return `a ${Math.round(metros / 1000)} km`;
}
