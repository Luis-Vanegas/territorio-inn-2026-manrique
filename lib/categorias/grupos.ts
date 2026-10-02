/**
 * Los 6 grupos de categoría (DESIGN.md › Firmamento › Categorías).
 *
 * Es el ÚNICO lugar que sabe qué categoría del sitio cae en qué grupo. El mapa,
 * la leyenda y lo que venga después (/firmamento, fichas) leen de acá. Agregar
 * una categoría nueva a la base = agregar su id al grupo que corresponda; si se
 * olvida, cae en «Otros» y el mapa sigue funcionando.
 *
 * El color refuerza y la forma identifica: las parejas de colores más cercanas
 * bajan a ΔE 11,6 en daltonismo, por eso cada grupo tiene su forma.
 */

import { PALETA_NOCHE } from '../paleta';

export type IdGrupo = 'comida' | 'tienda' | 'belleza' | 'oficios' | 'salud' | 'otros';

export type Forma = 'circulo' | 'cuadrado' | 'rombo' | 'triangulo' | 'cruz' | 'anillo';

export type Grupo = {
  id: IdGrupo;
  nombre: string;
  /** Hex fijo del token de DESIGN.md (los de noche no cambian con el tema). */
  color: string;
  forma: Forma;
  /** Nombre de la forma, para la leyenda y los textos alternativos. */
  formaNombre: string;
};

export const GRUPOS: readonly Grupo[] = [
  { id: 'comida', nombre: 'Comida', color: PALETA_NOCHE.ladrillo, forma: 'circulo', formaNombre: 'círculo' },
  { id: 'tienda', nombre: 'Tienda', color: PALETA_NOCHE.sodio, forma: 'cuadrado', formaNombre: 'cuadrado' },
  { id: 'belleza', nombre: 'Belleza', color: PALETA_NOCHE['noche-morado'], forma: 'rombo', formaNombre: 'rombo' },
  {
    id: 'oficios',
    nombre: 'Oficios y reparación',
    color: PALETA_NOCHE['noche-azul'],
    forma: 'triangulo',
    formaNombre: 'triángulo',
  },
  { id: 'salud', nombre: 'Salud', color: PALETA_NOCHE.menta, forma: 'cruz', formaNombre: 'cruz' },
  { id: 'otros', nombre: 'Otros', color: PALETA_NOCHE.tenue, forma: 'anillo', formaNombre: 'anillo' },
] as const;

const POR_ID = Object.fromEntries(GRUPOS.map((g) => [g.id, g])) as Record<IdGrupo, Grupo>;

/**
 * Ids de `categorias` (migraciones 001, 012 y 015) y de `pipeline/comun.py`
 * (OSM usa los mismos ids). Incluye las 8 categorías viejas, desactivadas en la
 * 012 pero que algún portafolio antiguo todavía puede tener.
 */
const GRUPO_DE_CATEGORIA: Record<string, IdGrupo> = {
  // Comida
  comidas: 'comida',
  panaderia: 'comida',
  alimentacion: 'comida',
  // Tienda
  tienda_viveres: 'tienda',
  ropa_calzado: 'tienda',
  papeleria: 'tienda',
  mascotas: 'tienda',
  moda: 'tienda',
  hogar: 'tienda',
  // Belleza
  belleza_peluqueria: 'belleza',
  barberia: 'belleza',
  belleza: 'belleza',
  // Oficios y reparación
  modisteria: 'oficios',
  reparacion_linea_blanca: 'oficios',
  construccion: 'oficios',
  mecanica_motos: 'oficios',
  tecnologia_celulares: 'oficios',
  lavanderia: 'oficios',
  transporte_domicilios: 'oficios',
  tecnologia: 'oficios',
  servicios: 'oficios',
  // Salud
  salud_bienestar: 'salud',
  salud: 'salud',
  // Otros: educacion_cuidado, fotografia_eventos, reciclaje, educacion, otros,
  // sin_categoria y lo que no esté listado caen en el valor por defecto.
};

export function grupoDeCategoria(categoriaId: string | null | undefined): Grupo {
  return POR_ID[(categoriaId && GRUPO_DE_CATEGORIA[categoriaId]) || 'otros'];
}
