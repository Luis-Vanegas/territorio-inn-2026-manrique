import 'server-only';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { cache } from 'react';
import { sql } from '@/lib/db/neon';
import { opcionesBorrado, opcionesCookie } from '@/lib/auth/cookies';
import { esModeradorGoogle } from '@/lib/auth/moderadoresGoogle';

// Corre solo en Node (Server Components / Server Actions), nunca en Edge.
// Por eso la protección de /admin vive en app/admin/layout.tsx y NO en
// middleware.ts: se decidió así cuando el middleware era Edge-only (Next 14) y
// ahí no existen node:crypto ni cookies(). Desde Next 16 el middleware ya puede
// correr en Node, pero el guard sigue acá a propósito — moverlo no agregaría
// seguridad, porque toda server action revalida la sesión por su cuenta igual.

const DURACION_SESION = 8 * 60 * 60 * 1000; // 8 horas

export const COOKIE_ADMIN = 'admin_session';

/**
 * Diferida a propósito: leerla al importar el módulo hace que `next build`
 * falle con "Failed to collect page data", porque Next importa cada página
 * durante el build para inspeccionarla — no para atender un request. Ver el
 * mismo razonamiento, más detallado, en lib/db/neon.ts.
 */
function obtenerSecreto(): string {
  const secreto = process.env.ADMIN_SESSION_SECRET;
  if (!secreto) throw new Error('Falta ADMIN_SESSION_SECRET');
  return secreto;
}

// ── Passwords ────────────────────────────────────────────────
// scrypt de node:crypto — no hace falta bcrypt como dependencia.
// Formato almacenado: "salt_hex:hash_hex"

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verificarPassword(ingresado: string, almacenado: string): boolean {
  const [saltHex, hashHex] = almacenado.split(':');
  if (!saltHex || !hashHex) return false;

  const esperado = Buffer.from(hashHex, 'hex');
  const calculado = crypto.scryptSync(ingresado, Buffer.from(saltHex, 'hex'), 64);

  // timingSafeEqual tira RangeError si los largos difieren; scrypt siempre
  // devuelve 64 bytes, así que acá el largo está garantizado.
  return esperado.length === calculado.length &&
         crypto.timingSafeEqual(esperado, calculado);
}

// ── Sesión ───────────────────────────────────────────────────

export function crearTokenSesion(email: string): string {
  const payload = JSON.stringify({ email, exp: Date.now() + DURACION_SESION });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const firma = crypto.createHmac('sha256', obtenerSecreto()).update(payloadB64).digest('hex');
  return `${payloadB64}.${firma}`;
}

/**
 * ¿Ese correo es hoy un moderador activo? Una consulta por petición (`cache`
 * deduplica layout, página y encabezado). Es lo que hace que desactivar a alguien
 * desde el panel valga YA, y no cuando venzan las 8 h de su cookie.
 *
 * Si la base no responde se falla CERRADO: sin panel, pero nadie entra sin
 * permiso. El encabezado del sitio público solo deja de mostrar «Panel».
 */
const moderadorActivo = cache(async (email: string): Promise<boolean> => {
  try {
    const rows = await sql`select 1 from admins where email = ${email} and activo`;
    return rows.length > 0;
  } catch (error) {
    console.error('[admin] no se pudo comprobar el moderador', error instanceof Error ? error.message : error);
    return false;
  }
});

export async function verificarSesion(): Promise<{ email: string } | null> {
  const token = (await cookies()).get(COOKIE_ADMIN)?.value;
  if (!token) return null;

  const [payloadB64, firma] = token.split('.');
  if (!payloadB64 || !firma) return null;

  // Se firma el base64url, no el JSON crudo: así la verificación no depende
  // de que el decode reproduzca byte a byte lo que se firmó.
  const esperada = crypto.createHmac('sha256', obtenerSecreto()).update(payloadB64).digest('hex');
  if (firma.length !== esperada.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) return null;

  let email: unknown;
  try {
    const data = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    email = data.email;
  } catch {
    return null;
  }

  // El tipo NO es decorativo. `sesion_usuario` se firma con el mismo secreto y el
  // mismo formato (base64url + HMAC, con `exp`): sin esta línea, el valor de la
  // cookie de un vecino pegado como `admin_session` pasaba la firma y daba el
  // panel con `email: undefined`. Su payload no trae `email`; con esto se cae.
  if (typeof email !== 'string' || !email) return null;
  if (!(await moderadorActivo(email))) return null;
  return { email };
}

/**
 * Abre la sesión de moderación. Una sola función para las dos puertas de
 * entrada (contraseña y Google), para que la cookie salga siempre igual.
 */
export async function iniciarSesionAdmin(email: string): Promise<void> {
  (await cookies()).set(COOKIE_ADMIN, crearTokenSesion(email.toLowerCase()), {
    ...opcionesCookie(),
    maxAge: DURACION_SESION / 1000,
  });
}

/**
 * ¿Esta cuenta de Google entra al panel del equipo? Devuelve el correo con que
 * se abre `admin_session` (la llave de `admins`), o null.
 *
 * Dos vías (migración 035), en este orden:
 *   1. Por base: una fila de `admins` con este `google_sub` (la llenó una
 *      invitación de moderador). Manda su `activo`.
 *   2. Respaldo del despliegue: el `sub` está en ADMIN_GOOGLE_SUBS. Se asegura su
 *      fila (la auditoría la necesita: `moderado_por` y compañía son FK a
 *      `admins(email)`) y se le ata el `sub`. Una fila que el equipo DESACTIVÓ
 *      (`desactivado_en`) no se reactiva por estar en la variable: para eso hay
 *      que invitarla de nuevo. Las filas viejas de esta vía (`activo = false`,
 *      sin `sub`) se activan en su primer ingreso.
 *
 * La fila `sin-acceso` nunca entra por contraseña: el hash no es un hash y
 * `verificarPassword` lo rechaza.
 */
export async function accesoModeradorGoogle(perfil: {
  sub: string;
  correo: string;
  nombre: string;
}): Promise<string | null> {
  const [porSub] = (await sql`
    select email, activo from admins where google_sub = ${perfil.sub}
  `) as { email: string; activo: boolean }[];
  if (porSub) return porSub.activo ? porSub.email : null;

  if (!esModeradorGoogle(perfil.sub)) return null;

  const correo = perfil.correo.toLowerCase().trim();
  const [fila] = (await sql`
    insert into admins (email, nombre, password_hash, activo, google_sub)
    values (${correo}, ${perfil.nombre || correo}, 'sin-acceso', true, ${perfil.sub})
    on conflict (email) do update set
      google_sub = coalesce(admins.google_sub, excluded.google_sub),
      activo = case
        when admins.google_sub is null and admins.desactivado_en is null then true
        else admins.activo
      end
    returning email, activo, google_sub
  `) as { email: string; activo: boolean; google_sub: string | null }[];

  // Si ese correo ya estaba atado a OTRO sub, esta cuenta no hereda su acceso.
  return fila && fila.activo && fila.google_sub === perfil.sub ? fila.email : null;
}

export async function cerrarSesionAdmin(): Promise<void> {
  (await cookies()).set(COOKIE_ADMIN, '', opcionesBorrado());
}

// ── Login ────────────────────────────────────────────────────

export async function autenticar(email: string, password: string): Promise<boolean> {
  const rows = await sql`
    select password_hash from admins
    where email = ${email.toLowerCase().trim()} and activo = true
  `;

  // Sin usuario: igual se corre un scrypt descartable para que el tiempo de
  // respuesta no revele si el email existe.
  if (rows.length === 0) {
    crypto.scryptSync(password, crypto.randomBytes(16), 64);
    return false;
  }

  return verificarPassword(password, (rows[0] as { password_hash: string }).password_hash);
}
