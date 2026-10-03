'use server';

import { revalidatePath } from 'next/cache';

import { verificarSesion } from '@/lib/auth/admin';
import { desactivarModerador } from '@/lib/db/accesos.repo';
import { desactivarModeradorSchema } from '@/lib/validation/accesos.schema';

/**
 * Quitarle el panel a un moderador (`activo = false`). Vale en la siguiente
 * petición de esa persona, aunque su cookie de 8 h siga viva: `verificarSesion`
 * lee `activo`. Para devolverle el acceso, se le manda una invitación nueva.
 * Nunca a uno mismo ni al último activo (lo cuida el repo, en serializable).
 */

export type EstadoModerador = { estado: 'inicial' } | { estado: 'ok' } | { estado: 'error'; mensaje: string };

const MENSAJE = {
  es_usted: 'No puedes quitarte el acceso a ti mismo.',
  ultimo: 'Es el último moderador activo: el panel quedaría sin nadie.',
  no_activo: 'Esa persona ya no tenía acceso. Refresca la página.',
} as const;

export async function desactivarModeradorAction(
  _anterior: EstadoModerador,
  formData: FormData,
): Promise<EstadoModerador> {
  const sesion = await verificarSesion();
  if (!sesion) return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.' };

  const parsed = desactivarModeradorSchema.safeParse({ email: formData.get('email') ?? '' });
  if (!parsed.success) return { estado: 'error', mensaje: 'Correo inválido.' };

  try {
    const resultado = await desactivarModerador(parsed.data.email, sesion.email);
    if (resultado !== 'desactivado') return { estado: 'error', mensaje: MENSAJE[resultado] };
  } catch (error) {
    // 40001: otro moderador cambió accesos al mismo tiempo (transacción serializable).
    console.error('[desactivarModeradorAction]', error instanceof Error ? error.message : error);
    return { estado: 'error', mensaje: 'No se pudo aplicar. Refresca la página e intenta de nuevo.' };
  }

  revalidatePath('/firmamento/equipo/moderadores');
  return { estado: 'ok' };
}
