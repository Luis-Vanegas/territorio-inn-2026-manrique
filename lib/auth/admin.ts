import 'server-only';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { sql } from '@/lib/db/neon';

// Corre solo en Node (Server Components / Server Actions), nunca en Edge.
// Por eso la protección de /admin vive en app/admin/layout.tsx y NO en middleware.ts:
// en Next 14 el middleware es Edge-only, donde node:crypto y cookies() no existen.

const DURACION_SESION = 8 * 60 * 60 * 1000; // 8 horas

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

export function verificarSesion(): { email: string } | null {
  const token = cookies().get('admin_session')?.value;
  if (!token) return null;

  const [payloadB64, firma] = token.split('.');
  if (!payloadB64 || !firma) return null;

  // Se firma el base64url, no el JSON crudo: así la verificación no depende
  // de que el decode reproduzca byte a byte lo que se firmó.
  const esperada = crypto.createHmac('sha256', obtenerSecreto()).update(payloadB64).digest('hex');
  if (firma.length !== esperada.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) return null;

  try {
    const data = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    return { email: data.email };
  } catch {
    return null;
  }
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
