import manrique from './manrique.json' with { type: 'json' };

/**
 * ¿Cae este punto dentro de la Comuna 3? Pura, sin `server-only`: la usan el
 * schema de Zod (servidor), el selector del registro (navegador) y el verificador.
 *
 * Ray casting sobre los anillos del polígono oficial de GeoMedellín (even-odd,
 * así que un hueco, si lo hubiera, queda fuera). Sin dependencias: @turf pesa
 * de más para mandarlo al navegador solo por esto.
 *
 * ── Tolerancia de 40 m ──
 * Un punto a menos de 40 m del borde cuenta como dentro. Tres razones: el GPS de
 * un celular da 10–50 m; el polígono se simplificó con tolerancia de 0,00002°
 * (~2 m, ver extraer-manrique.mjs); y los límites de la comuna van por calles y
 * quebradas, donde un negocio en la acera de enfrente está en la comuna vecina
 * pero para el vecino «es de Manrique». 40 m no alcanza para colar a nadie de
 * otro barrio: los tres puntos que motivaron esto están a cientos de metros o más.
 * Súbela solo con evidencia; el margen es un hueco en la regla.
 */
export const TOLERANCIA_BORDE_M = 40;

type Anillo = readonly (readonly number[])[]; // [lng, lat][]

// Metros por grado en la latitud de Medellín; la aproximación plana sobra para
// distancias de decenas de metros.
const M_POR_GRADO_LAT = 111_320;
const M_POR_GRADO_LNG = 111_320 * Math.cos((6.27 * Math.PI) / 180);

const ANILLOS: Anillo[] = manrique.features.flatMap((f) => {
  const g = f.geometry as { type: string; coordinates: unknown };
  if (g.type === 'Polygon') return g.coordinates as Anillo[];
  if (g.type === 'MultiPolygon') return (g.coordinates as Anillo[][]).flat();
  return [];
});

function dentroDeAnillos(lat: number, lng: number): boolean {
  let dentro = false;
  for (const anillo of ANILLOS) {
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

/** Distancia en metros del punto al segmento más cercano de cualquier anillo. */
function distanciaAlBordeM(lat: number, lng: number): number {
  let mejor = Infinity;
  for (const anillo of ANILLOS) {
    for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
      const [ax, ay] = anillo[j] as [number, number];
      const [bx, by] = anillo[i] as [number, number];
      const dx = (bx - ax) * M_POR_GRADO_LNG;
      const dy = (by - ay) * M_POR_GRADO_LAT;
      const px = (lng - ax) * M_POR_GRADO_LNG;
      const py = (lat - ay) * M_POR_GRADO_LAT;
      const largo2 = dx * dx + dy * dy;
      const t = largo2 === 0 ? 0 : Math.max(0, Math.min(1, (px * dx + py * dy) / largo2));
      mejor = Math.min(mejor, Math.hypot(px - t * dx, py - t * dy));
    }
  }
  return mejor;
}

export function dentroDeManrique(lat: number, lon: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  return dentroDeAnillos(lat, lon) || distanciaAlBordeM(lat, lon) <= TOLERANCIA_BORDE_M;
}

/** Para el verificador y para reportar cuánto falta: metros al borde (0 si está dentro del polígono). */
export function metrosAlBorde(lat: number, lon: number): number {
  return dentroDeAnillos(lat, lon) ? 0 : distanciaAlBordeM(lat, lon);
}
