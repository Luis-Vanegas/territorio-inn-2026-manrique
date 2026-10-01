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
