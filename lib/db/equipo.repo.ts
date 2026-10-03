import 'server-only';
import { sql } from './neon';
import { POR_PAGINA_BITACORA } from './bitacora.repo';
import type { EstadoPortafolio } from './portafolios.repo';

/**
 * Lecturas propias del panel del equipo (`/firmamento/equipo`): conteos del
 * menú, el insumo de las alertas de calidad y del territorio, los cambios que
 * hicieron los dueños y el aprendizaje del sugeridor.
 *
 * Solo las llama el panel del equipo, detrás de `exigirEquipo()`: el equipo ve
 * todo (docs/base-de-datos.md › Quién lee qué). Nada de acá sale a la vitrina
 * ni a una entidad. Las alertas NO se guardan: se calculan al vuelo sobre
 * `fichasParaCalidad` (lib/firmamento/calidad.ts).
 */

export type ConteosPanel = { moderacion: number; convocatorias: number; peticiones: number };

/** Insignias del menú: lo que espera una decisión del equipo. */
export async function conteosPanel(): Promise<ConteosPanel> {
  const rows = (await sql`
    select
      (select count(*)::int from portafolios where estado = 'pendiente') as moderacion,
      (select count(*)::int from convocatorias where estado = 'pendiente') as convocatorias,
      (select count(*)::int from peticiones where estado = 'nueva') as peticiones
  `) as ConteosPanel[];
  return rows[0]!;
}

export type FichaCalidad = {
  id: string;
  nombre: string;
  estado: Extract<EstadoPortafolio, 'pendiente' | 'aprobado'>;
  latitud: number;
  longitud: number;
  barrio: string;
  barrio_oficial: string | null;
  categoria_id: string;
  categoria_nombre: string;
  categoria_otra: string | null;
  tiene_foto: boolean;
  tiene_whatsapp: boolean;
};

/**
 * Fichas vivas (publicadas y por revisar) con lo justo para las alertas, la
 * cobertura y el territorio. Sin contactos: solo si existen (`tiene_*`).
 */
export async function fichasParaCalidad(): Promise<FichaCalidad[]> {
  const rows = await sql`
    select p.id, p.nombre, p.estado,
      p.latitud::float8 as latitud, p.longitud::float8 as longitud,
      p.barrio, p.barrio_oficial, p.categoria_id, c.nombre as categoria_nombre, p.categoria_otra,
      (p.foto_url is not null) as tiene_foto,
      (p.whatsapp is not null) as tiene_whatsapp
    from portafolios p
    join categorias c on c.id = p.categoria_id
    where p.estado in ('pendiente', 'aprobado')
    order by p.nombre
  `;
  return rows as FichaCalidad[];
}

export type CambioDelDueno = {
  id: number;
  /** AAAA-MM-DD HH:MI, hora de Bogotá. */
  creado_en: string;
  portafolio_id: string;
  portafolio_nombre: string;
  estado: EstadoPortafolio;
  campos: string[];
};

/**
 * «Cambios recientes»: lo que los dueños editaron en su ficha. La edición del
 * dueño se publica directo (docs/firmamento-modulos.md, decisión 2) y el equipo
 * corrige después: esta lista es su punto de partida. Paginada como la bitácora.
 */
export async function cambiosDeDuenos(pagina = 1): Promise<{ filas: CambioDelDueno[]; hayMas: boolean }> {
  const desde = (Math.max(1, Math.floor(pagina)) - 1) * POR_PAGINA_BITACORA;
  const rows = (await sql`
    select b.id::int as id,
      to_char(b.creado_en at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI') as creado_en,
      b.portafolio_id, p.nombre as portafolio_nombre, p.estado, b.campos
    from bitacora b
    join portafolios p on p.id = b.portafolio_id
    where b.actor_tipo = 'negocio' and b.accion = 'ficha_editada'
    order by b.creado_en desc, b.id desc
    limit ${POR_PAGINA_BITACORA + 1} offset ${desde}
  `) as CambioDelDueno[];
  return { filas: rows.slice(0, POR_PAGINA_BITACORA), hayMas: rows.length > POR_PAGINA_BITACORA };
}

export type AprendizajeSugeridor = {
  total: number;
  /** La persona eligió la categoría que propuso el modelo. */
  aceptadas: number;
  /** Eligió otra. */
  corregidas: number;
  /** Sin dato de si la aceptó (sugerencias viejas o del buscador). */
  sinDato: number;
  /** Con negocio enlazado (033): las únicas que sirven para reentrenar. */
  conFicha: number;
  /** De esas, cuántas coinciden con la categoría que tiene HOY la ficha (tras las correcciones del equipo). */
  coincidenConFicha: number;
  porCategoria: { categoria: string; total: number; aceptadas: number }[];
};

/** Conteos de `sugerencias_categoria`: nunca el texto (la tabla no lo guarda). */
export async function aprendizajeSugeridor(): Promise<AprendizajeSugeridor> {
  const [totales, categorias] = await Promise.all([
    sql`
      select count(*)::int as total,
        count(*) filter (where s.aceptada)::int as aceptadas,
        count(*) filter (where s.aceptada = false)::int as corregidas,
        count(*) filter (where s.aceptada is null)::int as sin_dato,
        count(p.id)::int as con_ficha,
        count(*) filter (where p.categoria_id = s.categoria_inferida)::int as coinciden
      from sugerencias_categoria s
      left join portafolios p on p.id = s.portafolio_id
    `,
    sql`
      select categoria_inferida as categoria, count(*)::int as total,
        count(*) filter (where aceptada)::int as aceptadas
      from sugerencias_categoria
      group by categoria_inferida
      order by total desc, categoria_inferida
    `,
  ]);
  const t = totales[0] as {
    total: number;
    aceptadas: number;
    corregidas: number;
    sin_dato: number;
    con_ficha: number;
    coinciden: number;
  };
  return {
    total: t.total,
    aceptadas: t.aceptadas,
    corregidas: t.corregidas,
    sinDato: t.sin_dato,
    conFicha: t.con_ficha,
    coincidenConFicha: t.coinciden,
    porCategoria: categorias as AprendizajeSugeridor['porCategoria'],
  };
}

export type CeldaAlcance = { categoria_id: string; formalidad: string | null; n: number };

/**
 * Aliados publicados CON CUENTA por categoría y formalidad: con esto la ficha de
 * una convocatoria cuenta a cuántos llegaría según lo que se marque al aprobar.
 * Sin cuenta (registro por enlace) no hay «Para ti» donde verla, así que no cuentan.
 * Solo conteos; la formalidad sale de `aliados_investigacion` (privada) y no se
 * cruza con ningún nombre.
 */
export async function matrizAlcance(): Promise<CeldaAlcance[]> {
  const rows = await sql`
    select p.categoria_id, i.formalidad, count(*)::int as n
    from portafolios p
    left join aliados_investigacion i on i.portafolio_id = p.id
    where p.estado = 'aprobado' and p.usuario_id is not null
    group by p.categoria_id, i.formalidad
  `;
  return rows as CeldaAlcance[];
}
