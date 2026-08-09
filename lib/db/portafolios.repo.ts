import 'server-only';
import { sql } from './neon';

export type EstadoPortafolio = 'pendiente' | 'aprobado' | 'rechazado' | 'archivado';

export type Categoria = {
  id: string;
  nombre: string;
  icono: string | null;
  orden: number;
};

/** Lo que ve el público. No incluye IP, consentimientos ni datos de moderación. */
export type Portafolio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria_id: string;
  categoria_nombre: string;
  direccion: string;
  barrio: string;
  latitud: number;
  longitud: number;
  whatsapp: string | null;
  telefono: string | null;
  correo: string | null;
  instagram: string | null;
  facebook: string | null;
  foto_url: string | null;
  creado_en: string;
};

/** Lo que ve el panel de moderación: agrega estado y trazabilidad. */
export type PortafolioAdmin = Portafolio & {
  estado: EstadoPortafolio;
  motivo_rechazo: string | null;
  moderado_por: string | null;
  moderado_en: string | null;
  foto_blob_pathname: string | null;
};

/**
 * Lista de columnas compartida por todas las lecturas públicas.
 * Está acá una sola vez a propósito: repetirla en cada query garantiza que
 * alguna se desactualice cuando se agregue una columna.
 *
 * El cast ::float8 no es opcional — Postgres devuelve `numeric` como string
 * en el driver de JS, y sin esto latitud/longitud llegan como "6.273126" y
 * Leaflet dibuja los marcadores en el Golfo de Guinea.
 */
const COLUMNAS_PUBLICAS = `
  p.id,
  p.nombre,
  p.descripcion,
  p.categoria_id,
  c.nombre as categoria_nombre,
  p.direccion,
  p.barrio,
  p.latitud::float8  as latitud,
  p.longitud::float8 as longitud,
  p.whatsapp,
  p.telefono,
  p.correo,
  p.instagram,
  p.facebook,
  p.foto_url,
  p.creado_en
`;

// ─── Lecturas públicas ───────────────────────────────────────

/**
 * Vitrina pública. El filtro por categoría es opcional y va en la misma query:
 * dos ramas separadas se desincronizan en cuanto alguien toca las columnas.
 */
export async function listarAprobados(categoriaId?: string): Promise<Portafolio[]> {
  const filtro = categoriaId ?? null;

  const rows = await sql`
    select ${sql.unsafe(COLUMNAS_PUBLICAS)}
    from portafolios p
    join categorias c on c.id = p.categoria_id
    where p.estado = 'aprobado'
      and (${filtro}::text is null or p.categoria_id = ${filtro})
    order by p.creado_en desc
  `;

  return rows as Portafolio[];
}

export async function obtenerAprobadoPorId(id: string): Promise<Portafolio | null> {
  // El id es uuid: si llega algo que no lo es, Postgres tira error de tipo.
  // Se corta antes para devolver un 404 limpio en vez de un 500.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }

  const rows = await sql`
    select ${sql.unsafe(COLUMNAS_PUBLICAS)}
    from portafolios p
    join categorias c on c.id = p.categoria_id
    where p.estado = 'aprobado' and p.id = ${id}
  `;

  return (rows[0] as Portafolio) ?? null;
}

export async function listarCategorias(): Promise<Categoria[]> {
  const rows = await sql`
    select id, nombre, icono, orden
    from categorias
    where activa = true
    order by orden, nombre
  `;
  return rows as Categoria[];
}

/** Conteo por categoría para los filtros. Solo cuenta lo que se ve. */
export async function contarAprobadosPorCategoria(): Promise<Record<string, number>> {
  const rows = (await sql`
    select categoria_id, count(*)::int as total
    from portafolios
    where estado = 'aprobado'
    group by categoria_id
  `) as { categoria_id: string; total: number }[];

  return Object.fromEntries(rows.map((r) => [r.categoria_id, r.total]));
}

// ─── Escritura pública ───────────────────────────────────────

export type NuevoPortafolio = {
  nombre: string;
  descripcion: string | null;
  categoria_id: string;
  direccion: string;
  barrio: string;
  latitud: number;
  longitud: number;
  whatsapp: string | null;
  telefono: string | null;
  correo: string | null;
  instagram: string | null;
  facebook: string | null;
  version_terminos: string;
  ip_registro: string | null;
};

export async function crearPortafolio(datos: NuevoPortafolio): Promise<string> {
  const rows = await sql`
    insert into portafolios (
      nombre, descripcion, categoria_id, direccion, barrio,
      latitud, longitud,
      whatsapp, telefono, correo, instagram, facebook,
      acepto_terminos, acepto_habeas_data, version_terminos, ip_registro
    ) values (
      ${datos.nombre}, ${datos.descripcion}, ${datos.categoria_id},
      ${datos.direccion}, ${datos.barrio},
      ${datos.latitud}, ${datos.longitud},
      ${datos.whatsapp}, ${datos.telefono}, ${datos.correo},
      ${datos.instagram}, ${datos.facebook},
      true, true, ${datos.version_terminos}, ${datos.ip_registro}
    )
    returning id
  `;

  return (rows[0] as { id: string }).id;
}

export async function adjuntarFoto(
  id: string,
  url: string,
  pathname: string,
): Promise<void> {
  await sql`
    update portafolios
    set foto_url = ${url}, foto_blob_pathname = ${pathname}
    where id = ${id}
  `;
}

// ─── Moderación ──────────────────────────────────────────────

export async function listarParaModerar(
  estado: EstadoPortafolio = 'pendiente',
): Promise<PortafolioAdmin[]> {
  const rows = await sql`
    select ${sql.unsafe(COLUMNAS_PUBLICAS)},
           p.estado, p.motivo_rechazo, p.moderado_por, p.moderado_en,
           p.foto_blob_pathname
    from portafolios p
    join categorias c on c.id = p.categoria_id
    where p.estado = ${estado}
    order by p.creado_en asc
  `;
  return rows as PortafolioAdmin[];
}

export async function obtenerParaModerar(id: string): Promise<PortafolioAdmin | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }

  const rows = await sql`
    select ${sql.unsafe(COLUMNAS_PUBLICAS)},
           p.estado, p.motivo_rechazo, p.moderado_por, p.moderado_en,
           p.foto_blob_pathname
    from portafolios p
    join categorias c on c.id = p.categoria_id
    where p.id = ${id}
  `;
  return (rows[0] as PortafolioAdmin) ?? null;
}

/**
 * Cambia el estado dejando registro de quién y cuándo.
 * El `where estado <> $nuevo` evita que dos moderadores con la pestaña abierta
 * se pisen: el segundo no encuentra fila y la UI se entera de que ya se decidió.
 */
export async function moderar(
  id: string,
  nuevoEstado: Exclude<EstadoPortafolio, 'pendiente'>,
  moderadorEmail: string,
  motivoRechazo?: string,
): Promise<boolean> {
  const rows = await sql`
    update portafolios
    set estado = ${nuevoEstado},
        motivo_rechazo = ${motivoRechazo ?? null},
        moderado_por = ${moderadorEmail},
        moderado_en = now()
    where id = ${id} and estado <> ${nuevoEstado}
    returning id
  `;
  return rows.length > 0;
}

export async function contarPorEstado(): Promise<Record<EstadoPortafolio, number>> {
  const rows = (await sql`
    select estado, count(*)::int as total
    from portafolios
    group by estado
  `) as { estado: EstadoPortafolio; total: number }[];

  const base: Record<EstadoPortafolio, number> = {
    pendiente: 0, aprobado: 0, rechazado: 0, archivado: 0,
  };
  for (const r of rows) base[r.estado] = r.total;
  return base;
}
