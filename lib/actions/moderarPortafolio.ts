'use server';

import { revalidatePath } from 'next/cache';
import { verificarSesion } from '@/lib/auth/admin';
import { moderar, obtenerParaModerar } from '@/lib/db/portafolios.repo';
import { borrarFoto } from '@/lib/blob/fotos';

export type EstadoModeracion =
  | { estado: 'inicial' }
  | { estado: 'ok'; mensaje: string }
  | { estado: 'error'; mensaje: string };

/**
 * Aprobar, rechazar o archivar un registro.
 *
 * Cada server action verifica la sesión por su cuenta. El layout de /admin ya
 * protege la navegación, pero una server action es un endpoint HTTP: se puede
 * invocar directamente sin pasar por ninguna página. Confiar en el layout para
 * autorizar una escritura es dejar la puerta de atrás abierta.
 */
export async function moderarPortafolio(
  _anterior: EstadoModeracion,
  formData: FormData,
): Promise<EstadoModeracion> {
  const sesion = verificarSesion();
  if (!sesion) {
    return { estado: 'error', mensaje: 'Tu sesión venció. Volvé a entrar.' };
  }

  const id = String(formData.get('id') ?? '');
  const accion = String(formData.get('accion') ?? '');
  const motivo = String(formData.get('motivo_rechazo') ?? '').trim();

  if (!id) return { estado: 'error', mensaje: 'Falta el identificador del registro.' };

  if (accion !== 'aprobar' && accion !== 'rechazar' && accion !== 'archivar') {
    return { estado: 'error', mensaje: 'Acción no reconocida.' };
  }

  // Rechazar sin motivo deja al emprendedor sin saber qué corregir.
  // La base también lo exige; acá se atrapa antes para dar un mensaje útil.
  if (accion === 'rechazar' && motivo.length < 10) {
    return {
      estado: 'error',
      mensaje: 'Escribí un motivo de al menos 10 caracteres: el emprendedor lo va a leer.',
    };
  }

  const nuevoEstado = (
    { aprobar: 'aprobado', rechazar: 'rechazado', archivar: 'archivado' } as const
  )[accion];

  try {
    const cambió = await moderar(
      id,
      nuevoEstado,
      sesion.email,
      accion === 'rechazar' ? motivo : undefined,
    );

    if (!cambió) {
      return {
        estado: 'error',
        mensaje: 'Ese registro ya estaba en ese estado. Refrescá la lista.',
      };
    }

    // Al archivar se libera el Blob: si no, las fotos de registros retirados
    // siguen ocupando cuota y siguen siendo públicas por URL directa.
    if (nuevoEstado === 'archivado') {
      const registro = await obtenerParaModerar(id);
      if (registro?.foto_blob_pathname) {
        try {
          await borrarFoto(registro.foto_blob_pathname);
        } catch (error) {
          // La moderación ya se aplicó; un blob huérfano no justifica revertirla.
          console.error('[moderarPortafolio] no se pudo borrar la foto', error);
        }
      }
    }
  } catch (error) {
    console.error('[moderarPortafolio] falló', error);
    return { estado: 'error', mensaje: 'No se pudo aplicar el cambio. Intentá de nuevo.' };
  }

  revalidatePath('/admin/aliados');
  revalidatePath('/aliados');

  const mensajes = {
    aprobado: 'Publicado en la vitrina.',
    rechazado: 'Registro rechazado.',
    archivado: 'Registro archivado.',
  } as const;

  return { estado: 'ok', mensaje: mensajes[nuevoEstado] };
}
