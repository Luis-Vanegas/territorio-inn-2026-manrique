'use server';

import { revalidatePath } from 'next/cache';
import { verificarSesion } from '@/lib/auth/admin';
import { moderarCandidato as moderarEnBase } from '@/lib/db/candidatos.repo';

export type EstadoModeracionCandidato =
  | { estado: 'inicial' }
  | { estado: 'ok'; mensaje: string }
  | { estado: 'error'; mensaje: string };

/**
 * Aprobar, rechazar o retirar a alguien que busca trabajo.
 *
 * "Retirar" (candidato ya publicado que se quita de la vitrina) usa el
 * estado 'archivado' — mismo estado y mismo criterio que Aliados, sin
 * necesidad de motivo. "Publicar" funciona también desde 'rechazado' o
 * 'archivado' (reconsiderar), no solo desde 'pendiente'.
 *
 * Igual que el resto de las acciones de moderación, la sesión se verifica acá y no solo en el
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
  if (accion !== 'aprobar' && accion !== 'rechazar' && accion !== 'retirar') {
    return { estado: 'error', mensaje: 'Acción no reconocida.' };
  }
  if (accion === 'rechazar' && motivo.length < 10) {
    return {
      estado: 'error',
      mensaje: 'Escribe un motivo de al menos 10 caracteres: la persona lo va a leer.',
    };
  }

  const nuevoEstado =
    accion === 'aprobar' ? 'aprobado' : accion === 'rechazar' ? 'rechazado' : 'archivado';

  try {
    const cambio = await moderarEnBase(
      id,
      nuevoEstado,
      sesion.email,
      accion === 'rechazar' ? motivo : undefined,
    );
    if (!cambio) {
      return {
        estado: 'error',
        mensaje: 'No encontramos ese registro, o ya estaba en ese estado. Refresca la lista.',
      };
    }
  } catch (error) {
    console.error('[moderarCandidato] falló', error);
    return { estado: 'error', mensaje: 'No se pudo aplicar el cambio.' };
  }

  revalidatePath('/admin/empleo');
  revalidatePath('/empleo');

  const mensajes = {
    aprobado: 'Publicado en la vitrina.',
    rechazado: 'Registro rechazado.',
    archivado: 'Retirado de la vitrina.',
  } as const;

  return { estado: 'ok', mensaje: mensajes[nuevoEstado] };
}
