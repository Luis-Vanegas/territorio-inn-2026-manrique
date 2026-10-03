import 'server-only';
import { sql } from './neon';

/**
 * Sugeridor de categoría (migración 032, `sugerencias_categoria`). Guarda qué
 * categoría infirió el modelo y si la persona la aceptó. NUNCA el texto que se
 * escribió. Desde la 033 guarda también `portafolio_id` (si viene de un
 * registro): sin él, reentrenar con la categoría final de la ficha —después de
 * las correcciones del equipo— es imposible (docs/base-de-datos.md, H6). Eso
 * vuelve la fila cruzable con su negocio, por eso la tabla sigue siendo
 * privada: no se publica ni se expone fila a fila. La fecha queda truncada al
 * día, como antes.
 */
export async function guardarSugerenciaCategoria(datos: {
  portafolio_id?: string | null;
  categoria_inferida: string;
  confianza: number;
  aceptada: boolean | null;
  origen?: 'registro' | 'busqueda';
}): Promise<void> {
  await sql`
    insert into sugerencias_categoria (portafolio_id, categoria_inferida, confianza, origen, aceptada, creado_en)
    values (
      ${datos.portafolio_id ?? null},
      ${datos.categoria_inferida},
      ${Math.round(datos.confianza * 1000) / 1000},
      ${datos.origen ?? 'registro'},
      ${datos.aceptada},
      date_trunc('day', now())
    )
  `;
}

/**
 * De estas fichas, cuáles ya tienen una decisión del equipo sobre la categoría
 * (origen `moderacion`, 034; la escribe `decidirCategoriaFicha` de
 * portafolios.repo.ts junto con el cambio de categoría). La moderación esconde
 * «Usar» y «Mantener» en esas: otro clic no es otro ejemplo.
 */
export async function fichasConCategoriaRevisada(ids: readonly string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const rows = (await sql`
    select distinct portafolio_id::text as id
    from sugerencias_categoria
    where origen = 'moderacion' and portafolio_id = any(${[...ids]}::uuid[])
  `) as { id: string }[];
  return new Set(rows.map((r) => r.id));
}
