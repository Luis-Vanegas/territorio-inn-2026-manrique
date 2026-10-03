import crypto from 'node:crypto';

/**
 * El token de una invitación (migración 035): lo que viaja en el enlace
 * `/firmamento/invitacion/<token>` y lo único que la base NO guarda.
 *
 * 32 bytes aleatorios en base64url (43 caracteres, 256 bits): adivinar uno es
 * inviable, y el rate limit de `invitacion` frena igual a quien lo intente. En
 * la base va el sha256 en hex: quien lea una copia de la tabla no puede rearmar
 * el enlace. Sin sal a propósito: con 256 bits de entrada no hay diccionario
 * posible, y la sal impediría buscar por hash (que es lo que hace el consumo).
 *
 * Sin `import 'server-only'`: lógica pura, la prueba scripts/verificar-accesos.mjs.
 */
export const FORMATO_TOKEN_INVITACION = /^[A-Za-z0-9_-]{43}$/;

/** Días que vale una invitación. La base tiene un tope de 30 (chk_invitacion_vence). */
export const DIAS_INVITACION = 7;

export function generarTokenInvitacion(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashTokenInvitacion(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** El token si tiene la forma de uno, o null. Corta la basura antes de tocar la base. */
export function tokenInvitacionValido(valor: unknown): string | null {
  return typeof valor === 'string' && FORMATO_TOKEN_INVITACION.test(valor) ? valor : null;
}
