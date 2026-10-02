import barrios from './barrios-manrique.json' with { type: 'json' };
import { anillosDe, dentroDeAnillos, type Anillo } from './puntoEnPoligono.ts';

/**
 * ¿En qué barrio oficial cae este punto? Devuelve el nombre en la grafía de
 * `BARRIOS_COMUNA_3` (la que se guarda en `portafolios.barrio`), o `null` si cae
 * fuera de los 15 barrios de la Comuna 3 o en un hueco entre dos (los polígonos
 * dejan ~0,1 % de la comuna sin cubrir, ver scripts/extraer-barrios.mjs).
 *
 * Pura, sin `server-only`: la usan el registro (navegador) y el verificador.
 * Sin tolerancia de borde a propósito: es una ayuda para detectar un barrio mal
 * elegido, no una regla de admisión (esa sigue siendo `dentroDeManrique`). Un
 * punto sobre la frontera puede caer de cualquiera de los dos lados.
 *
 * Fuente de los polígonos: Alcaldía de Medellín (ver `metadata.fuente` en
 * barrios-manrique.json).
 */

const BARRIOS: { nombre: string; anillos: Anillo[] }[] = barrios.features.map((f) => ({
  nombre: f.properties.nombre,
  anillos: anillosDe(f.geometry),
}));

export function barrioDe(lat: number, lon: number): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return BARRIOS.find((b) => dentroDeAnillos(b.anillos, lat, lon))?.nombre ?? null;
}
