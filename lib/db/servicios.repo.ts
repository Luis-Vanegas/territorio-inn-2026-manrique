import 'server-only';
import { sql } from './neon';

/**
 * Repositorio PÚBLICO del módulo Servicios.
 *
 * Este archivo no sabe que existe `servicios_privado`, y es a propósito: la
 * consulta de la vitrina no puede filtrar un dato reservado ni por error,
 * porque nunca lo nombra. La separación es estructural, no una cláusula
 * `select` que alguien puede olvidar al agregar una columna.
 *
 * Los datos de caracterización viven en `lib/db/serviciosPrivado.repo.ts`.
 */

/**
 * Lo que viaja al cliente. No incluye correo, ni IP, ni caracterización, ni
 * foto — la foto vive en `servicios_privado` (ver `serviciosPrivado.repo.ts`):
 * es un dato reservado para identificar a la persona si hace falta, no un
 * elemento de la ficha pública.
 */
export type Servicio = {
  id: string;
  nombre: string;
  categoria_id: string;
  categoria_nombre: string;
  categoria_otra: string | null;
  descripcion: string;
  anos_experiencia: number;
  cobertura: string[];
  telefono: string;
  /** Fecha en que aceptó el compromiso y autorizó sus datos. Se muestra en la ficha. */
  creado_en: string;
};

/** Las columnas públicas, en un solo lugar: agregar una es una decisión consciente. */
const COLUMNAS_PUBLICAS = `
  s.id,
  s.nombre,
  s.categoria_id,
  c.nombre as categoria_nombre,
  s.categoria_otra,
  s.descripcion,
  s.anos_experiencia,
  s.cobertura,
  s.telefono,
  to_char(s.creado_en, 'YYYY-MM-DD') as creado_en
`;

/**
 * Los aprobados para la vitrina. Ordena por experiencia y después por
 * antigüedad del registro: sin niveles de verificación que ordenar, la
 * experiencia declarada es el único criterio con sentido para el vecino.
 */
export async function listarServiciosAprobados(): Promise<Servicio[]> {
  const rows = await sql`
    select ${sql.unsafe(COLUMNAS_PUBLICAS)}
    from servicios s
    join categorias c on c.id = s.categoria_id
    where s.estado = 'aprobado'
    order by s.anos_experiencia desc, s.creado_en desc
  `;
  return rows as Servicio[];
}

export type NuevoServicio = {
  nombre: string;
  categoria_id: string;
  categoria_otra: string | null;
  descripcion: string;
  anos_experiencia: number;
  cobertura: string[];
  telefono: string;
  version_terminos: string;
};

/**
 * Inserta como 'pendiente'. No se publica hasta que un moderador lo apruebe —
 * y en este módulo la moderación importa más que en Aliados: acá se publica a
 * una persona que va a entrar a casas ajenas.
 */
export async function crearServicio(
  datos: NuevoServicio,
): Promise<{ id: string; token_publico: string }> {
  const rows = (await sql`
    insert into servicios (
      nombre, categoria_id, categoria_otra, descripcion,
      anos_experiencia, cobertura, telefono,
      acepto_terminos, acepto_habeas_data, acepto_codigo_conducta,
      acepto_investigacion, version_terminos
    ) values (
      ${datos.nombre}, ${datos.categoria_id}, ${datos.categoria_otra}, ${datos.descripcion},
      ${datos.anos_experiencia}, ${datos.cobertura}, ${datos.telefono},
      true, true, true,
      true,
      ${datos.version_terminos}
    )
    returning id, token_publico
  `) as { id: string; token_publico: string }[];

  const fila = rows[0];
  // `returning` sobre un insert que no lanzó siempre trae una fila; si no la
  // trae, algo se rompió de una forma que no conviene seguir de largo.
  if (!fila) throw new Error('El insert de servicio no devolvió id');
  return fila;
}

/** Cola de moderación. */
export type ServicioPendiente = Servicio;

export async function listarServiciosPendientes(): Promise<ServicioPendiente[]> {
  const rows = await sql`
    select ${sql.unsafe(COLUMNAS_PUBLICAS)}
    from servicios s
    join categorias c on c.id = s.categoria_id
    where s.estado = 'pendiente'
    order by s.creado_en
  `;
  return rows as ServicioPendiente[];
}

export async function moderarServicio(
  id: string,
  estado: 'aprobado' | 'rechazado',
  moderador: string,
  motivo?: string,
): Promise<void> {
  await sql`
    update servicios
    set estado = ${estado}::portafolio_estado,
        motivo_rechazo = ${motivo ?? null},
        moderado_por = ${moderador},
        moderado_en = now(),
        actualizado_en = now()
    where id = ${id}
  `;
}

/** Conteo para el home y el panel, sin traer filas. */
export async function contarServiciosAprobados(): Promise<number> {
  const rows = (await sql`
    select count(*)::int as total from servicios where estado = 'aprobado'
  `) as { total: number }[];
  return rows[0]?.total ?? 0;
}
