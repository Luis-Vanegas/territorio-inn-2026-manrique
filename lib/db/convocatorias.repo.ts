import 'server-only';
import { sql } from './neon';
import type { ConvocatoriaEntrada } from '@/lib/validation/convocatoria.schema';

/**
 * Convocatorias (oferta institucional que detecta el vigía). Tabla de la
 * migración 032. Todo entra `pendiente`: nada se muestra hasta que un moderador
 * la aprueba, igual que un negocio.
 */

/**
 * Guarda las convocatorias nuevas como `pendiente`. La URL es única: el vigía
 * corre todos los días y la misma convocatoria no se duplica ni se reabre — si un
 * moderador ya la descartó, sigue descartada.
 */
export async function ingestarConvocatorias(
  fuente: string,
  items: readonly ConvocatoriaEntrada[],
): Promise<{ nuevas: number; repetidas: number }> {
  let nuevas = 0;

  for (const c of items) {
    const rows = await sql`
      insert into convocatorias (titulo, entidad, url, resumen, fecha_cierre, aplica_a, fuente)
      values (
        ${c.titulo}, ${c.entidad}, ${c.url}, ${c.resumen ?? null},
        ${c.fecha_cierre ?? null}::date, ${c.aplica_a}::text[], ${fuente}
      )
      on conflict (url) do nothing
      returning id
    `;
    nuevas += rows.length;
  }

  return { nuevas, repetidas: items.length - nuevas };
}

/** Pasa a `vencida` lo que ya cerró. Lo puede hacer el sistema solo. */
export async function marcarVencidas(): Promise<number> {
  const rows = await sql`
    update convocatorias
    set estado = 'vencida'
    where estado in ('pendiente', 'aprobada')
      and fecha_cierre is not null
      and fecha_cierre < current_date
    returning id
  `;
  return rows.length;
}

// ── Moderación (panel) ──────────────────────────────────────

export type EstadoConvocatoria = 'pendiente' | 'aprobada' | 'descartada' | 'vencida';

export const ESTADOS_CONVOCATORIA: readonly EstadoConvocatoria[] = [
  'pendiente',
  'aprobada',
  'descartada',
  'vencida',
];

export type Convocatoria = {
  id: string;
  titulo: string;
  entidad: string;
  url: string;
  resumen: string | null;
  /** AAAA-MM-DD (to_char en la consulta: nada de `Date` ni zonas horarias). */
  fecha_cierre: string | null;
  aplica_a: string[];
  estado: EstadoConvocatoria;
  fuente: string;
  detectada_en: string;
  revisada_por: string | null;
};

/** Cola del panel: la más próxima a cerrar primero, y las que no tienen fecha al final. */
export async function listarConvocatorias(estado: EstadoConvocatoria): Promise<Convocatoria[]> {
  const rows = await sql`
    select id, titulo, entidad, url, resumen,
      to_char(fecha_cierre, 'YYYY-MM-DD') as fecha_cierre, aplica_a, estado, fuente,
      to_char(detectada_en at time zone 'America/Bogota', 'YYYY-MM-DD') as detectada_en,
      revisada_por
    from convocatorias
    where estado = ${estado}
    order by fecha_cierre asc nulls last, detectada_en desc
  `;
  return rows as Convocatoria[];
}

export async function contarConvocatoriasPorEstado(): Promise<Record<EstadoConvocatoria, number>> {
  const rows = (await sql`
    select estado, count(*)::int as total from convocatorias group by estado
  `) as { estado: EstadoConvocatoria; total: number }[];

  const conteos: Record<EstadoConvocatoria, number> = {
    pendiente: 0,
    aprobada: 0,
    descartada: 0,
    vencida: 0,
  };
  for (const r of rows) conteos[r.estado] = r.total;
  return conteos;
}

export type DecisionConvocatoria = 'aprobar' | 'descartar' | 'vencida';

const RESULTADO: Record<DecisionConvocatoria, EstadoConvocatoria> = {
  aprobar: 'aprobada',
  descartar: 'descartada',
  vencida: 'vencida',
};

/**
 * Aprobar, descartar o marcar vencida, dejando quién y cuándo (la restricción
 * `chk_convocatoria_revisada` exige `revisada_en` para aprobada/descartada).
 *
 * Desde qué estado se puede cada cosa va en el WHERE, no en la pantalla: una
 * acción es un endpoint HTTP y alguien puede mandarla sobre cualquier fila. Una
 * descartada no se reabre desde acá (el vigía tampoco la reabre: la URL es única)
 * y una convocatoria que ya cerró no se aprueba: nacería vencida.
 *
 * Devuelve false si la fila no existe o no estaba en un estado desde el que se
 * pueda hacer eso.
 */
export async function decidirConvocatoria(
  id: string,
  decision: DecisionConvocatoria,
  moderadorEmail: string,
): Promise<boolean> {
  const nuevo = RESULTADO[decision];
  const desde: EstadoConvocatoria[] =
    decision === 'aprobar' ? ['pendiente'] : ['pendiente', 'aprobada'];

  const rows = await sql`
    update convocatorias
    set estado = ${nuevo}, revisada_por = ${moderadorEmail}, revisada_en = now()
    where id = ${id}
      and estado = any(${desde}::text[])
      and (${decision !== 'aprobar'}::boolean or fecha_cierre is null or fecha_cierre >= current_date)
    returning id
  `;
  return rows.length > 0;
}

// ── Mi cuenta: «Para ti» ────────────────────────────────────

export type ConvocatoriaParaTi = Pick<
  Convocatoria,
  'id' | 'titulo' | 'entidad' | 'url' | 'resumen' | 'fecha_cierre' | 'fuente'
>;

/**
 * Convocatorias aprobadas y vigentes que aplican a alguna de estas categorías
 * (`aplica_a` vacío = a todos los negocios). Es información pública de entidades,
 * no datos de la persona: lo que sí es suyo (qué categorías tiene) llega ya
 * resuelto por `categoriasDe` en `cuenta.repo.ts`, que filtra por su sesión.
 */
export async function convocatoriasParaTi(
  categoriaIds: readonly string[],
): Promise<ConvocatoriaParaTi[]> {
  const rows = await sql`
    select id, titulo, entidad, url, resumen,
      to_char(fecha_cierre, 'YYYY-MM-DD') as fecha_cierre, fuente
    from convocatorias
    where estado = 'aprobada'
      and (fecha_cierre is null or fecha_cierre >= current_date)
      and (aplica_a = '{}' or aplica_a && ${categoriaIds as string[]}::text[])
    order by fecha_cierre asc nulls last, detectada_en desc
    limit 20
  `;
  return rows as ConvocatoriaParaTi[];
}
