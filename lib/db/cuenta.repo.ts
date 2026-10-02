import 'server-only';
import { sql } from './neon';

/**
 * Lecturas de «Mi cuenta» que cruzan datos de un negocio con la sesión del
 * vecino. TODA consulta de este archivo filtra por `p.usuario_id = ${usuarioId}`
 * (el id sale de la sesión, nunca del formulario) y `scripts/verificar-clientes.mjs`
 * falla si una consulta nueva lo olvida. Mismo patrón que `clientes.repo.ts`.
 */

/** Categorías de los negocios de esta cuenta: con ellas se filtra «Para ti». */
export async function categoriasDe(usuarioId: string): Promise<string[]> {
  const rows = (await sql`
    select distinct p.categoria_id
    from portafolios p
    where p.usuario_id = ${usuarioId}
      and p.estado <> 'archivado'
      and p.categoria_id is not null
  `) as { categoria_id: string }[];
  return rows.map((r) => r.categoria_id);
}

export type MesInteraccion = {
  /** AAAA-MM. */
  mes: string;
  vistas: number;
  contactos: number;
};

export type NegocioEnNumeros = {
  portafolio_id: string;
  nombre: string;
  meses: MesInteraccion[];
};

export const MESES_EN_NUMEROS = 6;

/**
 * Vistas y contactos por mes de los negocios publicados de esta cuenta, los
 * últimos `MESES_EN_NUMEROS` meses. Los meses sin una sola interacción salen en
 * cero (un hueco también dice algo). Solo conteos agregados de
 * `interacciones_portafolio`: no hay forma de saber quién miró.
 */
export async function negociosEnNumeros(usuarioId: string): Promise<NegocioEnNumeros[]> {
  const rows = (await sql`
    select
      p.id as portafolio_id,
      p.nombre,
      to_char(m.mes, 'YYYY-MM') as mes,
      coalesce(sum(i.conteo) filter (where i.tipo = 'vista'), 0)::int    as vistas,
      coalesce(sum(i.conteo) filter (where i.tipo = 'contacto'), 0)::int as contactos
    from portafolios p
    cross join generate_series(
      date_trunc('month', current_date::timestamp) - make_interval(months => ${MESES_EN_NUMEROS - 1}),
      date_trunc('month', current_date::timestamp),
      interval '1 month'
    ) as m(mes)
    left join interacciones_portafolio i
      on i.portafolio_id = p.id
     and date_trunc('month', i.dia::timestamp) = m.mes
    where p.usuario_id = ${usuarioId}
      and p.estado = 'aprobado'
    group by p.id, p.nombre, p.creado_en, m.mes
    order by p.creado_en desc, m.mes
  `) as { portafolio_id: string; nombre: string; mes: string; vistas: number; contactos: number }[];

  const porNegocio = new Map<string, NegocioEnNumeros>();
  for (const r of rows) {
    let n = porNegocio.get(r.portafolio_id);
    if (!n) {
      n = { portafolio_id: r.portafolio_id, nombre: r.nombre, meses: [] };
      porNegocio.set(r.portafolio_id, n);
    }
    n.meses.push({ mes: r.mes, vistas: r.vistas, contactos: r.contactos });
  }
  return [...porNegocio.values()];
}
