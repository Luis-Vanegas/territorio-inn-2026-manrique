import type { Forma, Grupo } from '@/lib/categorias/grupos';
import { PALETA_NOCHE } from '@/lib/paleta';

/**
 * Las 6 formas de los grupos como SVG en texto: las usan los marcadores de
 * Leaflet (que son HTML, no React) y la leyenda, para que sean idénticas.
 * Contorno oscuro (`noche`) en todas: el amarillo, la menta y el gris claro de
 * los grupos Tienda, Salud y Otros se pierden sobre el gris de las teselas sin él.
 *
 * Con `tenue` (comercios de OpenStreetMap, que no son aliados) la misma forma
 * lleva contorno fino y relleno a 80 %: se lee como el mismo grupo pero queda
 * por debajo de los aliados, que son grandes y de color pleno.
 */

const CONTORNO = PALETA_NOCHE.noche;

const CUERPO: Record<Exclude<Forma, 'anillo'>, string> = {
  circulo: '<circle cx="12" cy="12" r="8"',
  cuadrado: '<rect x="4.5" y="4.5" width="15" height="15"',
  rombo: '<polygon points="12,2.5 21.5,12 12,21.5 2.5,12"',
  triangulo: '<polygon points="12,3 21.5,20 2.5,20"',
  cruz: '<polygon points="9,3 15,3 15,9 21,9 21,15 15,15 15,21 9,21 9,15 3,15 3,9 9,9"',
};

export function svgForma(grupo: Grupo, tamano: number, { tenue = false }: { tenue?: boolean } = {}): string {
  const base = `<svg xmlns="http://www.w3.org/2000/svg" width="${tamano}" height="${tamano}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">`;
  const opacidad = tenue ? ' fill-opacity="0.8" stroke-opacity="0.85"' : '';
  const trazo = tenue ? 1.5 : 2;
  if (grupo.forma === 'anillo') {
    // Hueco de verdad: borde oscuro por fuera y por dentro, banda de color en medio.
    return `${base}<circle cx="12" cy="12" r="7.5" fill="none" stroke="${CONTORNO}" stroke-width="${tenue ? 5 : 6}"${opacidad}/><circle cx="12" cy="12" r="7.5" fill="none" stroke="${grupo.color}" stroke-width="${tenue ? 2.5 : 3}"${opacidad}/></svg>`;
  }
  return `${base}${CUERPO[grupo.forma]} fill="${grupo.color}" stroke="${CONTORNO}" stroke-width="${trazo}" stroke-linejoin="round"${opacidad}/></svg>`;
}

/**
 * Estrella de cuatro puntas: el ÚNICO trazo (DESIGN.md › Firmamento › Motivos),
 * como subtrayecto de un `path` centrado en (cx, cy) y de radio r. Las puntas
 * están a r del centro y el cuello a r * 2,6 / 12 en cada eje. Lo usan el componente
 * `Estrella` (portada, /firmamento) y el cielo de /firmamento (muchas estrellas de distinto radio en un solo `path`).
 */
export function pathEstrella(cx: number, cy: number, r: number): string {
  const c = (r * 2.6) / 12;
  const n = (v: number) => +v.toFixed(3);
  return `M${n(cx)} ${n(cy - r)}L${n(cx + c)} ${n(cy - c)}L${n(cx + r)} ${n(cy)}L${n(cx + c)} ${n(cy + c)}L${n(cx)} ${n(cy + r)}L${n(cx - c)} ${n(cy + c)}L${n(cx - r)} ${n(cy)}L${n(cx - c)} ${n(cy - c)}Z`;
}

/** La estrella de 24 × 24 con 1 unidad de margen en el viewBox para que el trazo no se corte en las puntas. */
export const ESTRELLA_PATH = pathEstrella(12, 12, 12);
export const ESTRELLA_VIEWBOX = '-1 -1 26 26';

/**
 * Un negocio en el mapa (Luis, 4-oct-2026, como el tablero de la asesoría): una
 * estrella del color de su grupo; el TAMAÑO dice si es aliado (grande) o comercio
 * de OSM (chica). Contorno `noche` por lo mismo que `svgForma`: el amarillo y la
 * menta se pierden sobre las teselas claras sin él.
 */
export function svgEstrella(color: string, tamano: number): string {
  const trazo = tamano >= 20 ? 1.5 : 2.2; // en unidades del viewBox: la chica necesita más para verse
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamano}" height="${tamano}" viewBox="${ESTRELLA_VIEWBOX}" aria-hidden="true" focusable="false"><path d="${ESTRELLA_PATH}" fill="${color}" stroke="${CONTORNO}" stroke-width="${trazo}" stroke-linejoin="round"/></svg>`;
}
