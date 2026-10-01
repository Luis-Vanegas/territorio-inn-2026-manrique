import 'server-only';
import crypto from 'node:crypto';

/**
 * Compara un header contra un secreto compartido en tiempo constante.
 *
 * Lo usan los endpoints que llama una máquina y no una persona (`/api/cron/purgar`
 * y `/api/ingesta/convocatorias`). Era una copia inline en el cron; con el
 * segundo uso se extrae, para que no haya dos criterios para lo mismo.
 *
 * `timingSafeEqual` tira RangeError si los largos difieren, así que el chequeo de
 * longitud va antes: filtra el largo del secreto, no su contenido.
 */
export function secretoValido(recibido: string | null, esperado: string): boolean {
  if (!recibido) return false;

  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
