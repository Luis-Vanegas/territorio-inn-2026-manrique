import { PALETA_NOCHE } from './paleta.ts';

/**
 * Escalas secuenciales de las visualizaciones de Firmamento: el mapa de barrios
 * (comercios de OpenStreetMap por barrio) y la matriz de confusión del sugeridor.
 *
 * Una sola familia de color —del `noche-3` al `noche-azul` de DESIGN.md—, más
 * claro = más. Los tonos intermedios se mezclan de esos dos tokens, no son hex
 * nuevos. Pocas clases discretas y no una rampa continua, por dos razones: se
 * leen en una leyenda, y entre un 50 % y un 60 % de mezcla ni `estrella` ni
 * `noche` llegan a 4,5:1 como color del número que va encima; las clases saltan
 * esa zona. El color nunca es el único portador: el número va escrito.
 * `scripts/verificar-escalas.mjs` exige 4,5:1 de cada número contra su relleno.
 *
 * Puro y sin imports de valor salvo la paleta con extensión `.ts`: lo carga el
 * verificador con `--experimental-strip-types`.
 */

function aRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function mezclar(a: string, b: string, t: number): string {
  const [ra, rb] = [aRgb(a), aRgb(b)];
  return `#${ra.map((v, i) => Math.round(v + (rb[i]! - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

function luminancia(hex: string): number {
  const [r, g, b] = aRgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razón de contraste WCAG entre dos hex. */
export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** `estrella` o `noche`, el que más contraste dé sobre ese fondo. */
function textoSobre(fondo: string): string {
  return contraste(fondo, PALETA_NOCHE.estrella) >= contraste(fondo, PALETA_NOCHE.noche)
    ? PALETA_NOCHE.estrella
    : PALETA_NOCHE.noche;
}

const BASE = PALETA_NOCHE['noche-3'];
const TOPE = PALETA_NOCHE['noche-azul'];

export type Clase = {
  /** Desde qué valor (inclusive). */
  desde: number;
  /** Hasta qué valor (inclusive); `null` = sin tope. */
  hasta: number | null;
  etiqueta: string;
  relleno: string;
  /** Color del número sobre el relleno. */
  texto: string;
};

function clases(pasos: [desde: number, hasta: number | null, etiqueta: string, relleno: string][]): readonly Clase[] {
  return pasos.map(([desde, hasta, etiqueta, relleno]) => ({
    desde,
    hasta,
    etiqueta,
    relleno,
    texto: textoSobre(relleno),
  }));
}

// ── Mapa de barrios: conteos ────────────────────────────────────────────
// Cortes redondos y no cuantiles: el reparto es muy desigual (un barrio junta más
// de la mitad de los comercios) y «50 o más» le dice algo a un vecino; un cuantil no.

export type ClaseBarrio = Clase;

export const CLASES_BARRIO = clases([
  [0, 0, 'Sin comercios', PALETA_NOCHE['noche-2']],
  [1, 4, '1 a 4', mezclar(BASE, TOPE, 0.25)],
  [5, 19, '5 a 19', mezclar(BASE, TOPE, 0.42)],
  [20, 49, '20 a 49', mezclar(BASE, TOPE, 0.7)],
  [50, null, '50 o más', TOPE],
]);

export function claseDeBarrio(n: number): Clase {
  return CLASES_BARRIO.find((c) => n >= c.desde && (c.hasta === null || n <= c.hasta)) ?? CLASES_BARRIO[0]!;
}

// ── Matriz de confusión: proporción de la fila ──────────────────────────
// Cada celda es la parte de los locales de una categoría REAL que el modelo puso
// en esa columna (0 a 1). En porcentaje entero para que los bordes sean exactos.

export const CLASES_PROPORCION = clases([
  [0, 0, 'Ninguno', PALETA_NOCHE['noche-2']],
  [1, 5, 'Hasta 5 %', mezclar(BASE, TOPE, 0.15)],
  [6, 15, 'De 6 a 15 %', mezclar(BASE, TOPE, 0.3)],
  [16, 30, 'De 16 a 30 %', mezclar(BASE, TOPE, 0.45)],
  [31, 55, 'De 31 a 55 %', mezclar(BASE, TOPE, 0.7)],
  [56, null, 'Más de 55 %', TOPE],
]);

/** `porcentaje` entero 0–100 (se redondea hacia arriba lo que no es 0: 0,3 % cuenta como «Hasta 5 %»). */
export function claseDeProporcion(porcentaje: number): Clase {
  const p = porcentaje > 0 ? Math.max(1, Math.round(porcentaje)) : 0;
  return CLASES_PROPORCION.find((c) => p >= c.desde && (c.hasta === null || p <= c.hasta)) ?? CLASES_PROPORCION[0]!;
}
