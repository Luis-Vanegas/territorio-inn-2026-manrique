'use server';

import { revalidatePath } from 'next/cache';
import { verificarSesion } from '@/lib/auth/admin';
import { marcarAtendida } from '@/lib/db/peticiones.repo';

export type EstadoAtencion =
  | { estado: 'inicial' }
  | { estado: 'ok' }
  | { estado: 'error'; mensaje: string };

/** Verifica la sesión acá mismo: es un endpoint HTTP invocable sin pasar por
 * el layout de /admin. Mismo criterio que moderarPortafolio. */
export async function atenderPeticion(
  _anterior: EstadoAtencion,
  formData: FormData,
): Promise<EstadoAtencion> {
  const sesion = await verificarSesion();
  if (!sesion) {
    return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.' };
  }

  const id = String(formData.get('id') ?? '');
  if (!id) return { estado: 'error', mensaje: 'Falta el identificador.' };

  try {
    const cambió = await marcarAtendida(id, sesion.email);
    if (!cambió) {
      return { estado: 'error', mensaje: 'Ya estaba marcada como atendida.' };
    }
  } catch (error) {
    console.error('[atenderPeticion] falló', error);
    return { estado: 'error', mensaje: 'No se pudo aplicar el cambio.' };
  }

  revalidatePath('/admin/peticiones');
  return { estado: 'ok' };
}
