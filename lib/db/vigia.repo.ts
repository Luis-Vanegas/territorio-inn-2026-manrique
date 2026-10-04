import 'server-only';
import { sql } from './neon';
import type { InformeVigia } from '@/lib/validation/vigia.schema';

/**
 * El rastro del vigía de convocatorias (migración 036): una fila por corrida y
 * una por fuente dentro de cada corrida. Sin datos personales: URLs de páginas
 * públicas de entidades, estados y conteos.
 *
 * Escribe SOLO `POST /api/ingesta/vigia` (secreto de máquina). Lee el panel del
 * equipo (Convocatorias › «Fuentes del vigía»); nada público. Nada de esto toca la vitrina:
 * no llama `invalidarVitrina()`.
 */

export type EstadoVigia =
  | 'responde'
  | 'cambio'
  | 'sin_cambio'
  | 'error_http'
  | 'timeout'
  | 'bloqueada_robots';

export type FuenteVigia = {
  fuenteId: string;
  /** Nombre de la entidad si ya existe en `entidades`; si no, null. */
  entidad: string | null;
  url: string;
  estado: EstadoVigia;
  httpStatus: number | null;
  candidatas: number;
  nuevas: number;
  /** Última vez que esta fuente respondió (en cualquier corrida), ISO; null si nunca. */
  ultimaRespuesta: string | null;
  /** Texto corto de un fallo; viene de terceros: se imprime como texto, nunca como HTML. */
  error: string | null;
};

export type CorridaVigia = {
  id: string;
  /** ISO. Fechas como texto: lo que sale de aquí puede pasar por `unstable_cache` (JSON). */
  iniciadaEn: string;
  terminadaEn: string;
  origen: 'actions' | 'manual';
  totalFuentes: number;
  totalNuevas: number;
  fuentes: FuenteVigia[];
};

/** La página se leyó (hay huella): `responde`, `cambio` o `sin_cambio`. */
export const respondio = (e: EstadoVigia): boolean => e === 'responde' || e === 'cambio' || e === 'sin_cambio';

const iso = (v: unknown): string => new Date(v as string | Date).toISOString();

/**
 * Guarda una corrida con todas sus fuentes en UNA sentencia (CTE): o queda entera
 * o no queda, sin transacción interactiva (el driver HTTP no la tiene).
 *
 * El estado `cambio` / `sin_cambio` se decide acá, comparando la huella con la
 * última guardada de la MISMA fuente (la más reciente que tenga huella, no la de
 * la corrida anterior: una caída del sitio un día no debe hacer pasar por
 * «cambio» lo que no cambió). Los totales también se calculan acá: lo que dice el
 * informe de sí mismo no se toma.
 */
export async function registrarCorrida(
  informe: InformeVigia,
): Promise<{ corridaId: string; totalFuentes: number; totalNuevas: number; respondieron: number }> {
  const totalNuevas = informe.fuentes.reduce((n, f) => n + f.nuevas, 0);

  const rows = await sql`
    with c as (
      insert into vigia_corridas (iniciada_en, terminada_en, origen, total_fuentes, total_nuevas)
      values (
        ${informe.iniciada_en}::timestamptz, ${informe.terminada_en}::timestamptz,
        ${informe.origen}, ${informe.fuentes.length}, ${totalNuevas}
      )
      returning id
    ),
    f as (
      select * from jsonb_to_recordset(${JSON.stringify(informe.fuentes)}::jsonb)
        as x(id text, entidad text, url text, estado text, http_status int,
             huella text, candidatas int, nuevas int, error text)
    )
    insert into vigia_fuentes_estado
      (corrida_id, fuente_id, entidad_id, url, estado, http_status, huella, candidatas, nuevas, error)
    select
      c.id, f.id,
      (select e.id from entidades e where e.nombre = f.entidad),
      f.url,
      case
        when f.estado <> 'responde' then f.estado
        when previa.huella is null then 'responde'
        when previa.huella = f.huella then 'sin_cambio'
        else 'cambio'
      end,
      f.http_status, f.huella, f.candidatas, f.nuevas, f.error
    from c
    cross join f
    left join lateral (
      select v.huella
      from vigia_fuentes_estado v
      join vigia_corridas k on k.id = v.corrida_id
      where v.fuente_id = f.id and v.huella is not null
      order by k.iniciada_en desc
      limit 1
    ) previa on true
    returning corrida_id, estado
  `;

  const primera = rows[0];
  if (!primera) throw new Error('registrarCorrida: la sentencia no devolvió filas');

  return {
    corridaId: primera.corrida_id as string,
    totalFuentes: rows.length,
    totalNuevas,
    respondieron: rows.filter((r) => respondio(r.estado as EstadoVigia)).length,
  };
}

/** La corrida más reciente con el estado de cada fuente; null si el vigía nunca corrió. */
export async function ultimaCorrida(): Promise<CorridaVigia | null> {
  const cab = await sql`
    select id, iniciada_en, terminada_en, origen, total_fuentes, total_nuevas
    from vigia_corridas
    order by iniciada_en desc
    limit 1
  `;
  const c = cab[0];
  if (!c) return null;

  const fuentes = await sql`
    select v.fuente_id, e.nombre as entidad, v.url, v.estado, v.http_status,
           v.candidatas, v.nuevas, v.error,
           (select max(k.iniciada_en)
            from vigia_fuentes_estado w
            join vigia_corridas k on k.id = w.corrida_id
            where w.fuente_id = v.fuente_id and w.huella is not null) as ultima_respuesta
    from vigia_fuentes_estado v
    left join entidades e on e.id = v.entidad_id
    where v.corrida_id = ${c.id}
    order by v.fuente_id
  `;

  return {
    id: c.id as string,
    iniciadaEn: iso(c.iniciada_en),
    terminadaEn: iso(c.terminada_en),
    origen: c.origen as CorridaVigia['origen'],
    totalFuentes: c.total_fuentes as number,
    totalNuevas: c.total_nuevas as number,
    fuentes: fuentes.map((f) => ({
      fuenteId: f.fuente_id as string,
      entidad: (f.entidad as string | null) ?? null,
      url: f.url as string,
      estado: f.estado as EstadoVigia,
      httpStatus: (f.http_status as number | null) ?? null,
      candidatas: f.candidatas as number,
      nuevas: f.nuevas as number,
      ultimaRespuesta: f.ultima_respuesta ? iso(f.ultima_respuesta) : null,
      error: (f.error as string | null) ?? null,
    })),
  };
}

export type ResumenCorrida = {
  id: string;
  iniciadaEn: string;
  origen: 'actions' | 'manual';
  totalFuentes: number;
  respondieron: number;
  totalNuevas: number;
};

/** Las últimas `limite` corridas (10 por defecto), de la más nueva a la más vieja. */
export async function historialCorridas(limite = 10): Promise<ResumenCorrida[]> {
  const rows = await sql`
    select k.id, k.iniciada_en, k.origen, k.total_fuentes, k.total_nuevas,
           count(*) filter (where v.estado in ('responde', 'cambio', 'sin_cambio'))::int as respondieron
    from vigia_corridas k
    left join vigia_fuentes_estado v on v.corrida_id = k.id
    group by k.id
    order by k.iniciada_en desc
    limit ${limite}
  `;
  return rows.map((r) => ({
    id: r.id as string,
    iniciadaEn: iso(r.iniciada_en),
    origen: r.origen as ResumenCorrida['origen'],
    totalFuentes: r.total_fuentes as number,
    respondieron: r.respondieron as number,
    totalNuevas: r.total_nuevas as number,
  }));
}
