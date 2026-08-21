import 'server-only';
import { sql } from './neon';

/**
 * Repositorio RESERVADO del módulo Servicios.
 *
 * Nada de lo que hay acá se publica jamás. La garantía no es esta advertencia,
 * son tres capas:
 *
 *   1. Tabla aparte (`servicios_privado`) — la consulta de la vitrina, que
 *      vive en `servicios.repo.ts`, no nombra esta tabla en ningún lado.
 *   2. Tipos separados — el tipo `Servicio` que viaja al cliente no declara
 *      estos campos, así que el compilador rechaza cualquier intento de
 *      pasarlos a un componente. La primera barrera es TypeScript, antes que
 *      cualquier revisión humana.
 *   3. `server-only` — importar esto desde un componente de cliente rompe el
 *      build, no falla en silencio en producción.
 *
 * Y lo que NO está en esta tabla también es una decisión: no hay número de
 * cédula, ni imagen de documento, ni dirección de residencia, ni coordenadas.
 * El dato más seguro es el que nunca se guarda.
 *
 * La foto de perfil vive acá, no en `servicios` (público). Su función no es
 * generar confianza de cara al visitante — es permitir identificar a la
 * persona si llega a haber un problema, y sostener el compromiso de conducta
 * que aceptó al registrarse. Nunca aparece en la ficha pública.
 */

export type CaracterizacionServicio = {
  servicio_id: string;
  // Nombre completo, reservado — mismo criterio que la foto (ver migración
  // 024). Lo público es solo primer nombre + primer apellido, calculado en
  // lib/validation/servicio.schema.ts::nombrePublico().
  nombres: string;
  apellidos: string;
  correo: string | null;
  ingreso_principal: boolean | null;
  horas_semana: number | null;
  como_consigue_clientes: string | null;
  mayor_dificultad: string;
  herramientas_propias: boolean | null;
  formacion: string | null;
  tiene_arl: boolean | null;
  necesita: string[] | null;
  sale_de_comuna: boolean | null;
};

export async function guardarCaracterizacion(
  datos: CaracterizacionServicio & { ip_registro: string | null },
): Promise<void> {
  await sql`
    insert into servicios_privado (
      servicio_id, nombres, apellidos, correo, ingreso_principal, horas_semana,
      como_consigue_clientes, mayor_dificultad, herramientas_propias,
      formacion, tiene_arl, necesita, sale_de_comuna, ip_registro
    ) values (
      ${datos.servicio_id}, ${datos.nombres}, ${datos.apellidos},
      ${datos.correo}, ${datos.ingreso_principal}, ${datos.horas_semana},
      ${datos.como_consigue_clientes}, ${datos.mayor_dificultad}, ${datos.herramientas_propias},
      ${datos.formacion}, ${datos.tiene_arl}, ${datos.necesita}, ${datos.sale_de_comuna},
      ${datos.ip_registro}
    )
    on conflict (servicio_id) do nothing
  `;
}

/**
 * Guarda la foto tras subirla al Blob. Update y no insert: la fila de
 * caracterización ya existe (la crea `guardarCaracterizacion` en el mismo
 * registro), esto solo completa las dos columnas de foto.
 */
export async function adjuntarFoto(
  servicioId: string,
  url: string,
  pathname: string,
): Promise<void> {
  await sql`
    update servicios_privado
    set foto_url = ${url}, foto_blob_pathname = ${pathname}
    where servicio_id = ${servicioId}
  `;
}

export type DatoReservado = {
  foto_url: string | null;
  nombres: string;
  apellidos: string;
};

/**
 * Foto y nombre completo de un lote de servicios, para que el panel de
 * moderación pueda mostrarlos. Las dos cosas viajan juntas porque sirven al
 * mismo propósito — identificar a la persona si hace falta — y porque es la
 * única pantalla del sitio donde un humano ve cualquiera de las dos.
 *
 * Devuelve un Map porque la pregunta que hace el llamador es "¿qué hay para
 * este id?" — no una lista de filas que hay que volver a indexar.
 *
 * Vive acá y no en `servicios.repo.ts` a propósito: el repositorio público
 * nunca toca `servicios_privado`, ni siquiera para el panel de admin. El
 * panel arma la relación en memoria con el resultado de las dos consultas.
 */
export async function datosReservadosPorId(
  servicioIds: string[],
): Promise<Map<string, DatoReservado>> {
  if (servicioIds.length === 0) return new Map();

  const rows = (await sql`
    select servicio_id, foto_url, nombres, apellidos
    from servicios_privado
    where servicio_id = any(${servicioIds})
  `) as (DatoReservado & { servicio_id: string })[];

  return new Map(rows.map((r) => [r.servicio_id, r]));
}

/**
 * Agregados para el reto. Devuelve conteos, nunca filas individuales: la
 * pregunta de investigación es "cuántos no tienen ARL", no "quién no tiene".
 *
 * Que la función agregada exista y la de listar detalle no, es deliberado —
 * si en algún momento hace falta el detalle, que sea una decisión explícita
 * con su justificación, no algo que ya estaba ahí.
 */
export type ResumenCaracterizacion = {
  total: number;
  sin_arl: number;
  ingreso_principal: number;
  sin_herramientas: number;
  sin_formacion: number;
};

export async function resumenCaracterizacion(): Promise<ResumenCaracterizacion> {
  const rows = (await sql`
    select
      count(*)::int                                                   as total,
      count(*) filter (where tiene_arl is false)::int                 as sin_arl,
      count(*) filter (where ingreso_principal is true)::int          as ingreso_principal,
      count(*) filter (where herramientas_propias is false)::int      as sin_herramientas,
      count(*) filter (where formacion = 'ninguna')::int              as sin_formacion
    from servicios_privado
  `) as ResumenCaracterizacion[];

  return rows[0] ?? {
    total: 0,
    sin_arl: 0,
    ingreso_principal: 0,
    sin_herramientas: 0,
    sin_formacion: 0,
  };
}

/** Lo que más se repite como dificultad, para el panel. Texto libre agrupado por frecuencia. */
export async function dificultadesFrecuentes(limite = 10): Promise<
  { dificultad: string; veces: number }[]
> {
  const rows = await sql`
    select lower(trim(mayor_dificultad)) as dificultad, count(*)::int as veces
    from servicios_privado
    group by 1
    order by veces desc, dificultad
    limit ${limite}
  `;
  return rows as { dificultad: string; veces: number }[];
}
