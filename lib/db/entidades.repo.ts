import 'server-only';
import { sql } from './neon';
import type { EntidadNueva, TipoEntidad } from '@/lib/validation/entidad.schema';

/**
 * Entidades y sus miembros (migración 033). Una entidad publica convocatorias
 * (oferente) o mira el observatorio de la comuna (territorial); lo que le da
 * acceso al panel es tener una fila en `miembros_entidad`, no el tipo.
 *
 * Privacidad: este archivo NO toca `portafolios` ni ninguna tabla de negocios.
 * Una entidad solo ve agregados k = 5 (`obtenerDatosAbiertos`) y convocatorias;
 * `scripts/verificar-entidades.mjs` falla si una consulta de acá nombra una tabla
 * de negocios.
 */

export type Entidad = {
  id: string;
  nombre: string;
  tipo: TipoEntidad;
  sitio: string | null;
  activa: boolean;
  miembros: number;
};

export async function listarEntidades(): Promise<Entidad[]> {
  const rows = await sql`
    select e.id, e.nombre, e.tipo, e.sitio, e.activa,
      (select count(*)::int from miembros_entidad m where m.entidad_id = e.id) as miembros
    from entidades e
    order by e.activa desc, e.tipo, e.nombre
  `;
  return rows as Entidad[];
}

/** Devuelve el id, o `null` si ya existía una entidad con ese nombre. */
export async function crearEntidad(datos: EntidadNueva): Promise<string | null> {
  const rows = await sql`
    insert into entidades (nombre, tipo, sitio)
    values (${datos.nombre}, ${datos.tipo}, ${datos.sitio ?? null})
    on conflict (nombre) do nothing
    returning id
  `;
  return (rows[0] as { id: string } | undefined)?.id ?? null;
}

/**
 * Id de la entidad con este nombre; si no existe, la crea como `oferente`. Lo
 * usa la ingesta del vigía: el nombre sale de `pipeline/fuentes_convocatorias.json`
 * (lo escribe el equipo, no la página de un tercero) y viaja detrás del
 * secreto de la ingesta, así que crearla no abre una puerta: es agregar una
 * fuente nueva sin pedir otra migración. Una entidad desconocida entra ACTIVA
 * pero sin miembros: nadie gana acceso a nada por esto.
 *
 * El CTE resuelve los dos casos en una sola ida: si el insert no devuelve fila
 * (ya existía), el `union all` la busca por nombre.
 */
export async function resolverEntidadOferente(nombre: string): Promise<string> {
  const rows = await sql`
    with nueva as (
      insert into entidades (nombre, tipo) values (${nombre}, 'oferente')
      on conflict (nombre) do nothing
      returning id
    )
    select id from nueva
    union all
    select id from entidades where nombre = ${nombre}
    limit 1
  `;
  return (rows[0] as { id: string }).id;
}

export type EntidadDeUsuario = Pick<Entidad, 'id' | 'nombre' | 'tipo'>;

/**
 * Entidades activas de las que esta cuenta es miembro: con esto se autoriza el
 * panel de entidad. El `usuarioId` sale de `sesion_usuario`, nunca de un
 * formulario. Lista vacía = no entra.
 */
export async function entidadesDeUsuario(usuarioId: string): Promise<EntidadDeUsuario[]> {
  const rows = await sql`
    select e.id, e.nombre, e.tipo
    from miembros_entidad m
    join entidades e on e.id = m.entidad_id
    where m.usuario_id = ${usuarioId}
      and e.activa
    order by e.nombre
  `;
  return rows as EntidadDeUsuario[];
}

export type MiembroEntidad = {
  usuario_id: string;
  nombre: string;
  correo: string;
  agregado_por: string | null;
  /** AAAA-MM-DD. */
  creado_en: string;
};

/** Para el panel del equipo: quién entra por cada entidad. */
export async function listarMiembros(entidadId: string): Promise<MiembroEntidad[]> {
  const rows = await sql`
    select u.id as usuario_id, u.nombre, u.correo, m.agregado_por,
      to_char(m.creado_en at time zone 'America/Bogota', 'YYYY-MM-DD') as creado_en
    from miembros_entidad m
    join usuarios u on u.id = m.usuario_id
    where m.entidad_id = ${entidadId}
    order by m.creado_en
  `;
  return rows as MiembroEntidad[];
}

export type ResultadoAgregarMiembro = 'agregado' | 'ya_era_miembro' | 'sin_cuenta' | 'sin_entidad';

/**
 * Agrega como miembro a una cuenta que YA existe (la persona tuvo que entrar una
 * vez con Google). No crea usuarios: la identidad es `google_sub` y solo nace al
 * entrar con Google; el correo únicamente ubica la fila.
 */
export async function agregarMiembroPorCorreo(
  entidadId: string,
  correo: string,
  adminEmail: string,
): Promise<ResultadoAgregarMiembro> {
  const rows = (await sql`
    with u as (select id from usuarios where correo = ${correo.trim().toLowerCase()}),
    e as (select id from entidades where id = ${entidadId}),
    nuevo as (
      insert into miembros_entidad (usuario_id, entidad_id, agregado_por)
      select u.id, e.id, ${adminEmail} from u, e
      on conflict (usuario_id, entidad_id) do nothing
      returning usuario_id
    )
    select
      exists (select 1 from u) as hay_usuario,
      exists (select 1 from e) as hay_entidad,
      exists (select 1 from nuevo) as agregado
  `) as { hay_usuario: boolean; hay_entidad: boolean; agregado: boolean }[];

  // Un select sin from siempre devuelve exactamente una fila.
  const r = rows[0]!;
  if (!r.hay_entidad) return 'sin_entidad';
  if (!r.hay_usuario) return 'sin_cuenta';
  return r.agregado ? 'agregado' : 'ya_era_miembro';
}

/** Devuelve false si esa cuenta no era miembro de esa entidad. */
export async function quitarMiembro(entidadId: string, usuarioId: string): Promise<boolean> {
  const rows = await sql`
    delete from miembros_entidad
    where entidad_id = ${entidadId} and usuario_id = ${usuarioId}
    returning usuario_id
  `;
  return rows.length > 0;
}
