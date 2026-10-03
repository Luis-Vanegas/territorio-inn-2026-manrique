import 'server-only';
import { sql } from './neon';
import { esModeradorGoogle } from '@/lib/auth/moderadoresGoogle';

/**
 * Accesos que decide el equipo (dominio A · Identidad y acceso): qué cuenta es
 * dueña de qué negocio y quién es moderador. Lo llaman solo Server Actions y
 * páginas del panel del equipo, que ya revalidaron `admin_session`.
 *
 * La identidad de una cuenta es `google_sub`; acá el correo solo UBICA la fila
 * que el moderador eligió de la lista de cuentas existentes. Nada de esto vincula
 * por coincidencia de correo con la ficha: el correo de una ficha no está
 * verificado y vincular por él sería entregarle el negocio a quien lo escribió.
 */

export type Cuenta = { id: string; nombre: string; correo: string };

/** Todas las cuentas que entraron alguna vez con Google, para el buscador del panel. */
export async function listarCuentas(): Promise<Cuenta[]> {
  const rows = await sql`select id, nombre, correo from usuarios order by nombre, correo`;
  return rows as Cuenta[];
}

export type AccesoNegocio = {
  id: string;
  token_publico: string;
  dueno_id: string | null;
  dueno_nombre: string | null;
  dueno_correo: string | null;
};

/** Dueño y enlace personal de cada ficha que muestra el panel. */
export async function accesosDeNegocios(ids: readonly string[]): Promise<AccesoNegocio[]> {
  if (ids.length === 0) return [];
  const rows = await sql`
    select p.id, p.token_publico, u.id as dueno_id, u.nombre as dueno_nombre, u.correo as dueno_correo
    from portafolios p
    left join usuarios u on u.id = p.usuario_id
    where p.id = any(${[...ids]}::uuid[])
  `;
  return rows as AccesoNegocio[];
}

/** ¿El negocio de este enlace ya está en una cuenta? Para no ofrecer «guardar en mi cuenta» de más. */
export async function negocioTieneDueno(token: string): Promise<boolean> {
  const rows = await sql`select 1 from portafolios where token_publico = ${token} and usuario_id is not null`;
  return rows.length > 0;
}

export type ResultadoVincular =
  | { estado: 'vinculado' | 'reasignado'; cuenta: string }
  | { estado: 'sin_cuenta' | 'sin_negocio' | 'ya_era_suyo' | 'tiene_dueno' };

/**
 * Vincula el negocio a la cuenta de ese correo. Sin `reasignar`, solo si el
 * negocio no tiene dueño; con `reasignar` (confirmación explícita en la
 * pantalla), también si tiene otro. El `where` es el candado, no la pantalla:
 * dos moderadores a la vez no pisan un dueño sin haberlo confirmado.
 *
 * `p` lee la fila ANTES del update (mismo snapshot), así que dice si había dueño.
 */
export async function vincularPorEquipo(
  portafolioId: string,
  correo: string,
  reasignar: boolean,
): Promise<ResultadoVincular> {
  const rows = (await sql`
    with u as (select id, nombre from usuarios where correo = ${correo}),
    p as (select id, usuario_id from portafolios where id = ${portafolioId} and estado <> 'archivado'),
    cambio as (
      update portafolios set usuario_id = u.id
      from u
      where portafolios.id = ${portafolioId} and portafolios.estado <> 'archivado'
        and (portafolios.usuario_id is null or (${reasignar} and portafolios.usuario_id <> u.id))
      returning portafolios.id
    )
    select
      exists (select 1 from u) as hay_cuenta,
      exists (select 1 from p) as hay_negocio,
      (select u.nombre from u) as nombre,
      (select p.usuario_id from p) as dueno_previo,
      (select u.id from u) as cuenta_id,
      exists (select 1 from cambio) as cambio
  `) as {
    hay_cuenta: boolean;
    hay_negocio: boolean;
    nombre: string | null;
    dueno_previo: string | null;
    cuenta_id: string | null;
    cambio: boolean;
  }[];

  const r = rows[0]!;
  if (!r.hay_negocio) return { estado: 'sin_negocio' };
  if (!r.hay_cuenta) return { estado: 'sin_cuenta' };
  if (r.cambio) return { estado: r.dueno_previo ? 'reasignado' : 'vinculado', cuenta: r.nombre ?? correo };
  return { estado: r.dueno_previo === r.cuenta_id ? 'ya_era_suyo' : 'tiene_dueno' };
}

/** false si el negocio ya no tenía dueño. */
export async function desvincularPorEquipo(portafolioId: string): Promise<boolean> {
  const rows = await sql`
    update portafolios set usuario_id = null
    where id = ${portafolioId} and usuario_id is not null
    returning id
  `;
  return rows.length > 0;
}

// ─── Moderadores ─────────────────────────────────────────────

export type Moderador = {
  email: string;
  nombre: string;
  activo: boolean;
  con_contrasena: boolean;
  /** Entra con Google por base (`admins.google_sub`). El `sub` no sale de este archivo. */
  con_google: boolean;
  /** Su `sub` está además en ADMIN_GOOGLE_SUBS (respaldo del despliegue). */
  en_entorno: boolean;
  /** AAAA-MM-DD; null si nunca se desactivó o se reactivó después. */
  desactivado_en: string | null;
  desactivado_por: string | null;
};

export async function listarModeradores(): Promise<Moderador[]> {
  const rows = (await sql`
    select email, nombre, activo,
      password_hash <> 'sin-acceso' as con_contrasena,
      google_sub,
      to_char(desactivado_en at time zone 'America/Bogota', 'YYYY-MM-DD') as desactivado_en,
      desactivado_por
    from admins
    order by activo desc, nombre
  `) as (Omit<Moderador, 'con_google' | 'en_entorno'> & { google_sub: string | null })[];
  return rows.map(({ google_sub, ...m }) => ({
    ...m,
    con_google: google_sub !== null,
    en_entorno: google_sub !== null && esModeradorGoogle(google_sub),
  }));
}

export type ResultadoDesactivar = 'desactivado' | 'es_usted' | 'ultimo' | 'no_activo';

/**
 * Desactiva a un moderador. Nunca a quien lo pide ni al último activo.
 *
 * En una transacción SERIALIZABLE: dos moderadores desactivándose el uno al otro
 * a la vez leen cada uno al otro como activo y, en READ COMMITTED, los dos
 * pasarían y el panel quedaría sin nadie. Serializable aborta uno (40001).
 */
export async function desactivarModerador(email: string, actor: string): Promise<ResultadoDesactivar> {
  if (email === actor) return 'es_usted';

  const [filas] = (await sql.transaction(
    (tx) => [
      tx`
        update admins
        set activo = false, desactivado_en = now(), desactivado_por = ${actor}
        where email = ${email} and activo
          and exists (select 1 from admins otro where otro.activo and otro.email <> ${email})
        returning email
      `,
    ],
    { isolationLevel: 'Serializable' },
  )) as unknown as [{ email: string }[]];

  if (filas.length > 0) return 'desactivado';

  // No cambió nada: o ya estaba inactivo (o no existe), o era el último activo.
  const [estado] = (await sql`select activo from admins where email = ${email}`) as { activo: boolean }[];
  return estado?.activo ? 'ultimo' : 'no_activo';
}
