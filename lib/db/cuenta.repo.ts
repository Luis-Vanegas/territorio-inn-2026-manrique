import 'server-only';
import { sql } from './neon';
import type { PerfilParaTi } from './convocatorias.repo';
import { K_MINIMO } from '@/lib/privacidad/kAnonimato';

/**
 * Lecturas del panel del negocio (antes «Mi cuenta») que cruzan datos de un negocio con la sesión del
 * vecino. TODA consulta de este archivo filtra por `p.usuario_id = ${usuarioId}`
 * (el id sale de la sesión, nunca del formulario) y `scripts/verificar-clientes.mjs`
 * falla si una consulta nueva lo olvida. Mismo patrón que `clientes.repo.ts`.
 */

/**
 * Categoría y formalidad de cada negocio de esta cuenta: con eso se filtra «Para
 * ti» (`convocatoriasParaTi`). La formalidad sale de `aliados_investigacion`,
 * que es privada: no viaja a la pantalla, solo filtra en el servidor.
 */
export async function perfilesParaTi(usuarioId: string): Promise<PerfilParaTi[]> {
  const rows = (await sql`
    select distinct p.categoria_id, i.formalidad
    from portafolios p
    left join aliados_investigacion i on i.portafolio_id = p.id
    where p.usuario_id = ${usuarioId}
      and p.estado <> 'archivado'
      and p.categoria_id is not null
  `) as PerfilParaTi[];
  return rows;
}

export type SemanaInteraccion = { vistas: number; contactos: number };

/** Semanas que baja el gráfico del inicio: las 4 últimas contra las 4 de antes. */
export const SEMANAS_EN_NUMEROS = 8;

/**
 * Vistas y contactos de UN negocio de esta cuenta, en `SEMANAS_EN_NUMEROS`
 * ventanas de 7 días que terminan hoy, de la más vieja a la más nueva (la última
 * es «los últimos 7 días»). Una semana sin una sola interacción sale en cero: un
 * hueco también dice algo. Solo conteos agregados de `interacciones_portafolio`:
 * no hay forma de saber quién miró.
 *
 * `current_date` es el de la base, el mismo con el que se escribe cada fila, así
 * que las ventanas y los días guardados siempre hablan de la misma fecha.
 */
export async function semanasDeNegocio(
  usuarioId: string,
  portafolioId: string,
): Promise<SemanaInteraccion[]> {
  const rows = (await sql`
    select
      coalesce(sum(i.conteo) filter (where i.tipo = 'vista'), 0)::int    as vistas,
      coalesce(sum(i.conteo) filter (where i.tipo = 'contacto'), 0)::int as contactos
    from portafolios p
    cross join generate_series(0, ${SEMANAS_EN_NUMEROS - 1}) as s(n)
    left join interacciones_portafolio i
      on i.portafolio_id = p.id
     and (current_date - i.dia) between s.n * 7 and s.n * 7 + 6
    where p.id = ${portafolioId}
      and p.usuario_id = ${usuarioId}
    group by s.n
    order by s.n desc
  `) as SemanaInteraccion[];
  return rows;
}

export type ComparacionCategoria = {
  /** Negocios publicados en la misma categoría (incluye al tuyo). Siempre >= K_MINIMO. */
  negocios: number;
  /** Contactos por cada 100 vistas del conjunto, últimas 4 semanas. */
  contactosPor100: number;
};

/**
 * Cómo le va a la categoría de este negocio, SOLO si hay al menos `K_MINIMO` (5)
 * negocios publicados en ella: con menos, el promedio señalaría a uno o dos
 * vecinos con nombre y apellido (regla k = 5 de `lib/privacidad/kAnonimato.ts`,
 * la misma de los datos abiertos). Devuelve null si el negocio no es de esta
 * cuenta, no está publicado, es de «Otros» (esa categoría junta rubros que no
 * se parecen: compararlos no dice nada) o el conjunto no llega a 5. Nunca
 * devuelve cifras de un negocio en particular, solo la razón del conjunto.
 */
export async function comparacionCategoria(
  usuarioId: string,
  portafolioId: string,
): Promise<ComparacionCategoria | null> {
  const rows = (await sql`
    with mio as (
      select p.categoria_id
      from portafolios p
      where p.id = ${portafolioId}
        and p.usuario_id = ${usuarioId}
        and p.estado = 'aprobado'
        and p.categoria_id <> 'otros'
    )
    select
      count(distinct o.id)::int as negocios,
      coalesce(sum(i.conteo) filter (where i.tipo = 'vista'), 0)::int    as vistas,
      coalesce(sum(i.conteo) filter (where i.tipo = 'contacto'), 0)::int as contactos
    from mio
    join portafolios o on o.categoria_id = mio.categoria_id and o.estado = 'aprobado'
    left join interacciones_portafolio i
      on i.portafolio_id = o.id
     and i.dia > current_date - 28
  `) as { negocios: number; vistas: number; contactos: number }[];

  const r = rows[0];
  if (!r || r.negocios < K_MINIMO || r.vistas === 0) return null;
  return {
    negocios: r.negocios,
    contactosPor100: Math.round((r.contactos / r.vistas) * 1000) / 10,
  };
}

