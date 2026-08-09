import 'server-only';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

/**
 * Único punto del código que conoce el driver de la base.
 *
 * Migrabilidad: todo el SQL del proyecto es Postgres estándar y las queries
 * viven en los repositorios, no acá. Para mover el proyecto a Supabase, RDS o
 * un Postgres administrado, se cambia este archivo — nada más.
 *
 * Se usa el driver HTTP (no Pool): las server actions y los server components
 * hacen consultas sueltas y sin estado, que es justo para lo que sirve. Las
 * migraciones sí usan Pool, porque necesitan transacciones interactivas.
 *
 * ── Por qué la inicialización es diferida ──
 *
 * La primera versión leía DATABASE_URL al importarse el módulo y lanzaba si
 * faltaba. Eso rompía `next build`: durante "Collecting page data" Next importa
 * cada página, el módulo se evaluaba y el build moría con:
 *
 *   Error: Failed to collect page data for /admin/estadisticas
 *
 * Y no tenía por qué. Todas las páginas que tocan la base son force-dynamic:
 * ninguna consulta nada en tiempo de build. Exigir credenciales de producción
 * para compilar es acoplar dos cosas que no dependen entre sí — además de
 * impedir que alguien clone el repo y compile sin una base a mano.
 *
 * Con el Proxy, la conexión se arma en la primera query real. Si falta la
 * variable, el error aparece igual, con el mismo mensaje, en el momento en que
 * de verdad importa: al atender un request.
 */

let cliente: NeonQueryFunction<false, false> | null = null;

function obtenerCliente(): NeonQueryFunction<false, false> {
  if (cliente) return cliente;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'Falta DATABASE_URL. En local va en .env.local; en Vercel, en Project Settings → Environment Variables.',
    );
  }

  cliente = neon(url);
  return cliente;
}

/**
 * Se usa igual que el cliente real: sql`select ...`, sql.unsafe(), sql.transaction().
 * El Proxy solo difiere el momento de construirlo; no cambia la API.
 */
export const sql = new Proxy((() => {}) as unknown as NeonQueryFunction<false, false>, {
  apply(_destino, _this, args: unknown[]) {
    return (obtenerCliente() as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_destino, prop, receptor) {
    return Reflect.get(obtenerCliente() as object, prop, receptor);
  },
});
