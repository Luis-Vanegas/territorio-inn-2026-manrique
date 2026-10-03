import 'server-only';
import { sql } from './neon';
import { resolverEntidadOferente } from './entidades.repo';
import type { ConvocatoriaEntrada } from '@/lib/validation/convocatoria.schema';

/**
 * Convocatorias (oferta institucional que detecta el vigía). Tabla de la
 * migración 032, rehecha en la 033: la entidad es una FK a `entidades`, las
 * categorías a las que aplica viven en `convocatoria_categorias` (ninguna fila =
 * todas) y la formalidad en `aplica_formalidad` (vacío = cualquiera). Todo entra
 * `pendiente`: nada se muestra hasta que un moderador la aprueba, igual que un
 * negocio.
 */

/**
 * Guarda las convocatorias nuevas como `pendiente`. La URL es única: el vigía
 * corre todos los días y la misma convocatoria no se duplica ni se reabre — si un
 * moderador ya la descartó, sigue descartada.
 *
 * La entidad llega por NOMBRE y se resuelve a `entidad_id` con
 * `resolverEntidadOferente`: si no existe, se crea como oferente (ver ese
 * comentario). Las categorías y la formalidad no vienen del vigía: las elige el
 * moderador al aprobar.
 */
export async function ingestarConvocatorias(
  fuente: string,
  items: readonly ConvocatoriaEntrada[],
): Promise<{ nuevas: number; repetidas: number }> {
  let nuevas = 0;
  // Un envío trae casi siempre la misma entidad repetida: una consulta por nombre, no por fila.
  const entidades = new Map<string, string>();

  for (const c of items) {
    let entidadId = entidades.get(c.entidad);
    if (!entidadId) {
      entidadId = await resolverEntidadOferente(c.entidad);
      entidades.set(c.entidad, entidadId);
    }
    const rows = await sql`
      insert into convocatorias (titulo, entidad_id, tema, url, resumen, fecha_cierre, fuente, origen)
      values (
        ${c.titulo}, ${entidadId}, ${c.tema ?? null}, ${c.url}, ${c.resumen ?? null},
        ${c.fecha_cierre ?? null}::date, ${fuente}, 'vigia'
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

export type OrigenConvocatoria = 'vigia' | 'entidad' | 'equipo';

export type Convocatoria = {
  id: string;
  titulo: string;
  /** Nombre de la entidad (join con `entidades`). */
  entidad: string;
  entidad_id: string;
  tema: string | null;
  origen: OrigenConvocatoria;
  url: string;
  resumen: string | null;
  /** AAAA-MM-DD (to_char en la consulta: nada de `Date` ni zonas horarias). */
  fecha_cierre: string | null;
  /** Ids de `convocatoria_categorias`; vacío = todas las categorías. */
  categorias: string[];
  /** Valores de `aliados_investigacion.formalidad`; vacío = cualquiera. */
  aplica_formalidad: string[];
  estado: EstadoConvocatoria;
  fuente: string;
  detectada_en: string;
  revisada_por: string | null;
};

/** Cola del panel: la más próxima a cerrar primero, y las que no tienen fecha al final. */
export async function listarConvocatorias(estado: EstadoConvocatoria): Promise<Convocatoria[]> {
  const rows = await sql`
    select c.id, c.titulo, e.nombre as entidad, c.entidad_id, c.tema, c.origen, c.url, c.resumen,
      to_char(c.fecha_cierre, 'YYYY-MM-DD') as fecha_cierre,
      array(
        select cc.categoria_id from convocatoria_categorias cc
        where cc.convocatoria_id = c.id order by cc.categoria_id
      ) as categorias,
      c.aplica_formalidad, c.estado, c.fuente,
      to_char(c.detectada_en at time zone 'America/Bogota', 'YYYY-MM-DD') as detectada_en,
      c.revisada_por
    from convocatorias c
    join entidades e on e.id = c.entidad_id
    where c.estado = ${estado}
    order by c.fecha_cierre asc nulls last, c.detectada_en desc
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
 * Al aprobar se fija también A QUIÉN aplica: `aplica_formalidad` y las filas de
 * `convocatoria_categorias` (se reemplazan por las elegidas; las que no existan
 * en `categorias` se ignoran por el join). Todo en UNA sentencia con CTEs: el
 * driver HTTP no tiene transacciones interactivas, y aprobar sin categorías
 * sería publicarla «para todos» por un fallo a mitad de camino. El borrado y el
 * insert no se pisan: uno toca solo lo que sale y el otro tiene `on conflict`.
 *
 * Devuelve false si la fila no existe o no estaba en un estado desde el que se
 * pueda hacer eso.
 */
export async function decidirConvocatoria(
  id: string,
  decision: DecisionConvocatoria,
  moderadorEmail: string,
  aplica: { categorias: readonly string[]; formalidades: readonly string[] } = {
    categorias: [],
    formalidades: [],
  },
): Promise<boolean> {
  const nuevo = RESULTADO[decision];
  const desde: EstadoConvocatoria[] =
    decision === 'aprobar' ? ['pendiente'] : ['pendiente', 'aprobada'];
  const aprobar = decision === 'aprobar';
  const categorias = aprobar ? [...aplica.categorias] : [];
  const formalidades = [...aplica.formalidades];

  const rows = await sql`
    with decidida as (
      update convocatorias
      set estado = ${nuevo}, revisada_por = ${moderadorEmail}, revisada_en = now(),
          aplica_formalidad = case
            when ${aprobar}::boolean then ${formalidades}::text[]
            else aplica_formalidad
          end
      where id = ${id}
        and estado = any(${desde}::text[])
        and (not ${aprobar}::boolean or fecha_cierre is null or fecha_cierre >= current_date)
      returning id
    ),
    sobrantes as (
      delete from convocatoria_categorias cc
      using decidida d
      where ${aprobar}::boolean
        and cc.convocatoria_id = d.id
        and cc.categoria_id <> all(${categorias}::text[])
    ),
    elegidas as (
      insert into convocatoria_categorias (convocatoria_id, categoria_id)
      select d.id, cat.id from decidida d
      join categorias cat on cat.id = any(${categorias}::text[])
      on conflict do nothing
    )
    select id from decidida
  `;
  return rows.length > 0;
}

// ── Panel del negocio: «Para ti» ────────────────────────────────────

export type ConvocatoriaParaTi = Pick<
  Convocatoria,
  'id' | 'titulo' | 'entidad' | 'tema' | 'url' | 'resumen' | 'fecha_cierre' | 'fuente'
>;

/** Lo que importa de un negocio para «Para ti»: su categoría y su formalidad. */
export type PerfilParaTi = { categoria_id: string; formalidad: string | null };

/**
 * Convocatorias aprobadas y vigentes que le aplican a ALGUNO de estos negocios,
 * negocio por negocio: la categoría Y la formalidad tienen que ser del mismo
 * (si no, una cuenta con una tienda formal y un taller informal vería lo que es
 * para «talleres formales»). Sin filas en `convocatoria_categorias` = todas las
 * categorías; `aplica_formalidad` vacío = cualquiera.
 *
 * Un negocio sin formalidad conocida (null o «prefiero no decir») ve también
 * las restringidas: no
 * sabemos si le aplica, y «Para ti» ya pide confirmar requisitos en el sitio de
 * quien convoca. Esconderla por un dato que falta sería peor.
 *
 * Es información pública de entidades, no datos de la persona: lo que sí es
 * suyo (sus negocios) llega ya resuelto por `perfilesParaTi` en `cuenta.repo.ts`,
 * que filtra por su sesión.
 */
export async function convocatoriasParaTi(
  perfiles: readonly PerfilParaTi[],
): Promise<ConvocatoriaParaTi[]> {
  if (perfiles.length === 0) return [];
  const categorias = perfiles.map((p) => p.categoria_id);
  const formalidades = perfiles.map((p) => p.formalidad);

  const rows = await sql`
    with perfil as (
      select * from unnest(${categorias}::text[], ${formalidades}::text[]) as t(categoria_id, formalidad)
    )
    select c.id, c.titulo, e.nombre as entidad, c.tema, c.url, c.resumen,
      to_char(c.fecha_cierre, 'YYYY-MM-DD') as fecha_cierre, c.fuente
    from convocatorias c
    join entidades e on e.id = c.entidad_id
    where c.estado = 'aprobada'
      and (c.fecha_cierre is null or c.fecha_cierre >= current_date)
      and exists (
        select 1 from perfil pf
        where (
            not exists (select 1 from convocatoria_categorias cc where cc.convocatoria_id = c.id)
            or exists (
              select 1 from convocatoria_categorias cc
              where cc.convocatoria_id = c.id and cc.categoria_id = pf.categoria_id
            )
          )
          and (
            c.aplica_formalidad = '{}'
            or pf.formalidad is null
            or pf.formalidad = 'prefiero_no_decir'
            or pf.formalidad = any(c.aplica_formalidad)
          )
      )
    order by c.fecha_cierre asc nulls last, c.detectada_en desc
    limit 20
  `;
  return rows as ConvocatoriaParaTi[];
}
