import 'server-only';
import { sql } from './neon';

/**
 * Contador anónimo de interacciones con los aliados.
 *
 * No hay tabla de eventos individuales a propósito: el upsert agregado por
 * (negocio, día, tipo) hace imposible reconstruir el recorrido de una persona
 * aunque alguien quisiera. La privacidad es una propiedad del esquema, no una
 * promesa en la política de datos.
 */

export type TipoInteraccion = 'vista' | 'contacto';

export const TIPOS_INTERACCION: readonly TipoInteraccion[] = ['vista', 'contacto'];

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Suma uno. Devuelve false si el id no es un uuid o el negocio no existe —
 * la FK se encarga de lo segundo, y el catch evita que un id inventado
 * escriba una fila huérfana o tire un 500.
 *
 * ponytail: sin rate limit propio. El techo conocido es que alguien scriptee
 * el endpoint e infle su propio contador; a escala barrial el costo de eso es
 * un número feo en un panel interno, no un problema real. Si aparece abuso,
 * el patrón ya está resuelto en lib/db/rateLimit.ts y se reutiliza acá.
 */
export async function sumarInteraccion(
  portafolioId: string,
  tipo: TipoInteraccion,
): Promise<boolean> {
  if (!RE_UUID.test(portafolioId)) return false;

  try {
    await sql`
      insert into interacciones_portafolio (portafolio_id, dia, tipo, conteo)
      values (${portafolioId}, current_date, ${tipo}, 1)
      on conflict (portafolio_id, dia, tipo)
      do update set conteo = interacciones_portafolio.conteo + 1
    `;
    return true;
  } catch {
    // Portafolio inexistente (violación de FK). No se distingue del caso feliz
    // hacia afuera: responder distinto convertiría el endpoint en una forma de
    // averiguar qué ids existen.
    return false;
  }
}

export type FilaInteraccion = {
  id: string;
  nombre: string;
  categoria_nombre: string;
  vistas: number;
  contactos: number;
};

/**
 * Ranking para el panel. Incluye los negocios con cero interacciones: saber
 * que un aliado aprobado no recibió una sola visita en 30 días es tan
 * accionable como saber cuál es el más visto.
 */
export async function rankingInteracciones(dias = 30): Promise<FilaInteraccion[]> {
  const rows = await sql`
    select
      p.id,
      p.nombre,
      c.nombre as categoria_nombre,
      coalesce(sum(i.conteo) filter (where i.tipo = 'vista'), 0)::int    as vistas,
      coalesce(sum(i.conteo) filter (where i.tipo = 'contacto'), 0)::int as contactos
    from portafolios p
    join categorias c on c.id = p.categoria_id
    left join interacciones_portafolio i
      on i.portafolio_id = p.id
     and i.dia > current_date - make_interval(days => ${dias})
    where p.estado = 'aprobado'
    group by p.id, p.nombre, c.nombre
    order by vistas desc, contactos desc, p.nombre
  `;
  return rows as FilaInteraccion[];
}

export type TotalesInteraccion = { vistas: number; contactos: number };

export async function totalesInteracciones(dias = 30): Promise<TotalesInteraccion> {
  const rows = (await sql`
    select
      coalesce(sum(conteo) filter (where tipo = 'vista'), 0)::int    as vistas,
      coalesce(sum(conteo) filter (where tipo = 'contacto'), 0)::int as contactos
    from interacciones_portafolio
    where dia > current_date - make_interval(days => ${dias})
  `) as TotalesInteraccion[];

  return rows[0] ?? { vistas: 0, contactos: 0 };
}
