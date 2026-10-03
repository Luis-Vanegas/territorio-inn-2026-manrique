import 'server-only';
import { sql } from './neon';
import { DIAS_INVITACION, generarTokenInvitacion, hashTokenInvitacion } from '@/lib/auth/invitacion';

/**
 * Invitaciones (migración 035): un enlace de un solo uso que da acceso a una
 * entidad (fila en `miembros_entidad`) o al equipo (`admins.google_sub`).
 *
 * El token sale de acá UNA vez, al crearla, y nunca se guarda: la base tiene su
 * sha256. Por eso el panel no puede volver a mostrar un enlace; si se perdió, se
 * revoca y se crea otro.
 */

export type TipoInvitacion = 'entidad' | 'moderador';

export async function crearInvitacion(datos: {
  tipo: TipoInvitacion;
  entidadId: string | null;
  nota: string | null;
  creadaPor: string;
}): Promise<{ token: string } | null> {
  const token = generarTokenInvitacion();
  // `where exists`: una invitación a una entidad borrada o inactiva no nace.
  const rows = await sql`
    insert into invitaciones (token_hash, tipo, entidad_id, nota, creada_por, expira_en)
    select ${hashTokenInvitacion(token)}, ${datos.tipo}, ${datos.entidadId}::uuid, ${datos.nota},
      ${datos.creadaPor}, now() + make_interval(days => ${DIAS_INVITACION})
    where ${datos.tipo} = 'moderador'
       or exists (select 1 from entidades where id = ${datos.entidadId}::uuid and activa)
    returning id
  `;
  return rows.length > 0 ? { token } : null;
}

export type InvitacionPendiente = {
  id: string;
  tipo: TipoInvitacion;
  entidad_id: string | null;
  nota: string | null;
  creada_por: string;
  /** AAAA-MM-DD en Bogotá (texto: nada de `Date`). */
  creada_en: string;
  expira_en: string;
};

/** Las que todavía sirven: ni usadas, ni revocadas, ni vencidas. */
export async function listarInvitacionesPendientes(tipo: TipoInvitacion): Promise<InvitacionPendiente[]> {
  const rows = await sql`
    select id, tipo, entidad_id, nota, creada_por,
      to_char(creada_en at time zone 'America/Bogota', 'YYYY-MM-DD') as creada_en,
      to_char(expira_en at time zone 'America/Bogota', 'YYYY-MM-DD') as expira_en
    from invitaciones
    where tipo = ${tipo} and usada_en is null and revocada_en is null and expira_en > now()
    order by creada_en desc
  `;
  return rows as InvitacionPendiente[];
}

/** false si ya no estaba pendiente (la usaron o la revocó otro moderador). */
export async function revocarInvitacion(id: string): Promise<boolean> {
  const rows = await sql`
    update invitaciones set revocada_en = now()
    where id = ${id} and usada_en is null and revocada_en is null
    returning id
  `;
  return rows.length > 0;
}

export type VistaInvitacion = {
  tipo: TipoInvitacion;
  entidad: string | null;
  vigente: boolean;
};

/**
 * Lo que muestra /firmamento/invitacion/<token> antes de mandar a Google: a qué
 * invita y si todavía sirve. No consume nada. No distingue «vencida», «usada» y
 * «revocada»: a quien tiene el enlace le basta saber que ya no sirve.
 */
export async function verInvitacion(token: string): Promise<VistaInvitacion | null> {
  const rows = await sql`
    select i.tipo, e.nombre as entidad,
      (i.usada_en is null and i.revocada_en is null and i.expira_en > now()
        and (i.tipo = 'moderador' or coalesce(e.activa, false))) as vigente
    from invitaciones i
    left join entidades e on e.id = i.entidad_id
    where i.token_hash = ${hashTokenInvitacion(token)}
  `;
  return (rows[0] as VistaInvitacion | undefined) ?? null;
}

export type ResultadoConsumo =
  | { tipo: 'entidad'; entidadId: string }
  | { tipo: 'moderador'; email: string };

/**
 * Consume la invitación y da el acceso, en UNA sentencia: o pasa todo o nada.
 *
 * El `update ... where usada_en is null` es el candado del solo uso: dos
 * consumos a la vez se encolan sobre la misma fila y el segundo, al reevaluar el
 * `where`, ya la ve usada y no devuelve nada. Sin fila de `inv`, ningún CTE
 * siguiente escribe.
 *
 * Moderador: si este `sub` ya tiene fila en `admins`, se reactiva esa; si no, se
 * crea (o se ata a la fila de su correo, que Google acaba de verificar). La
 * identidad que queda es el `sub`, nunca el correo.
 */
export async function consumirInvitacion(
  token: string,
  cuenta: { usuarioId: string; sub: string; correo: string; nombre: string },
): Promise<ResultadoConsumo | null> {
  const correo = cuenta.correo.toLowerCase().trim();
  const rows = (await sql`
    with inv as (
      update invitaciones i
      set usada_por = ${cuenta.usuarioId}, usada_en = now()
      where i.token_hash = ${hashTokenInvitacion(token)}
        and i.usada_en is null and i.revocada_en is null and i.expira_en > now()
        and (i.tipo = 'moderador' or exists (select 1 from entidades e where e.id = i.entidad_id and e.activa))
      returning i.tipo, i.entidad_id, i.creada_por
    ),
    miembro as (
      insert into miembros_entidad (usuario_id, entidad_id, agregado_por)
      select ${cuenta.usuarioId}, inv.entidad_id, inv.creada_por from inv where inv.tipo = 'entidad'
      on conflict (usuario_id, entidad_id) do nothing
      returning entidad_id
    ),
    por_sub as (
      update admins a
      set activo = true, desactivado_en = null, desactivado_por = null
      from inv
      where inv.tipo = 'moderador' and a.google_sub = ${cuenta.sub}
      returning a.email
    ),
    por_correo as (
      insert into admins (email, nombre, password_hash, activo, google_sub)
      select ${correo}, ${cuenta.nombre || correo}, 'sin-acceso', true, ${cuenta.sub}
      from inv
      where inv.tipo = 'moderador' and not exists (select 1 from por_sub)
      on conflict (email) do update set
        google_sub = excluded.google_sub, activo = true, desactivado_en = null, desactivado_por = null
      returning email
    )
    select inv.tipo, inv.entidad_id,
      coalesce((select email from por_sub), (select email from por_correo)) as email
    from inv
  `) as { tipo: TipoInvitacion; entidad_id: string | null; email: string | null }[];

  const r = rows[0];
  if (!r) return null;
  if (r.tipo === 'entidad' && r.entidad_id) return { tipo: 'entidad', entidadId: r.entidad_id };
  if (r.tipo === 'moderador' && r.email) return { tipo: 'moderador', email: r.email };
  return null;
}
