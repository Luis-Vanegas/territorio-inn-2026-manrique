'use server';

import { revalidatePath } from 'next/cache';
import { verificarSesion } from '@/lib/auth/admin';
import { decidirConvocatoria } from '@/lib/db/convocatorias.repo';
import { decisionConvocatoriaSchema } from '@/lib/validation/convocatoria.schema';

export type EstadoModeracionConvocatoria =
  | { estado: 'inicial' }
  | { estado: 'ok'; mensaje: string }
  | { estado: 'error'; mensaje: string };

const MENSAJE_OK = {
  aprobar: 'Aprobada: ya se muestra en «Para ti».',
  descartar: 'Descartada.',
  vencida: 'Marcada como vencida.',
} as const;

/**
 * Verifica la sesión acá mismo: una Server Action es un endpoint HTTP invocable
 * sin pasar por el layout de /admin. Las convocatorias no van en la vitrina (no
 * hay `invalidarVitrina()`): «Para ti» las lee en cada carga.
 */
export async function moderarConvocatoria(
  _anterior: EstadoModeracionConvocatoria,
  formData: FormData,
): Promise<EstadoModeracionConvocatoria> {
  const sesion = await verificarSesion();
  if (!sesion) return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.' };

  const parsed = decisionConvocatoriaSchema.safeParse({
    id: formData.get('id'),
    decision: formData.get('decision'),
  });
  if (!parsed.success) return { estado: 'error', mensaje: 'No pudimos leer la decisión.' };

  try {
    const aplicada = await decidirConvocatoria(parsed.data.id, parsed.data.decision, sesion.email);
    if (!aplicada) {
      return {
        estado: 'error',
        mensaje:
          parsed.data.decision === 'aprobar'
            ? 'No se pudo aprobar: ya fue revisada o su fecha de cierre ya pasó.'
            : 'Esta convocatoria ya no está en un estado desde el que se pueda hacer eso.',
      };
    }
  } catch (error) {
    console.error('[moderarConvocatoria] falló', error);
    return { estado: 'error', mensaje: 'No se pudo aplicar el cambio.' };
  }

  revalidatePath('/admin/convocatorias');
  revalidatePath('/mi-cuenta');
  return { estado: 'ok', mensaje: MENSAJE_OK[parsed.data.decision] };
}
