import type { Forma, Grupo } from '@/lib/categorias/grupos';
import { PALETA_NOCHE } from '@/lib/paleta';

/**
 * Las 6 formas de los grupos como SVG en texto: las usan los marcadores de
 * Leaflet (que son HTML, no React) y la leyenda, para que sean idénticas.
 * Contorno oscuro (`noche`) en todas: el amarillo, la menta y el gris claro de
 * los grupos Tienda, Salud y Otros se pierden sobre el gris de las teselas sin él.
 */

const CONTORNO = PALETA_NOCHE.noche;
const FONDO_ESTRELLA = PALETA_NOCHE['noche-3'];
const TRAZO_ESTRELLA = PALETA_NOCHE.estrella;

const CUERPO: Record<Exclude<Forma, 'anillo'>, string> = {
  circulo: '<circle cx="12" cy="12" r="8"',
  cuadrado: '<rect x="4.5" y="4.5" width="15" height="15"',
  rombo: '<polygon points="12,2.5 21.5,12 12,21.5 2.5,12"',
  triangulo: '<polygon points="12,3 21.5,20 2.5,20"',
  cruz: '<polygon points="9,3 15,3 15,9 21,9 21,15 15,15 15,21 9,21 9,15 3,15 3,9 9,9"',
};

export function svgForma(grupo: Grupo, tamano: number): string {
  const base = `<svg xmlns="http://www.w3.org/2000/svg" width="${tamano}" height="${tamano}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">`;
  if (grupo.forma === 'anillo') {
    // Hueco de verdad: borde oscuro por fuera y por dentro, banda de color en medio.
    return `${base}<circle cx="12" cy="12" r="7.5" fill="none" stroke="${CONTORNO}" stroke-width="6"/><circle cx="12" cy="12" r="7.5" fill="none" stroke="${grupo.color}" stroke-width="3"/></svg>`;
  }
  return `${base}${CUERPO[grupo.forma]} fill="${grupo.color}" stroke="${CONTORNO}" stroke-width="2" stroke-linejoin="round"/></svg>`;
}

/**
 * Estrella de cuatro puntas: el ÚNICO trazo (DESIGN.md › Firmamento › Motivos),
 * como subtrayecto de un `path` centrado en (cx, cy) y de radio r. Las puntas
 * están a r del centro y el cuello a r * 2,6 / 12 en cada eje. Lo usan el marcador
 * del mapa (`svgEstrella`), el componente `Estrella` (portada, /firmamento) y el
 * cielo de /firmamento (muchas estrellas de distinto radio en un solo `path`).
 */
export function pathEstrella(cx: number, cy: number, r: number): string {
  const c = (r * 2.6) / 12;
  const n = (v: number) => +v.toFixed(3);
  return `M${n(cx)} ${n(cy - r)}L${n(cx + c)} ${n(cy - c)}L${n(cx + r)} ${n(cy)}L${n(cx + c)} ${n(cy + c)}L${n(cx)} ${n(cy + r)}L${n(cx - c)} ${n(cy + c)}L${n(cx - r)} ${n(cy)}L${n(cx - c)} ${n(cy - c)}Z`;
}

/** La estrella de 24 × 24 con 1 unidad de margen en el viewBox para que el trazo no se corte en las puntas. */
export const ESTRELLA_PATH = pathEstrella(12, 12, 12);
export const ESTRELLA_VIEWBOX = '-1 -1 26 26';

/** Estrella de cuatro puntas: un comercio de OpenStreetMap (no es aliado). */
export function svgEstrella(tamano: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamano}" height="${tamano}" viewBox="${ESTRELLA_VIEWBOX}" aria-hidden="true" focusable="false"><path d="${ESTRELLA_PATH}" fill="${FONDO_ESTRELLA}" stroke="${TRAZO_ESTRELLA}" stroke-width="1.5" stroke-linejoin="round" paint-order="stroke"/></svg>`;
}

/** Punto suelto de OSM: un comercio que no cayó en ninguna constelación. Más tenue que la estrella. */
export function svgPunto(tamano: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamano}" height="${tamano}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5" fill="${FONDO_ESTRELLA}" fill-opacity="0.5" stroke="${TRAZO_ESTRELLA}" stroke-opacity="0.5" stroke-width="1"/></svg>`;
}
