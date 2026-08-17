import 'server-only';
import { sql } from './neon';

export type EstadoPortafolio = 'pendiente' | 'aprobado' | 'rechazado' | 'archivado';

export type Categoria = {
  id: string;
  nombre: string;
  icono: string | null;
  orden: number;
};

/** Lo que ve el público. No incluye IP, consentimientos, token, investigación ni datos de moderación. */
export type Portafolio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria_id: string;
  categoria_nombre: string;
  /** Solo cuando categoria_id = 'otros' y la persona escribió qué es. */
  categoria_otra: string | null;
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
  punto_referencia: string | null;
  horario: string[];
  medios_pago: string[];
  verificado_en: string | null;
  /** Valores de los campos que definió el admin en /admin/campos, por slug. */
  campos_extra: Record<string, string | number | boolean>;
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
  p.categoria_otra,
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
  p.creado_en,
  p.punto_referencia,
  p.horario,
  p.medios_pago,
  p.verificado_en,
  p.campos_extra
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
  categoria_otra: string | null;
  direccion: string;
  barrio: string;
  latitud: number;
  longitud: number;
  // Sin teléfono fijo: a pedido explícito, se sacó del formulario. La
  // columna sigue en la base (no vale la pena una migración para borrarla),
  // simplemente no se vuelve a escribir desde acá.
  whatsapp: string | null;
  correo: string | null;
  instagram: string | null;
  facebook: string | null;
  version_terminos: string;
  ip_registro: string | null;
  campos_extra: Record<string, string | number | boolean>;
  punto_referencia: string | null;
  horario: string[];
  medios_pago: string[];
};

export async function crearPortafolio(
  datos: NuevoPortafolio,
): Promise<{ id: string; token_publico: string }> {
  const rows = await sql`
    insert into portafolios (
      nombre, descripcion, categoria_id, categoria_otra, direccion, barrio,
      latitud, longitud,
      whatsapp, correo, instagram, facebook,
      acepto_terminos, acepto_habeas_data, version_terminos, ip_registro,
      campos_extra,
      punto_referencia, horario, medios_pago
    ) values (
      ${datos.nombre}, ${datos.descripcion}, ${datos.categoria_id}, ${datos.categoria_otra},
      ${datos.direccion}, ${datos.barrio},
      ${datos.latitud}, ${datos.longitud},
      ${datos.whatsapp}, ${datos.correo},
      ${datos.instagram}, ${datos.facebook},
      true, true, ${datos.version_terminos}, ${datos.ip_registro},
      ${JSON.stringify(datos.campos_extra)}::jsonb,
      ${datos.punto_referencia}, ${datos.horario}::text[], ${datos.medios_pago}::text[]
    )
    returning id, token_publico
  `;

  return rows[0] as { id: string; token_publico: string };
}

/**
 * Investigación — una fila por portafolio. tipo_negocio y mayor_dolor ya
 * vienen garantizados por Zod (obligatorios); el resto sigue opcional.
 */
export async function guardarInvestigacion(datos: {
  portafolio_id: string;
  nombre_dueno: string | null;
  tipo_negocio: string;
  tipo_negocio_detalle: string | null;
  formalidad: string | null;
  mayor_dolor: string[];
  mayor_dolor_otro: string | null;
}): Promise<void> {
  await sql`
    insert into aliados_investigacion (
      portafolio_id, nombre_dueno, tipo_negocio, tipo_negocio_detalle,
      formalidad, mayor_dolor, mayor_dolor_otro
    ) values (
      ${datos.portafolio_id}, ${datos.nombre_dueno}, ${datos.tipo_negocio}, ${datos.tipo_negocio_detalle},
      ${datos.formalidad}, ${datos.mayor_dolor}::text[], ${datos.mayor_dolor_otro}
    )
  `;
}

/**
 * Duplicado por WhatsApp normalizado (solo dígitos). No compara nombres:
 * eso necesitaría pg_trgm (extensión nueva) para una coincidencia difusa
 * confiable, y el WhatsApp exacto ya cubre el caso real de "la misma persona
 * mandó el formulario dos veces". Se amplía si hace falta.
 */
export async function buscarPosibleDuplicado(
  whatsapp: string | null,
): Promise<{ id: string; nombre: string } | null> {
  if (!whatsapp) return null;
  const digitos = whatsapp.replace(/\D/g, '');
  if (!digitos) return null;

  const rows = await sql`
    select id, nombre
    from portafolios
    where estado <> 'archivado'
      and regexp_replace(whatsapp, '\D', '', 'g') = ${digitos}
    limit 1
  `;
  return (rows[0] as { id: string; nombre: string }) ?? null;
}

export async function registrarConsentimiento(datos: {
  portafolio_id: string;
  acepto_terminos: boolean;
  acepto_habeas_data: boolean;
  version_politica: string;
  ip_hash: string | null;
  user_agent: string | null;
}): Promise<void> {
  await sql`
    insert into aliados_consentimiento (
      portafolio_id, acepto_terminos, acepto_habeas_data, version_politica, ip_hash, user_agent
    ) values (
      ${datos.portafolio_id}, ${datos.acepto_terminos}, ${datos.acepto_habeas_data},
      ${datos.version_politica}, ${datos.ip_hash}, ${datos.user_agent}
    )
  `;
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

// ─── Autoservicio por token ────────────────────────────────────
// El token es la única credencial: quien lo tiene puede ver y corregir su
// propio registro sin login. token_publico es uuid v4 (gen_random_uuid()),
// así que no hace falta el mismo chequeo de formato que se usa para `id` —
// un token con formato inválido simplemente no matchea ninguna fila.

export async function obtenerPorToken(token: string): Promise<PortafolioAdmin | null> {
  const rows = await sql`
    select ${sql.unsafe(COLUMNAS_PUBLICAS)},
           p.estado, p.motivo_rechazo, p.moderado_por, p.moderado_en,
           p.foto_blob_pathname
    from portafolios p
    join categorias c on c.id = p.categoria_id
    where p.token_publico = ${token}
  `;
  return (rows[0] as PortafolioAdmin) ?? null;
}

export type EdicionPortafolio = {
  nombre: string;
  descripcion: string | null;
  categoria_id: string;
  categoria_otra: string | null;
  direccion: string;
  barrio: string;
  latitud: number;
  longitud: number;
  punto_referencia: string | null;
  whatsapp: string | null;
  correo: string | null;
  instagram: string | null;
  facebook: string | null;
  horario: string[];
  medios_pago: string[];
};

/**
 * Vuelve a 'pendiente' siempre que se guarda una edición: un moderador ya
 * aprobó una versión de estos datos, no la que se acaba de escribir. También
 * limpia el motivo de rechazo — si lo estaba corrigiendo por eso, ya no aplica.
 */
export async function actualizarPorToken(
  token: string,
  datos: EdicionPortafolio,
): Promise<string | null> {
  const rows = await sql`
    update portafolios
    set nombre = ${datos.nombre},
        descripcion = ${datos.descripcion},
        categoria_id = ${datos.categoria_id},
        categoria_otra = ${datos.categoria_otra},
        direccion = ${datos.direccion},
        barrio = ${datos.barrio},
        latitud = ${datos.latitud},
        longitud = ${datos.longitud},
        punto_referencia = ${datos.punto_referencia},
        whatsapp = ${datos.whatsapp},
        correo = ${datos.correo},
        instagram = ${datos.instagram},
        facebook = ${datos.facebook},
        horario = ${datos.horario}::text[],
        medios_pago = ${datos.medios_pago}::text[],
        estado = 'pendiente',
        motivo_rechazo = null
    where token_publico = ${token}
    returning id
  `;
  return (rows[0] as { id: string } | undefined)?.id ?? null;
}

export async function archivarPorToken(
  token: string,
): Promise<{ id: string; foto_blob_pathname: string | null } | null> {
  // moderado_en sí se marca (queda el "cuándo"), moderado_por se deja null a
  // propósito — no lo archivó ningún admin. chk_moderacion_completa (018) ya
  // sabe que 'archivado' solo necesita el primero.
  const rows = await sql`
    update portafolios
    set estado = 'archivado', moderado_en = now()
    where token_publico = ${token} and estado <> 'archivado'
    returning id, foto_blob_pathname
  `;
  return (rows[0] as { id: string; foto_blob_pathname: string | null } | undefined) ?? null;
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
