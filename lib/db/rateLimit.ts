import 'server-only';
import { createHash } from 'node:crypto';
import { sql } from './neon';

/**
 * Límite de registros por IP sobre la tabla intentos_registro.
 *
 * Por qué Postgres y no Upstash: el endpoint de registro ya escribe en la base
 * en el mismo request. Sumar Redis agrega un servicio, una credencial y un
 * punto de falla para ahorrar una query que ya está en el camino caliente.
 * Si el volumen crece hasta que esta query moleste, se cambia — no antes.
 *
 * Limitación conocida: detrás de un NAT compartido (un café, una biblioteca,
 * un colegio) varias personas comparten IP y comparten el cupo. Por eso el
 * límite es holgado y el mensaje dice cuánto falta en vez de solo negar.
 */

export type OrigenIntento = 'registro' | 'login' | 'estado';

/**
 * Cupos por origen. Son distintos a propósito:
 *
 * - `registro`: publicar un negocio es una acción deliberada que nadie repite
 *   diez veces seguidas. El cupo corta el scripteo sin molestar a nadie.
 * - `login`: equivocarse de contraseña dos o tres veces es normal, y bloquear
 *   al moderador que entra a aprobar registros es peor que el ataque que
 *   evitamos. La ventana es más larga porque lo que se frena acá no es un
 *   error humano sino un diccionario de miles de intentos.
 * - `estado`: editar o pedir el borrado desde /aliados/estado/[token]. Cupo
 *   parecido a registro — corregir un dato no es algo que se repita muchas
 *   veces en 10 minutos, y esto protege la ruta de intentos automatizados de
 *   adivinar un token válido (aunque el UUID en sí ya lo hace inviable).
 */
const CUPOS: Record<OrigenIntento, { maximo: number; ventanaMinutos: number }> = {
  registro: { maximo: 3, ventanaMinutos: 10 },
  login: { maximo: 8, ventanaMinutos: 15 },
  estado: { maximo: 6, ventanaMinutos: 10 },
};

export type ResultadoLimite =
  | { permitido: true }
  | { permitido: false; minutosRestantes: number };

export async function verificarLimite(
  ip: string | null,
  origen: OrigenIntento = 'registro',
): Promise<ResultadoLimite> {
  const { maximo: MAX_INTENTOS, ventanaMinutos: VENTANA_MINUTOS } = CUPOS[origen];

  // Sin IP no se puede limitar. Se deja pasar en vez de bloquear a todos:
  // negar por falta de un header rompe el formulario para usuarios legítimos
  // detrás de proxies que no lo reenvían.
  if (!ip) return { permitido: true };

  const rows = (await sql`
    select
      count(*)::int as intentos,
      min(creado_en) as mas_antiguo
    from intentos_registro
    where ip = ${ip}::inet
      and origen = ${origen}
      and creado_en > now() - make_interval(mins => ${VENTANA_MINUTOS})
  `) as { intentos: number; mas_antiguo: string | null }[];

  const fila = rows[0];
  if (!fila || fila.intentos < MAX_INTENTOS) return { permitido: true };

  // El cupo se libera cuando el intento más viejo sale de la ventana.
  const liberaEn = fila.mas_antiguo
    ? new Date(fila.mas_antiguo).getTime() + VENTANA_MINUTOS * 60_000
    : Date.now();

  return {
    permitido: false,
    minutosRestantes: Math.max(1, Math.ceil((liberaEn - Date.now()) / 60_000)),
  };
}

/**
 * Registra el intento. Se llama incluso cuando el registro después falla:
 * si solo contáramos los exitosos, un atacante podría mandar payloads
 * inválidos sin límite y saturar igual el endpoint y el Blob.
 */
export async function registrarIntento(
  ip: string | null,
  origen: OrigenIntento = 'registro',
): Promise<void> {
  if (!ip) return;
  await sql`insert into intentos_registro (ip, origen) values (${ip}::inet, ${origen})`;
}

/**
 * Purga los intentos viejos. Se llama desde un cron de Vercel.
 * Sin esto la tabla crece para siempre: cada registro deja una fila que ya
 * no sirve para nada pasados 10 minutos.
 */
export async function purgarIntentos(): Promise<number> {
  const rows = await sql`
    delete from intentos_registro
    where creado_en < now() - interval '1 day'
    returning 1
  `;
  return rows.length;
}

/**
 * Extrae la IP del cliente de los headers.
 * En Vercel, x-forwarded-for llega como "cliente, proxy1, proxy2" y el primero
 * es el real. Se valida el formato antes de usarlo: va directo a un cast ::inet
 * y un valor basura tira error de Postgres en medio del registro.
 */
export function ipDesdeHeaders(headers: Headers): string | null {
  const cruda =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip')?.trim();

  if (!cruda) return null;

  const esIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(cruda);
  const esIPv6 = /^[0-9a-f:]+$/i.test(cruda) && cruda.includes(':');

  return esIPv4 || esIPv6 ? cruda : null;
}

/**
 * Hash de la IP para `aliados_consentimiento.ip_hash` — nunca se guarda en
 * claro ahí. SHA-256 solo, sin sal, no alcanza: IPv4 son ~4.300 millones de
 * valores, un espacio chico para fuerza bruta o una rainbow table. El pepper
 * (variable de entorno, nunca en el código ni en la base) hace que invertir
 * el hash sin conocerlo sea inviable — no hace falta que sea secreto por
 * usuario, alcanza con que no esté en el mismo lugar que el hash resultante.
 *
 * Si falta el pepper se devuelve `null` y no se guarda nada. Antes había un
 * `?? ''` que dejaba pasar el SHA-256 pelado: el fix se desactivaba solo, en
 * silencio, si alguien olvidaba la variable en Vercel, y la base terminaba con
 * IPs reversibles mientras la migración 011 seguía prometiendo lo contrario.
 * Mismo criterio que `/api/cron/purgar`: falta la variable, se falla cerrado.
 * La columna es nullable, así que un consentimiento sin `ip_hash` se registra
 * igual — se pierde un dato de auditoría, no el registro de la persona.
 */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;

  const pepper = process.env.IP_HASH_PEPPER;
  if (!pepper) {
    console.error('[hashIp] falta IP_HASH_PEPPER — no se guarda ip_hash');
    return null;
  }

  return createHash('sha256').update(ip + pepper).digest('hex');
}
