'use server';

import { revalidatePath } from 'next/cache';
import { verificarSesion } from '@/lib/auth/admin';
import { decidirConvocatoria } from '@/lib/db/convocatorias.repo';
import { registrarEnBitacora } from '@/lib/db/bitacora.repo';
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

const ACCION_BITACORA = {
  aprobar: 'convocatoria_aprobada',
  descartar: 'convocatoria_descartada',
  vencida: 'convocatoria_vencida',
} as const;

/**
 * Verifica la sesión acá mismo: una Server Action es un endpoint HTTP invocable
 * sin pasar por el layout de /admin. Las convocatorias no van en la vitrina (no
 * hay `invalidarVitrina()`): «Para ti» las lee en cada carga. Al aprobar llegan
 * también las categorías y formalidades marcadas (`categorias`, `formalidades`,
 * casillas repetidas del formulario; ninguna = para todos).
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
    categorias: formData.getAll('categorias'),
    formalidades: formData.getAll('formalidades'),
  });
  if (!parsed.success) return { estado: 'error', mensaje: 'No pudimos leer la decisión.' };

  try {
    const aplicada = await decidirConvocatoria(parsed.data.id, parsed.data.decision, sesion.email, {
      categorias: parsed.data.categorias,
      formalidades: parsed.data.formalidades,
    });
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

  await registrarEnBitacora({
    actor_tipo: 'equipo',
    actor: sesion.email,
    accion: ACCION_BITACORA[parsed.data.decision],
    convocatoria_id: parsed.data.id,
    campos:
      parsed.data.decision === 'aprobar'
        ? ['estado', 'categorias', 'aplica_formalidad']
        : ['estado'],
  });

  revalidatePath('/admin/convocatorias');
  revalidatePath('/mi-cuenta');
  return { estado: 'ok', mensaje: MENSAJE_OK[parsed.data.decision] };
}
