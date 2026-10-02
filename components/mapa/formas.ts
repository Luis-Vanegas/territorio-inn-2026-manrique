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

/** Estrella de cuatro puntas: un comercio de OpenStreetMap (no es aliado). */
export function svgEstrella(tamano: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamano}" height="${tamano}" viewBox="-1 -1 26 26" aria-hidden="true" focusable="false"><path d="M12 0 L14.6 9.4 L24 12 L14.6 14.6 L12 24 L9.4 14.6 L0 12 L9.4 9.4 Z" fill="${FONDO_ESTRELLA}" stroke="${TRAZO_ESTRELLA}" stroke-width="1.5" stroke-linejoin="round" paint-order="stroke"/></svg>`;
}

/** Punto suelto de OSM: un comercio que no cayó en ninguna constelación. Más tenue que la estrella. */
export function svgPunto(tamano: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamano}" height="${tamano}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5" fill="${FONDO_ESTRELLA}" fill-opacity="0.5" stroke="${TRAZO_ESTRELLA}" stroke-opacity="0.5" stroke-width="1"/></svg>`;
}
