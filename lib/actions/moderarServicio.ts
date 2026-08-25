'use server';

import { revalidatePath } from 'next/cache';
import { verificarSesion } from '@/lib/auth/admin';
import { moderarServicio as moderarEnBase } from '@/lib/db/servicios.repo';

export type EstadoModeracionServicio =
  | { estado: 'inicial' }
  | { estado: 'ok'; mensaje: string }
  | { estado: 'error'; mensaje: string };

/**
 * Aprobar o rechazar una persona que ofrece servicios.
 *
 * Igual que `moderarPortafolio`, la sesión se verifica acá y no solo en el
 * layout: una server action es un endpoint HTTP invocable sin pasar por
 * ninguna página.
 */
export async function moderarServicioAction(
  _anterior: EstadoModeracionServicio,
  formData: FormData,
): Promise<EstadoModeracionServicio> {
  const sesion = await verificarSesion();
  if (!sesion) return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.' };

  const id = String(formData.get('id') ?? '');
  const accion = String(formData.get('accion') ?? '');
  const motivo = String(formData.get('motivo_rechazo') ?? '').trim();

  if (!id) return { estado: 'error', mensaje: 'Falta el identificador.' };
  if (accion !== 'aprobar' && accion !== 'rechazar') {
    return { estado: 'error', mensaje: 'Acción no reconocida.' };
  }
  if (accion === 'rechazar' && motivo.length < 10) {
    return {
      estado: 'error',
      mensaje: 'Escribe un motivo de al menos 10 caracteres: la persona lo va a leer.',
    };
  }

  try {
    await moderarEnBase(
      id,
      accion === 'aprobar' ? 'aprobado' : 'rechazado',
      sesion.email,
      accion === 'rechazar' ? motivo : undefined,
    );
  } catch (error) {
    console.error('[moderarServicio] falló', error);
    return { estado: 'error', mensaje: 'No se pudo aplicar el cambio.' };
  }

  revalidatePath('/admin/servicios');
  revalidatePath('/servicios');

  return {
    estado: 'ok',
    mensaje: accion === 'aprobar' ? 'Publicado en la vitrina.' : 'Registro rechazado.',
  };
}
