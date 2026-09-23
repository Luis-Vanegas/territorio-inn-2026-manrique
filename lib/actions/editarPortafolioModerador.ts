'use server';

import { revalidatePath } from 'next/cache';
import { verificarSesion } from '@/lib/auth/admin';
import {
  actualizarPortafolioSchema,
  desdeFormDataEdicion,
} from '@/lib/validation/portafolio.schema';
import { editarComoModerador } from '@/lib/db/portafolios.repo';
import { extraerArchivoValidado } from '@/lib/blob/fotos';
import { reemplazarArchivos } from '@/lib/blob/reemplazar';
import type { EstadoEdicion } from '@/lib/actions/gestionarEstado';

/**
 * Edición desde el panel de moderación (FormularioEdicionPortafolio,
 * reutilizado del autoservicio del dueño). Mismo schema y mismos archivos que
 * `actualizarPortafolio`, pero corre `editarComoModerador` en vez de
 * `actualizarPorToken`: no vuelve el registro a 'pendiente'.
 *
 * Verifica sesión acá mismo, no confía en el layout de /admin — mismo
 * criterio que moderarPortafolio: una server action es un endpoint HTTP
 * invocable sin pasar por ninguna página.
 */
export async function editarPortafolioModerador(
  id: string,
  _anterior: EstadoEdicion,
  formData: FormData,
): Promise<EstadoEdicion> {
  const sesion = await verificarSesion();
  if (!sesion) {
    return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.' };
  }

  const parsed = actualizarPortafolioSchema.safeParse(desdeFormDataEdicion(formData));
  if (!parsed.success) {
    return { estado: 'error', errores: parsed.error.flatten().fieldErrors };
  }
  const datos = parsed.data;

  const validacionFoto = extraerArchivoValidado(formData, 'foto', 'La foto');
  if (!validacionFoto.ok) {
    return { estado: 'error', errores: { foto: [validacionFoto.mensaje] } };
  }
  const foto = validacionFoto.archivo;

  const validacionMenu = extraerArchivoValidado(formData, 'menu', 'El menú');
  if (!validacionMenu.ok) {
    return { estado: 'error', errores: { menu: [validacionMenu.mensaje] } };
  }
  const menu = validacionMenu.archivo;

  try {
    const cambio = await editarComoModerador(id, {
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      categoria_id: datos.categoria_id,
      categoria_otra: datos.categoria_otra,
      direccion: datos.direccion,
      barrio: datos.barrio,
      latitud: datos.latitud,
      longitud: datos.longitud,
      punto_referencia: datos.punto_referencia,
      whatsapp: datos.whatsapp,
      correo: datos.correo,
      instagram: datos.instagram,
      facebook: datos.facebook,
      horario: datos.horario,
      medios_pago: datos.medios_pago,
      productos: datos.productos,
    });

    if (!cambio) {
      return {
        estado: 'error',
        // El repo exige estado = 'aprobado': el mismo mensaje cubre "no
        // existe" y "ya no está aprobado" (lo archivaron o rechazaron en
        // otra pestaña mientras esta seguía abierta) — no hace falta una
        // segunda consulta solo para distinguir cuál de las dos fue.
        mensaje: 'No encontramos ese registro publicado — puede que ya no esté aprobado.',
      };
    }
  } catch (error) {
    console.error('[editarPortafolioModerador] falló', error);
    return { estado: 'error', mensaje: 'No se pudo guardar el cambio. Intenta de nuevo.' };
  }

  const avisos = await reemplazarArchivos(id, { foto, menu }, 'editarPortafolioModerador');

  revalidatePath('/admin/aliados');
  revalidatePath('/aliados');

  return {
    estado: 'ok',
    mensaje: avisos.length > 0 ? `Guardado. ${avisos.join(' ')}` : 'Guardado.',
  };
}
