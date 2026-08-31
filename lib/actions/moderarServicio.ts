'use server';

import { revalidatePath } from 'next/cache';
import { verificarSesion } from '@/lib/auth/admin';
import { moderarServicio as moderarEnBase } from '@/lib/db/servicios.repo';
import { soltarFoto } from '@/lib/db/serviciosPrivado.repo';
import { borrarFoto } from '@/lib/blob/fotos';

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

    // Al rechazar se libera la foto. Es el mismo criterio que
    // `moderarPortafolio` aplica al archivar, con una razón más fuerte: acá la
    // foto es un dato RESERVADO de una persona (migración 023), no la fachada
    // de un local. Y a diferencia de un portafolio rechazado, que puede
    // corregirse desde /aliados/estado/[token], un servicio rechazado hoy es
    // terminal: `servicios.token_publico` existe en el esquema pero no tiene
    // ninguna ruta que lo reciba. Guardar la foto de alguien que no quedó en
    // la plataforma y no tiene cómo volver no le sirve a nadie.
    if (accion === 'rechazar') {
      const pathname = await soltarFoto(id);
      if (pathname) {
        try {
          await borrarFoto(pathname);
        } catch (error) {
          // La moderación ya se aplicó y la fila ya no apunta a la imagen; un
          // blob huérfano no justifica revertirla.
          console.error('[moderarServicio] no se pudo borrar la foto', error);
        }
      }
    }
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
