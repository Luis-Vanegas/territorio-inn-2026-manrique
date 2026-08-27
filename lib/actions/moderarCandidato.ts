'use server';

import { revalidatePath } from 'next/cache';
import { verificarSesion } from '@/lib/auth/admin';
import { moderarCandidato as moderarEnBase } from '@/lib/db/candidatos.repo';

export type EstadoModeracionCandidato =
  | { estado: 'inicial' }
  | { estado: 'ok'; mensaje: string }
  | { estado: 'error'; mensaje: string };

/**
 * Aprobar o rechazar a alguien que busca trabajo.
 *
 * Igual que `moderarServicio`, la sesión se verifica acá y no solo en el
 * layout: una server action es un endpoint HTTP invocable sin pasar por
 * ninguna página.
 */
export async function moderarCandidatoAction(
  _anterior: EstadoModeracionCandidato,
  formData: FormData,
): Promise<EstadoModeracionCandidato> {
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
    console.error('[moderarCandidato] falló', error);
    return { estado: 'error', mensaje: 'No se pudo aplicar el cambio.' };
  }

  revalidatePath('/admin/empleo');
  revalidatePath('/empleo');

  return {
    estado: 'ok',
    mensaje: accion === 'aprobar' ? 'Publicado en la vitrina.' : 'Registro rechazado.',
  };
}
