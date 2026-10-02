import 'server-only';
import { unstable_cache } from 'next/cache';
import { sql } from './neon';
import { BARRIOS_COMUNA_3 } from '@/lib/geo/constantes';
import { OPCIONES_FORMALIDAD, OPCIONES_MAYOR_DOLOR } from '@/lib/validation/portafolio.schema';
import { celda, K_MINIMO, suprimir, type Celda } from '@/lib/privacidad/kAnonimato';

/**
 * Datos abiertos agregados (`GET /api/datos`).
 *
 * Qué entra: SOLO negocios `aprobado`, y solo conteos. Qué no entra jamás:
 * nombres de negocios, contactos, direcciones, coordenadas, tokens, IP, ni la
 * respuesta de ninguna persona. Las consultas de acá no seleccionan ninguna de
 * esas columnas (lo comprueba `scripts/verificar-datos-k.mjs` leyendo este
 * archivo), así que no hay nada que «filtrar después»: el dato personal nunca
 * llega a esta capa.
 *
 * Toda celda pasa por `lib/privacidad/kAnonimato.ts`: menos de 5 sale como «<5».
 * Los ceros también: «no hay ninguno» es una afirmación sobre un negocio posible.
 * Por eso cada dimensión lista TODAS sus opciones (no solo las que tienen
 * filas): que una opción falte en la respuesta diría que su conteo es cero.
 *
 * `formalidad` y `mayor_dolor` salen de `aliados_investigacion` (tabla privada)
 * y son enumeraciones cerradas, no texto libre: lo que se publica es cuántos
 * negocios eligieron cada opción, nunca quién.
 */

export type FilaCategoria = { id: string; nombre: string; negocios: Celda };
export type FilaBarrio = { nombre: string; negocios: Celda };
export type FilaOpcion = { id: string; negocios: Celda };

export type DatosAbiertos = {
  version: 1;
  generado_en: string;
  k_minimo: number;
  fuente: string;
  nota_privacidad: string;
  negocios_aprobados: Celda;
  por_categoria: FilaCategoria[];
  por_barrio: FilaBarrio[];
  por_formalidad: FilaOpcion[];
  /** Cada negocio puede elegir hasta dos: las celdas no suman el total. */
  por_mayor_dolor: FilaOpcion[];
};

const OTRO_BARRIO = 'Otro barrio';

async function calcularDatosAbiertos(): Promise<DatosAbiertos> {
  const [totalRows, categoriaRows, barrioRows, formalidadRows, dolorRows] = await Promise.all([
    sql`select count(*)::int as total from portafolios where estado = 'aprobado'`,
    sql`
      select c.id, c.nombre, count(p.id)::int as negocios
      from categorias c
      left join portafolios p on p.categoria_id = c.id and p.estado = 'aprobado'
      where c.activa = true
      group by c.id, c.nombre, c.orden
      order by c.orden, c.nombre
    `,
    sql`
      select barrio, count(*)::int as negocios
      from portafolios
      where estado = 'aprobado'
      group by barrio
    `,
    sql`
      select i.formalidad as id, count(*)::int as negocios
      from aliados_investigacion i
      join portafolios p on p.id = i.portafolio_id
      where p.estado = 'aprobado' and i.formalidad is not null
      group by i.formalidad
    `,
    sql`
      select d as id, count(*)::int as negocios
      from aliados_investigacion i
      join portafolios p on p.id = i.portafolio_id
      cross join lateral unnest(i.mayor_dolor) as d
      where p.estado = 'aprobado'
      group by d
    `,
  ]);

  const total = (totalRows[0] as { total: number } | undefined)?.total ?? 0;

  // Barrio: el campo es texto que escribió la persona (con «Otro» libre), así
  // que un barrio que no esté en la lista oficial se agrupa: el texto libre
  // podría ser una dirección.
  const porBarrio = new Map<string, number>(BARRIOS_COMUNA_3.map((b) => [b, 0]));
  porBarrio.set(OTRO_BARRIO, 0);
  for (const r of barrioRows as { barrio: string; negocios: number }[]) {
    const clave = porBarrio.has(r.barrio) && r.barrio !== OTRO_BARRIO ? r.barrio : OTRO_BARRIO;
    porBarrio.set(clave, (porBarrio.get(clave) ?? 0) + r.negocios);
  }

  // Opciones cerradas; lo que la base tenga de versiones viejas del formulario
  // (el CHECK admite más valores que la lista vigente) cae en `otro`.
  const contarOpciones = (
    opciones: readonly string[],
    filas: { id: string; negocios: number }[],
    conOtro = false,
  ) => {
    const m = new Map<string, number>(opciones.map((o) => [o, 0]));
    if (conOtro) m.set('otro', 0);
    for (const r of filas) {
      const clave = m.has(r.id) ? r.id : 'otro';
      if (!m.has(clave)) continue;
      m.set(clave, (m.get(clave) ?? 0) + r.negocios);
    }
    return [...m].map(([id, negocios]) => ({ id, negocios }));
  };

  return {
    version: 1,
    generado_en: new Date().toISOString(),
    k_minimo: K_MINIMO,
    fuente: 'Constelaciones · Manrique: negocios de la Comuna 3 de Medellín que se registraron y fueron aprobados por moderación humana.',
    nota_privacidad: `Solo conteos de negocios aprobados. Las celdas con menos de ${K_MINIMO} negocios se publican como "<${K_MINIMO}". No se publican nombres, contactos, direcciones ni respuestas individuales (Ley 1581 de 2012).`,
    negocios_aprobados: celda(total),
    por_categoria: suprimir(categoriaRows as { id: string; nombre: string; negocios: number }[], {
      particion: true,
    }),
    por_barrio: suprimir(
      [...porBarrio].map(([nombre, negocios]) => ({ nombre, negocios })),
      { particion: true },
    ),
    por_formalidad: suprimir(contarOpciones(OPCIONES_FORMALIDAD, formalidadRows as FilaOpcionCruda[])),
    por_mayor_dolor: suprimir(contarOpciones(OPCIONES_MAYOR_DOLOR, dolorRows as FilaOpcionCruda[], true)),
  };
}

type FilaOpcionCruda = { id: string; negocios: number };

/**
 * Caché de 1 h, sin etiqueta de la vitrina: aprobar un negocio no tiene por qué
 * refrescar esto al instante, y una caché que cambia con cada moderación facilita
 * comparar fotos para deducir celdas pequeñas (ver kAnonimato.ts).
 */
export const obtenerDatosAbiertos = unstable_cache(calcularDatosAbiertos, ['datos-abiertos'], {
  revalidate: 3600,
});
