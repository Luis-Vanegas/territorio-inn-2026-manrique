import 'server-only';
import { sql } from './neon';

/**
 * Métricas del módulo Portafolios para el panel de moderación.
 *
 * Son datos propios: registros, categorías, barrios y tiempos de moderación.
 * El tráfico del sitio (visitantes, páginas vistas, referrers) NO vive acá:
 * lo mide Vercel Analytics de forma anónima y se consulta en su dashboard.
 * Ver docs/analitica.md para el porqué de esa separación.
 */

export type ResumenGeneral = {
  total: number;
  pendientes: number;
  aprobados: number;
  rechazados: number;
  archivados: number;
  ultimos7dias: number;
  conFoto: number;
  horasPromedioModeracion: number | null;
};

export async function resumenGeneral(): Promise<ResumenGeneral> {
  const rows = (await sql`
    select
      count(*)::int                                                        as total,
      count(*) filter (where estado = 'pendiente')::int                    as pendientes,
      count(*) filter (where estado = 'aprobado')::int                     as aprobados,
      count(*) filter (where estado = 'rechazado')::int                    as rechazados,
      count(*) filter (where estado = 'archivado')::int                    as archivados,
      count(*) filter (where creado_en > now() - interval '7 days')::int   as ultimos7dias,
      count(*) filter (where foto_url is not null)::int                    as con_foto,
      -- Cuánto tarda el equipo en decidir. Si sube, la cola se está enfriando.
      avg(extract(epoch from (moderado_en - creado_en)) / 3600)
        filter (where moderado_en is not null)                             as horas_moderacion
    from portafolios
  `) as {
    total: number;
    pendientes: number;
    aprobados: number;
    rechazados: number;
    archivados: number;
    ultimos7dias: number;
    con_foto: number;
    horas_moderacion: string | null;
  }[];

  const f = rows[0];
  if (!f) {
    return {
      total: 0, pendientes: 0, aprobados: 0, rechazados: 0,
      archivados: 0, ultimos7dias: 0, conFoto: 0, horasPromedioModeracion: null,
    };
  }

  return {
    total: f.total,
    pendientes: f.pendientes,
    aprobados: f.aprobados,
    rechazados: f.rechazados,
    archivados: f.archivados,
    ultimos7dias: f.ultimos7dias,
    conFoto: f.con_foto,
    // avg() devuelve numeric, que el driver entrega como string.
    horasPromedioModeracion: f.horas_moderacion ? Number(f.horas_moderacion) : null,
  };
}

export type FilaCategoria = { nombre: string; total: number; aprobados: number };

export async function porCategoria(): Promise<FilaCategoria[]> {
  const rows = await sql`
    select
      c.nombre,
      count(p.id)::int                                       as total,
      count(p.id) filter (where p.estado = 'aprobado')::int   as aprobados
    from categorias c
    left join portafolios p on p.categoria_id = c.id
    group by c.id, c.nombre, c.orden
    having count(p.id) > 0
    order by count(p.id) desc
  `;
  return rows as FilaCategoria[];
}

export type FilaBarrio = { barrio: string; total: number };

export async function porBarrio(limite = 12): Promise<FilaBarrio[]> {
  const rows = await sql`
    select barrio, count(*)::int as total
    from portafolios
    where estado = 'aprobado'
    group by barrio
    order by count(*) desc, barrio
    limit ${limite}
  `;
  return rows as FilaBarrio[];
}

export type FilaDia = { dia: string; total: number };

/** Serie diaria con los días vacíos incluidos: un hueco también es información. */
export async function registrosPorDia(dias = 30): Promise<FilaDia[]> {
  const rows = await sql`
    select
      to_char(d.dia, 'YYYY-MM-DD') as dia,
      count(p.id)::int             as total
    from generate_series(
      current_date - make_interval(days => ${dias - 1}),
      current_date,
      interval '1 day'
    ) as d(dia)
    left join portafolios p on p.creado_en::date = d.dia::date
    group by d.dia
    order by d.dia
  `;
  return rows as FilaDia[];
}

export type FilaExportAliado = {
  id: string;
  nombre: string;
  categoria: string;
  barrio: string;
  direccion: string;
  latitud: number;
  longitud: number;
  estado: string;
  tiene_foto: boolean;
  creado_en: string;
  moderado_en: string | null;
  horas_hasta_moderacion: number | null;
  vistas: number;
  contactos: number;
};

/**
 * Una fila por aliado, con sus métricas ya cruzadas, para analizar fuera del
 * panel (Excel, R, SPSS).
 *
 * NO incluye whatsapp, teléfono, correo ni `ip_registro`. Los tres primeros
 * son públicos en el sitio y el último es dato personal declarado bajo Ley
 * 1581 — pero un CSV se descarga, se manda por correo y termina en el Drive
 * de alguien. Un archivo que circula tiene que llevar lo mínimo que responda
 * la pregunta, y para un análisis estadístico ningún teléfono hace falta.
 */
export async function exportarAliados(): Promise<FilaExportAliado[]> {
  const rows = await sql`
    select
      p.id,
      p.nombre,
      c.nombre                        as categoria,
      p.barrio,
      p.direccion,
      p.latitud::float8               as latitud,
      p.longitud::float8              as longitud,
      p.estado::text                  as estado,
      (p.foto_url is not null)        as tiene_foto,
      to_char(p.creado_en, 'YYYY-MM-DD HH24:MI') as creado_en,
      to_char(p.moderado_en, 'YYYY-MM-DD HH24:MI') as moderado_en,
      round(
        extract(epoch from (p.moderado_en - p.creado_en)) / 3600
      )::int                          as horas_hasta_moderacion,
      coalesce(sum(i.conteo) filter (where i.tipo = 'vista'), 0)::int    as vistas,
      coalesce(sum(i.conteo) filter (where i.tipo = 'contacto'), 0)::int as contactos
    from portafolios p
    join categorias c on c.id = p.categoria_id
    left join interacciones_portafolio i on i.portafolio_id = p.id
    group by p.id, c.nombre
    order by p.creado_en desc
  `;
  return rows as FilaExportAliado[];
}

export type FilaModerador = { moderado_por: string; total: number };

export async function porModerador(): Promise<FilaModerador[]> {
  const rows = await sql`
    select moderado_por, count(*)::int as total
    from portafolios
    where moderado_por is not null
    group by moderado_por
    order by count(*) desc
  `;
  return rows as FilaModerador[];
}
