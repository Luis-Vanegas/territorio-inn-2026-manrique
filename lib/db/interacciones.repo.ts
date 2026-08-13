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

export type FilaDiaInteraccion = { dia: string; vistas: number; contactos: number };

/**
 * Serie diaria para el panel. Mismo criterio que `registrosPorDia`: los días
 * sin una sola interacción se devuelven en cero en vez de faltar, porque un
 * hueco en la serie también es información — dice que ese día nadie miró.
 */
export async function interaccionesPorDia(dias = 30): Promise<FilaDiaInteraccion[]> {
  const rows = await sql`
    select
      to_char(d.dia, 'YYYY-MM-DD') as dia,
      coalesce(sum(i.conteo) filter (where i.tipo = 'vista'), 0)::int    as vistas,
      coalesce(sum(i.conteo) filter (where i.tipo = 'contacto'), 0)::int as contactos
    from generate_series(
      current_date - make_interval(days => ${dias - 1}),
      current_date,
      interval '1 day'
    ) as d(dia)
    left join interacciones_portafolio i on i.dia = d.dia::date
    group by d.dia
    order by d.dia
  `;
  return rows as FilaDiaInteraccion[];
}

export type FilaCruda = {
  portafolio_id: string;
  negocio: string;
  dia: string;
  tipo: TipoInteraccion;
  conteo: number;
};

/**
 * Datos crudos para exportar: una fila por negocio, día y tipo.
 *
 * Se exporta el detalle y no el resumen a propósito. Un CSV pre-agregado
 * obliga a volver a pedirle al equipo otra exportación en cuanto la pregunta
 * cambia ("¿y por semana?", "¿y solo alimentación?"). Con el detalle, una
 * tabla dinámica responde todas esas preguntas sin tocar el código.
 */
export async function interaccionesCrudas(dias = 365): Promise<FilaCruda[]> {
  const rows = await sql`
    select
      i.portafolio_id,
      p.nombre                     as negocio,
      to_char(i.dia, 'YYYY-MM-DD') as dia,
      i.tipo,
      i.conteo
    from interacciones_portafolio i
    join portafolios p on p.id = i.portafolio_id
    where i.dia > current_date - make_interval(days => ${dias})
    order by i.dia desc, p.nombre, i.tipo
  `;
  return rows as FilaCruda[];
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
