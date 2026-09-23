'use server';

import { revalidatePath } from 'next/cache';
import { verificarSesion } from '@/lib/auth/admin';
import { candidatoModeradorSchema, desdeFormData } from '@/lib/validation/candidato.schema';
import { editarCandidatoComoModerador } from '@/lib/db/candidatos.repo';

export type EstadoEdicionCandidato =
  | { estado: 'inicial' }
  | { estado: 'ok'; mensaje: string }
  | { estado: 'error'; mensaje: string; errores?: Record<string, string[]> };

/**
 * Corrección de datos por un moderador (typo en el teléfono, nivel mal
 * marcado, etc). No cambia `estado`: eso es responsabilidad exclusiva de
 * moderarCandidatoAction, para no mezclar "corregir un dato" con "decidir si
 * se publica".
 */
export async function editarCandidatoModeradorAction(
  _anterior: EstadoEdicionCandidato,
  formData: FormData,
): Promise<EstadoEdicionCandidato> {
  const sesion = await verificarSesion();
  if (!sesion) return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { estado: 'error', mensaje: 'Falta el identificador.' };

  const crudo = desdeFormData(formData);
  const parsed = candidatoModeradorSchema.safeParse(crudo);
  if (!parsed.success) {
    return {
      estado: 'error',
      mensaje: 'Revisa los campos marcados.',
      errores: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const cambio = await editarCandidatoComoModerador(id, parsed.data);
    if (!cambio) {
      return {
        estado: 'error',
        // El repo exige estado = 'aprobado': mismo mensaje para "no existe"
        // y "ya no está aprobado" (lo rechazaron o retiraron en otra
        // pestaña) — no hace falta una segunda consulta para distinguirlas.
        mensaje: 'No encontramos ese registro publicado — puede que ya no esté aprobado.',
      };
    }
  } catch (error) {
    console.error('[editarCandidatoModerador] falló', error);
    return { estado: 'error', mensaje: 'No se pudo guardar el cambio.' };
  }

  revalidatePath('/admin/empleo');
  revalidatePath('/empleo');

  return { estado: 'ok', mensaje: 'Cambios guardados.' };
}
