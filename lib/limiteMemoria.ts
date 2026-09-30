/**
 * Límite por clave (IP) contado en la memoria de la instancia, sin base de datos.
 *
 * Por qué no reusar `lib/db/rateLimit.ts`: ese límite escribe una fila en
 * `intentos_registro` por cada llamada. `/api/interacciones` se dispara en cada
 * página vista, así que limitarlo con Postgres duplicaba las escrituras justo
 * en el endpoint que hay que proteger — y cada escritura mantiene despierto el
 * cómputo de Neon, que es lo que se cobra.
 *
 * ponytail: el contador vive en UNA instancia. Con Fluid Compute varias
 * peticiones comparten instancia, lo que basta contra un script suelto; un
 * ataque repartido entre instancias multiplica el tope por el número de
 * instancias. Si eso pasa, se mueve a una regla de rate limit del Firewall de
 * Vercel, que corta antes de ejecutar la función.
 */

const contadores = new Map<string, { n: number; hasta: number }>();
const MAX_CLAVES = 10_000;

/** `true` si esta llamada ya pasó el máximo de la ventana. Sin clave no limita. */
export function excedeLimite(
  clave: string | null,
  maximo: number,
  ventanaMs: number,
  ahora = Date.now(),
): boolean {
  if (!clave) return false;

  const c = contadores.get(clave);
  if (!c || c.hasta <= ahora) {
    // Tope de memoria: soltar todo es mejor que crecer sin techo bajo un barrido de IPs.
    if (contadores.size >= MAX_CLAVES) contadores.clear();
    contadores.set(clave, { n: 1, hasta: ahora + ventanaMs });
    return false;
  }

  c.n += 1;
  return c.n > maximo;
}
