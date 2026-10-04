'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { opcionesCookie } from '@/lib/auth/cookies';
import { sesionActual } from '@/lib/auth/usuario';
import { COOKIE_NEGOCIO } from '@/lib/firmamento/negocio';
import { guardarRegistro, type ErrorRegistro } from '@/lib/registro/guardar';

/**
 * Estado del formulario de registro. 'ok' solo lo devuelve el asistido (muestra
 * el enlace personal para «Enviar acceso»); el propio termina en redirect().
 */
export type EstadoRegistro =
  | { estado: 'inicial' }
  | ErrorRegistro
  | { estado: 'ok'; nombre: string; enlace: string; whatsapp: string | null; fotoFallo: boolean; menuFallo: boolean };

/**
 * Registro de un negocio desde Firmamento, con la sesión de Google del vecino.
 * Entra 'pendiente': no se publica hasta que un moderador lo apruebe.
 *
 * El dueño sale de `sesionActual()` y de ningún otro lado: un `usuario_id` en el
 * formulario se ignora (el schema no lo lee). Sin sesión, no hay registro: el
 * formulario público dejaba los negocios sin cuenta (1 de 8 vinculados).
 */
export async function registrarPortafolio(
  _anterior: EstadoRegistro,
  formData: FormData,
): Promise<EstadoRegistro> {
  const sesion = await sesionActual();
  if (!sesion) {
    return { estado: 'error', mensaje: 'Tu sesión se cerró. Entra de nuevo con Google para registrar tu negocio.' };
  }

  const r = await guardarRegistro(formData, {
    usuario_id: sesion.id,
    origen_registro: 'propio',
    capturado_por: null,
    consentimiento_asistido: null,
    limitar: true,
    bitacora: { actor_tipo: 'negocio', actor: sesion.id },
  });
  if (r.estado === 'error') return r;

  // El panel abre en el negocio recién registrado, aunque la cuenta tenga otros.
  (await cookies()).set(COOKIE_NEGOCIO, r.id, { ...opcionesCookie(), maxAge: 60 * 60 * 24 * 365 });

  // El panel de moderación tiene que ver el registro nuevo sin esperar cache.
  revalidatePath('/firmamento/equipo', 'layout');
  revalidatePath('/firmamento/negocio', 'layout');

  const query = (r.fotoFallo ? '&foto=error' : '') + (r.menuFallo ? '&menu=error' : '');
  redirect(`/firmamento/negocio?registrado=1${query}`);
}
