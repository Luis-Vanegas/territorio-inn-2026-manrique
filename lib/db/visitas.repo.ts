import 'server-only';
import { sql } from './neon';

/**
 * Contador anónimo de páginas abiertas en el sitio público.
 *
 * Vive aparte de interacciones.repo.ts porque responde otra pregunta: aquel
 * mide "a quién fueron a ver", este mide "cuánta gente llegó". Comparten el
 * modelo de privacidad —upsert agregado por día, sin evento individual— y por
 * eso ninguno de los dos necesita consentimiento previo. Ver docs/analitica.md.
 */

/**
 * Suma uno al día de hoy. Nunca lanza: contar es lo menos importante que pasa
 * en la página, y una caída del contador no puede tumbar una respuesta.
 */
export async function sumarVisita(): Promise<void> {
  try {
    await sql`
      insert into visitas_sitio (dia, conteo)
      values (current_date, 1)
      on conflict (dia)
      do update set conteo = visitas_sitio.conteo + 1
    `;
  } catch {
    // Sin base, con la conexión saturada: se pierde un número, nada más.
  }
}

/** Total de páginas abiertas en la ventana pedida. */
export async function totalVisitas(dias = 30): Promise<number> {
  const rows = (await sql`
    select coalesce(sum(conteo), 0)::int as total
    from visitas_sitio
    where dia > current_date - make_interval(days => ${dias})
  `) as { total: number }[];

  return rows[0]?.total ?? 0;
}
