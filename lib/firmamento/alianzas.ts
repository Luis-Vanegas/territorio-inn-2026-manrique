/**
 * Posibles alianzas de un negocio: la regla es una tabla de rubros
 * COMPLEMENTARIOS escrita a mano, simple a propósito y fácil de discutir.
 *
 * Idea: el cliente que le compra a uno suele necesitar al otro (quien compra
 * ropa necesita arreglos; quien pide almuerzo necesita pan). Nunca el mismo
 * rubro: eso es competencia, no alianza. No hay modelo ni puntaje: dos negocios
 * son «posible alianza» si su par de categorías está en `PARES`. La tabla es
 * simétrica (se escribe una vez por pareja) y usa los ids de `categorias`, los
 * mismos que usa OpenStreetMap en `public/firmamento/constelaciones.json`.
 * Una categoría que no esté en ninguna pareja (p. ej. «otros») no sugiere nada:
 * mejor callar que inventar una alianza. Para ampliar, se agrega una pareja.
 *
 * Pura y sin `server-only`.
 */

const PARES: readonly (readonly [string, string])[] = [
  ['comidas', 'panaderia'],
  ['comidas', 'tienda_viveres'],
  ['comidas', 'transporte_domicilios'],
  ['comidas', 'fotografia_eventos'],
  ['panaderia', 'tienda_viveres'],
  ['panaderia', 'fotografia_eventos'],
  ['ropa_calzado', 'modisteria'],
  ['ropa_calzado', 'lavanderia'],
  ['ropa_calzado', 'belleza_peluqueria'],
  ['ropa_calzado', 'fotografia_eventos'],
  ['modisteria', 'lavanderia'],
  ['belleza_peluqueria', 'salud_bienestar'],
  ['belleza_peluqueria', 'fotografia_eventos'],
  ['barberia', 'ropa_calzado'],
  ['barberia', 'salud_bienestar'],
  ['mecanica_motos', 'transporte_domicilios'],
  ['mecanica_motos', 'tecnologia_celulares'],
  ['tecnologia_celulares', 'papeleria'],
  ['reparacion_linea_blanca', 'construccion'],
  ['reparacion_linea_blanca', 'tecnologia_celulares'],
  ['construccion', 'papeleria'],
  ['mascotas', 'salud_bienestar'],
  ['mascotas', 'tienda_viveres'],
  ['educacion_cuidado', 'papeleria'],
  ['educacion_cuidado', 'salud_bienestar'],
  ['reciclaje', 'construccion'],
  ['diseno_publicidad', 'papeleria'],
  ['diseno_publicidad', 'fotografia_eventos'],
];

/** ¿Estos dos rubros se complementan? (en cualquier orden) */
export function seComplementan(a: string | null, b: string | null): boolean {
  if (!a || !b || a === b) return false;
  return PARES.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/**
 * De una lista de vecinos (ya ordenada de más cerca a más lejos), los que son
 * rubro complementario del negocio, hasta `max`. Conserva el orden de entrada.
 */
export function posiblesAlianzas<T extends { categoria: string | null }>(
  categoriaPropia: string,
  vecinos: readonly T[],
  max = 5,
): T[] {
  return vecinos.filter((v) => seComplementan(categoriaPropia, v.categoria)).slice(0, max);
}
