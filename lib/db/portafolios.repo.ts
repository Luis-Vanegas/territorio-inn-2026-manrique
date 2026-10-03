import 'server-only';
import { sql } from './neon';
import { cachearVitrina } from './cache';
import { barrioDe } from '@/lib/geo/barrioOficial';
import type { ProductoInput } from '@/lib/validation/portafolio.schema';

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
  menu_url: string | null;
  productos: ProductoInput[];
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
  menu_blob_pathname: string | null;
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
const COLUMNAS_COMUNES = `
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
  p.menu_url,
  p.productos,
  p.creado_en,
  p.punto_referencia,
  p.horario,
  p.medios_pago,
  p.verificado_en
`;

/**
 * A2: la vitrina publica un campo personalizado SOLO si el moderador lo marcó
 * `publico` (migración 032, default false). El filtro va en la consulta y no en
 * el componente: si fuera de presentación, el valor igual viajaría en el JSON
 * de la página y bastaría abrir las herramientas del navegador para verlo.
 *
 * Solo para lecturas PÚBLICAS. El dueño (por token) y el panel de moderación
 * leen `p.campos_extra` completo, porque necesitan ver y editar todo.
 */
const CAMPOS_EXTRA_PUBLICOS = `
  coalesce((
    select jsonb_object_agg(e.key, e.value)
    from jsonb_each(p.campos_extra) as e
    join definiciones_campo d on d.slug = e.key
    where d.activo = true and d.publico = true
  ), '{}'::jsonb) as campos_extra
`;

const COLUMNAS_PUBLICAS = `${COLUMNAS_COMUNES}, ${CAMPOS_EXTRA_PUBLICOS}`;
const COLUMNAS_PROPIAS = `${COLUMNAS_COMUNES}, p.campos_extra`;

/**
 * ponytail: transición hasta que la migración 032 esté aplicada en TODAS las
 * bases. Sin la columna `definiciones_campo.publico` (error 42703) la lectura
 * pública cae a «ningún campo personalizado público»: falla CERRADO, que es la
 * dirección segura, y la vitrina no se cae. Borrar este rodeo (y dejar solo
 * COLUMNAS_PUBLICAS) cuando 032 esté en producción.
 */
const COLUMNAS_PUBLICAS_SIN_032 = `${COLUMNAS_COMUNES}, '{}'::jsonb as campos_extra`;

async function leerPublicas<T>(consulta: (columnas: string) => Promise<T>): Promise<T> {
  try {
    return await consulta(COLUMNAS_PUBLICAS);
  } catch (error) {
    if ((error as { code?: string }).code !== '42703') throw error;
    console.error('[portafolios] falta la migración 032 (definiciones_campo.publico): campos personalizados ocultos');
    return consulta(COLUMNAS_PUBLICAS_SIN_032);
  }
}

// ─── Lecturas públicas ───────────────────────────────────────

/**
 * Vitrina pública. El filtro por categoría es opcional y va en la misma query:
 * dos ramas separadas se desincronizan en cuanto alguien toca las columnas.
 *
 * Cacheada con etiqueta (lib/db/cache.ts): el inicio la pide DOS veces por
 * visita (AliadosDestacado y GaleriaAliados) y /aliados otra más, y antes cada
 * una era una consulta a Neon. Ahora la base solo se lee al cambiar algo
 * (`invalidarVitrina()`) o cada 10 minutos. Los valores vuelven de la caché
 * serializados como JSON: por eso las columnas son strings, números y jsonb —
 * si algún día se agrega una columna `Date`, llegará como string.
 */
export const listarAprobados = cachearVitrina(
  async (categoriaId?: string): Promise<Portafolio[]> => {
    const filtro = categoriaId ?? null;

    const rows = await leerPublicas(
      (columnas) => sql`
        select ${sql.unsafe(columnas)}
        from portafolios p
        join categorias c on c.id = p.categoria_id
        where p.estado = 'aprobado'
          and (${filtro}::text is null or p.categoria_id = ${filtro})
        order by p.creado_en desc
      `,
    );

    return rows as Portafolio[];
  },
  'listarAprobados',
);

export async function obtenerAprobadoPorId(id: string): Promise<Portafolio | null> {
  // El id es uuid: si llega algo que no lo es, Postgres tira error de tipo.
  // Se corta antes para devolver un 404 limpio en vez de un 500.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }

  const rows = await leerPublicas(
    (columnas) => sql`
      select ${sql.unsafe(columnas)}
      from portafolios p
      join categorias c on c.id = p.categoria_id
      where p.estado = 'aprobado' and p.id = ${id}
    `,
  );

  return (rows[0] as Portafolio) ?? null;
}

export const listarCategorias = cachearVitrina(async (): Promise<Categoria[]> => {
  const rows = await sql`
    select id, nombre, icono, orden
    from categorias
    where activa = true
    order by orden, nombre
  `;
  return rows as Categoria[];
}, 'listarCategorias');

/** Conteo por categoría para los filtros. Solo cuenta lo que se ve. */
export const contarAprobadosPorCategoria = cachearVitrina(
  async (): Promise<Record<string, number>> => {
    const rows = (await sql`
      select categoria_id, count(*)::int as total
      from portafolios
      where estado = 'aprobado'
      group by categoria_id
    `) as { categoria_id: string; total: number }[];

    return Object.fromEntries(rows.map((r) => [r.categoria_id, r.total]));
  },
  'contarAprobadosPorCategoria',
);

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
  productos: ProductoInput[];
};

/**
 * `barrio_oficial` (FK a `barrios`, migración 033) se calcula ACÁ, en las tres
 * escrituras que reciben coordenadas (crear y las dos ediciones), y no en cada
 * acción: así ninguna puerta nueva puede olvidarlo. Es lo que dice el punto;
 * `barrio` es lo que dijo la persona. null = cae fuera de los 15 barrios.
 */
export async function crearPortafolio(
  datos: NuevoPortafolio,
): Promise<{ id: string; token_publico: string }> {
  const rows = await sql`
    insert into portafolios (
      nombre, descripcion, categoria_id, categoria_otra, direccion, barrio, barrio_oficial,
      latitud, longitud,
      whatsapp, correo, instagram, facebook,
      acepto_terminos, acepto_habeas_data, version_terminos, ip_registro,
      campos_extra,
      punto_referencia, horario, medios_pago, productos
    ) values (
      ${datos.nombre}, ${datos.descripcion}, ${datos.categoria_id}, ${datos.categoria_otra},
      ${datos.direccion}, ${datos.barrio}, ${barrioDe(datos.latitud, datos.longitud)},
      ${datos.latitud}, ${datos.longitud},
      ${datos.whatsapp}, ${datos.correo},
      ${datos.instagram}, ${datos.facebook},
      true, true, ${datos.version_terminos}, ${datos.ip_registro},
      ${JSON.stringify(datos.campos_extra)}::jsonb,
      ${datos.punto_referencia}, ${datos.horario}::text[], ${datos.medios_pago}::text[],
      ${JSON.stringify(datos.productos)}::jsonb
    )
    returning id, token_publico
  `;

  return rows[0] as { id: string; token_publico: string };
}

/**
 * Investigación — una fila por portafolio. Recortada (029) a los dos campos
 * con consumidor real: `formalidad` personaliza /formalizacion, `mayor_dolor`
 * es contexto del asesor. Ambos opcionales.
 */
export async function guardarInvestigacion(datos: {
  portafolio_id: string;
  formalidad: string | null;
  mayor_dolor: string[];
}): Promise<void> {
  await sql`
    insert into aliados_investigacion (portafolio_id, formalidad, mayor_dolor)
    values (${datos.portafolio_id}, ${datos.formalidad}, ${datos.mayor_dolor}::text[])
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

/**
 * Devuelve el pathname que tenía la foto ANTES de este update (capturado con
 * `from (select ...)`, mismo patrón que `moderar()`/`archivarPorToken`) para
 * que quien llama pueda borrar el blob viejo del store. Desde que `subirFoto`
 * sube con `addRandomSuffix: true` (lib/blob/fotos.ts), cada foto nueva es un
 * blob distinto — sin este valor de retorno, el anterior queda huérfano.
 */
export async function adjuntarFoto(
  id: string,
  url: string,
  pathname: string,
): Promise<{ pathnameAnterior: string | null }> {
  const rows = await sql`
    update portafolios as p
    set foto_url = ${url}, foto_blob_pathname = ${pathname}
    from (select foto_blob_pathname from portafolios where id = ${id}) as previo
    where p.id = ${id}
    returning previo.foto_blob_pathname as anterior
  `;
  const fila = rows[0] as { anterior: string | null } | undefined;
  return { pathnameAnterior: fila?.anterior ?? null };
}

/** Mismo criterio que `adjuntarFoto`: devuelve el pathname anterior del menú para que el caller lo borre. */
export async function adjuntarMenu(
  id: string,
  url: string,
  pathname: string,
): Promise<{ pathnameAnterior: string | null }> {
  const rows = await sql`
    update portafolios as p
    set menu_url = ${url}, menu_blob_pathname = ${pathname}
    from (select menu_blob_pathname from portafolios where id = ${id}) as previo
    where p.id = ${id}
    returning previo.menu_blob_pathname as anterior
  `;
  const fila = rows[0] as { anterior: string | null } | undefined;
  return { pathnameAnterior: fila?.anterior ?? null };
}

// ─── Autoservicio por token ────────────────────────────────────
// El token es la única credencial: quien lo tiene puede ver y corregir su
// propio registro sin login. token_publico es uuid v4 (gen_random_uuid()),
// así que no hace falta el mismo chequeo de formato que se usa para `id` —
// un token con formato inválido simplemente no matchea ninguna fila.

export async function obtenerPorToken(token: string): Promise<PortafolioAdmin | null> {
  const rows = await sql`
    select ${sql.unsafe(COLUMNAS_PROPIAS)},
           p.estado, p.motivo_rechazo, p.moderado_por, p.moderado_en,
           p.foto_blob_pathname, p.menu_blob_pathname
    from portafolios p
    join categorias c on c.id = p.categoria_id
    where p.token_publico = ${token}
  `;
  return (rows[0] as PortafolioAdmin) ?? null;
}

/**
 * Lo mínimo que el asesor de formalización necesita para dar una respuesta
 * útil: qué hace el negocio, dónde está y qué respondió sobre su formalidad.
 *
 * Es una query aparte y no un campo más de `obtenerPorToken` a propósito.
 * `aliados_investigacion` es privada —nunca se publica— y la ficha pública se
 * lee en cada carga de /aliados/estado/[token]. Colgarle un LEFT JOIN a esa
 * lectura arrastraría datos de investigación a un objeto que hoy viaja al
 * cliente, que es exactamente lo que la separación de tablas evita.
 *
 * `mayor_dolor` puede venir null cuando el registro es anterior a la migración
 * 019 (que lo hizo obligatorio); el coalesce evita que el asesor reciba null
 * donde espera una lista.
 */
export type ContextoAsesor = {
  nombre: string;
  categoria_nombre: string;
  barrio: string | null;
  formalidad: string | null;
  mayor_dolor: string[];
};

export async function obtenerContextoAsesor(token: string): Promise<ContextoAsesor | null> {
  const rows = await sql`
    select p.nombre,
           c.nombre as categoria_nombre,
           p.barrio,
           i.formalidad,
           coalesce(i.mayor_dolor, '{}') as mayor_dolor
    from portafolios p
    join categorias c on c.id = p.categoria_id
    left join aliados_investigacion i on i.portafolio_id = p.id
    where p.token_publico = ${token} and p.estado <> 'archivado'
  `;
  return (rows[0] as ContextoAsesor) ?? null;
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
  productos: ProductoInput[];
};

/** Lo que devuelve una edición: el id y los nombres de los campos que cambiaron. */
export type EdicionAplicada = { id: string; campos: string[] };

/**
 * Nombres (nunca valores) de los campos que cambió un update, para la bitácora.
 * Compara `previo` (la fila antes del update, capturada con `from (select ...)`,
 * mismo patrón que `moderar()`) contra `p` (la fila nueva en el `returning`). Se
 * calcula en la base para no leer los valores viejos en la aplicación. Latitud y
 * longitud salen juntas como `ubicacion`; `barrio_oficial` no se lista porque
 * se deriva del punto.
 */
const CAMPOS_CAMBIADOS = `array_remove(array[
  case when previo.nombre is distinct from p.nombre then 'nombre' end,
  case when previo.descripcion is distinct from p.descripcion then 'descripcion' end,
  case when previo.categoria_id is distinct from p.categoria_id then 'categoria_id' end,
  case when previo.categoria_otra is distinct from p.categoria_otra then 'categoria_otra' end,
  case when previo.direccion is distinct from p.direccion then 'direccion' end,
  case when previo.barrio is distinct from p.barrio then 'barrio' end,
  case when previo.latitud is distinct from p.latitud
         or previo.longitud is distinct from p.longitud then 'ubicacion' end,
  case when previo.punto_referencia is distinct from p.punto_referencia then 'punto_referencia' end,
  case when previo.whatsapp is distinct from p.whatsapp then 'whatsapp' end,
  case when previo.correo is distinct from p.correo then 'correo' end,
  case when previo.instagram is distinct from p.instagram then 'instagram' end,
  case when previo.facebook is distinct from p.facebook then 'facebook' end,
  case when previo.horario is distinct from p.horario then 'horario' end,
  case when previo.medios_pago is distinct from p.medios_pago then 'medios_pago' end,
  case when previo.productos is distinct from p.productos then 'productos' end
], null)`;

/**
 * Vuelve a 'pendiente' siempre que se guarda una edición: un moderador ya
 * aprobó una versión de estos datos, no la que se acaba de escribir. También
 * limpia el motivo de rechazo — si lo estaba corrigiendo por eso, ya no aplica.
 *
 * Devuelve el id y los NOMBRES de los campos que cambiaron (para la bitácora),
 * o null si el token no matchea.
 */
export async function actualizarPorToken(
  token: string,
  datos: EdicionPortafolio,
): Promise<EdicionAplicada | null> {
  const rows = await sql`
    update portafolios as p
    set nombre = ${datos.nombre},
        descripcion = ${datos.descripcion},
        categoria_id = ${datos.categoria_id},
        categoria_otra = ${datos.categoria_otra},
        direccion = ${datos.direccion},
        barrio = ${datos.barrio},
        barrio_oficial = ${barrioDe(datos.latitud, datos.longitud)},
        latitud = ${datos.latitud},
        longitud = ${datos.longitud},
        punto_referencia = ${datos.punto_referencia},
        whatsapp = ${datos.whatsapp},
        correo = ${datos.correo},
        instagram = ${datos.instagram},
        facebook = ${datos.facebook},
        horario = ${datos.horario}::text[],
        medios_pago = ${datos.medios_pago}::text[],
        productos = ${JSON.stringify(datos.productos)}::jsonb,
        estado = 'pendiente',
        motivo_rechazo = null
    from (select * from portafolios where token_publico = ${token}) as previo
    where p.token_publico = ${token}
    returning p.id, ${sql.unsafe(CAMPOS_CAMBIADOS)} as campos
  `;
  return (rows[0] as EdicionAplicada | undefined) ?? null;
}

export async function archivarPorToken(
  token: string,
): Promise<{ id: string; foto_blob_pathname: string | null; menu_blob_pathname: string | null } | null> {
  // moderado_en sí se marca (queda el "cuándo"), moderado_por se deja null a
  // propósito — no lo archivó ningún admin. chk_moderacion_completa (018) ya
  // sabe que 'archivado' solo necesita el primero.
  //
  // foto_url/foto_blob_pathname (y su par de menú) se limpian acá: el blob se
  // borra aparte (quien llama a esta función), pero si la fila se queda
  // apuntando a un pathname que ya no existe, la pestaña "Archivados" del
  // panel intenta mostrar una imagen 404. `from (select ...)` captura los
  // pathnames ANTES del update para poder devolverlos, aunque el update los
  // deje en null.
  const rows = await sql`
    update portafolios as p
    set estado = 'archivado', moderado_en = now(),
        foto_url = null, foto_blob_pathname = null,
        menu_url = null, menu_blob_pathname = null
    from (
      select foto_blob_pathname, menu_blob_pathname from portafolios
      where token_publico = ${token} and estado <> 'archivado'
    ) as previo
    where p.token_publico = ${token} and p.estado <> 'archivado'
    returning p.id, previo.foto_blob_pathname, previo.menu_blob_pathname
  `;
  return (
    (rows[0] as
      | { id: string; foto_blob_pathname: string | null; menu_blob_pathname: string | null }
      | undefined) ?? null
  );
}

// ─── Moderación ──────────────────────────────────────────────

export async function listarParaModerar(
  estado: EstadoPortafolio = 'pendiente',
): Promise<PortafolioAdmin[]> {
  const rows = await sql`
    select ${sql.unsafe(COLUMNAS_PROPIAS)},
           p.estado, p.motivo_rechazo, p.moderado_por, p.moderado_en,
           p.foto_blob_pathname, p.menu_blob_pathname
    from portafolios p
    join categorias c on c.id = p.categoria_id
    where p.estado = ${estado}
    order by p.creado_en asc
  `;
  return rows as PortafolioAdmin[];
}

/**
 * Cambia el estado dejando registro de quién y cuándo.
 * El `where estado <> $nuevo` evita que dos moderadores con la pestaña abierta
 * se pisen: el segundo no encuentra fila y la UI se entera de que ya se decidió.
 *
 * Al archivar se limpian foto_url/foto_blob_pathname en la misma consulta —
 * mismo motivo que archivarPorToken: sin esto la fila se queda apuntando a un
 * blob que el caller borra por separado, y la pestaña "Archivados" intenta
 * mostrar una imagen que ya no existe. Se devuelve el pathname previo (capturado
 * antes del update vía `from`) para que el caller pueda borrar el blob.
 */
export async function moderar(
  id: string,
  nuevoEstado: Exclude<EstadoPortafolio, 'pendiente'>,
  moderadorEmail: string,
  motivoRechazo?: string,
): Promise<{ cambio: boolean; foto_blob_pathname: string | null; menu_blob_pathname: string | null }> {
  const rows = await sql`
    update portafolios as p
    set estado = ${nuevoEstado},
        motivo_rechazo = ${motivoRechazo ?? null},
        moderado_por = ${moderadorEmail},
        moderado_en = now(),
        foto_url = case when ${nuevoEstado} = 'archivado' then null else p.foto_url end,
        foto_blob_pathname = case when ${nuevoEstado} = 'archivado' then null else p.foto_blob_pathname end,
        menu_url = case when ${nuevoEstado} = 'archivado' then null else p.menu_url end,
        menu_blob_pathname = case when ${nuevoEstado} = 'archivado' then null else p.menu_blob_pathname end
    from (select foto_blob_pathname, menu_blob_pathname from portafolios where id = ${id}) as previo
    where p.id = ${id} and p.estado <> ${nuevoEstado}
    returning p.id, previo.foto_blob_pathname, previo.menu_blob_pathname
  `;
  const fila = rows[0] as
    | { id: string; foto_blob_pathname: string | null; menu_blob_pathname: string | null }
    | undefined;
  return {
    cambio: Boolean(fila),
    foto_blob_pathname: fila?.foto_blob_pathname ?? null,
    menu_blob_pathname: fila?.menu_blob_pathname ?? null,
  };
}

/**
 * Edición desde el panel de moderación: mismos campos de contenido que
 * `actualizarPorToken`, pero a propósito NO toca `estado`, `motivo_rechazo`
 * NI `moderado_por`/`moderado_en` — un moderador corrigiendo una ficha ya
 * aprobada no la manda de vuelta a revisión (esa es una decisión del dueño,
 * ver comentario de `actualizarPorToken`) y tampoco se roba la trazabilidad
 * de quién la aprobó: la migración 002 protege esas dos columnas a propósito
 * para poder demostrar quién decidió publicar cada ficha, y `moderado_en` ya
 * queda registrado por el trigger de `actualizado_en`.
 *
 * `where estado = 'aprobado'` porque el botón "Editar" del panel solo
 * aparece en esa pestaña — coherente con eso, no con "cualquier estado menos
 * archivado": editar un pendiente o un rechazado no tiene UI hoy, así que no
 * hace falta que el repo lo permita.
 */
export async function editarComoModerador(
  id: string,
  datos: EdicionPortafolio,
): Promise<EdicionAplicada | null> {
  const rows = await sql`
    update portafolios as p
    set nombre = ${datos.nombre},
        descripcion = ${datos.descripcion},
        categoria_id = ${datos.categoria_id},
        categoria_otra = ${datos.categoria_otra},
        direccion = ${datos.direccion},
        barrio = ${datos.barrio},
        barrio_oficial = ${barrioDe(datos.latitud, datos.longitud)},
        latitud = ${datos.latitud},
        longitud = ${datos.longitud},
        punto_referencia = ${datos.punto_referencia},
        whatsapp = ${datos.whatsapp},
        correo = ${datos.correo},
        instagram = ${datos.instagram},
        facebook = ${datos.facebook},
        horario = ${datos.horario}::text[],
        medios_pago = ${datos.medios_pago}::text[],
        productos = ${JSON.stringify(datos.productos)}::jsonb
    from (select * from portafolios where id = ${id}) as previo
    where p.id = ${id} and p.estado = 'aprobado'
    returning p.id, ${sql.unsafe(CAMPOS_CAMBIADOS)} as campos
  `;
  return (rows[0] as EdicionAplicada | undefined) ?? null;
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
