/**
 * Proyección equirectangular local de la Comuna 3 a unidades de SVG: la usan el
 * cielo de /firmamento (`app/(site)/firmamento/datos.ts`) y la Constelación viva
 * (`lib/firmamento/cieloVivo.ts`), para que los dos dibujen el mismo territorio.
 *
 * A 6° de latitud la Tierra es casi plana en 3 km: alcanza con escalar la longitud
 * por cos(lat). Sin esa corrección la comuna saldría ensanchada.
 */

type Anillo = number[][];

export type Proyeccion = {
  ancho: number;
  alto: number;
  /** [x, y] en unidades del viewBox, redondeado a 0,1. */
  punto: (lat: number, lon: number) => [number, number];
  /** Un anillo GeoJSON ([lon, lat]) como trayecto cerrado de SVG. */
  trazo: (anillo: Anillo) => string;
  /** Metros a unidades del viewBox. */
  metros: (m: number) => number;
};

const METROS_POR_GRADO_LAT = 111_320;

export function crearProyeccion(contorno: Anillo, ancho: number, margen: number): Proyeccion {
  const lons = contorno.map((p) => p[0] as number);
  const lats = contorno.map((p) => p[1] as number);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const cos = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const k = (ancho - 2 * margen) / ((maxLon - minLon) * cos);

  const r1 = (n: number) => Math.round(n * 10) / 10;
  const punto = (lat: number, lon: number): [number, number] => [
    r1(margen + (lon - minLon) * cos * k),
    r1(margen + (maxLat - lat) * k),
  ];

  return {
    ancho,
    alto: Math.round((maxLat - minLat) * k + 2 * margen),
    punto,
    trazo: (anillo) =>
      anillo
        .map((p, i) => {
          const [x, y] = punto(p[1] as number, p[0] as number);
          return `${i === 0 ? 'M' : 'L'}${x} ${y}`;
        })
        .join(' ') + ' Z',
    metros: (m) => r1((m / METROS_POR_GRADO_LAT) * k),
  };
}
