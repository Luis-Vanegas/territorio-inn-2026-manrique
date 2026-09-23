'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  actualizarPortafolioSchema,
  desdeFormDataEdicion,
} from '@/lib/validation/portafolio.schema';
import {
  actualizarPorToken,
  archivarPorToken,
} from '@/lib/db/portafolios.repo';
import { verificarLimite, registrarIntento, ipDesdeHeaders } from '@/lib/db/rateLimit';
import { borrarFoto, extraerArchivoValidado } from '@/lib/blob/fotos';
import { reemplazarArchivos } from '@/lib/blob/reemplazar';

export type EstadoEdicion =
  | { estado: 'inicial' }
  | { estado: 'ok'; mensaje: string }
  | { estado: 'error'; mensaje?: string; errores?: Record<string, string[]> };

/**
 * Autoservicio de /aliados/estado/[token]: el token es la única credencial,
 * no hay sesión ni login. `actualizarPorToken` y `archivarPorToken` solo
 * tocan la fila cuyo token_publico matchea — un token equivocado o vencido
 * no encuentra nada, no tira error de permisos (no hay nada que autorizar
 * distinto a "tenés el link").
 *
 * Se llaman con el token ya aplicado (`actualizarPortafolio.bind(null, token)`
 * desde el client component) para calzar con la firma que espera
 * `useFormState`: `(prevState, formData) => State`.
 */
export async function actualizarPortafolio(
  token: string,
  _anterior: EstadoEdicion,
  formData: FormData,
): Promise<EstadoEdicion> {
  const ip = ipDesdeHeaders(await headers());

  const limite = await verificarLimite(ip, 'estado');
  if (!limite.permitido) {
    return {
      estado: 'error',
      mensaje: `Prueba de nuevo en ${limite.minutosRestantes} minuto${limite.minutosRestantes === 1 ? '' : 's'}.`,
    };
  }
  await registrarIntento(ip, 'estado');

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

  let id: string | null;
  try {
    id = await actualizarPorToken(token, {
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
  } catch (error) {
    console.error('[actualizarPortafolio] update falló', error);
    return { estado: 'error', mensaje: 'No pudimos guardar los cambios. Intenta de nuevo.' };
  }

  if (!id) {
    return {
      estado: 'error',
      mensaje: 'No encontramos ese registro — puede que el link esté mal copiado.',
    };
  }

  // Igual que en el registro: la foto es lo último y lo que menos importa
  // perder. A diferencia del registro, acá sí hay a dónde volver a mostrar el
  // aviso: esta misma respuesta.
  const avisos = await reemplazarArchivos(id, { foto, menu }, 'actualizarPortafolio');

  revalidatePath('/aliados');
  revalidatePath('/admin/aliados');
  revalidatePath(`/aliados/estado/${token}`);

  const base = 'Guardado. Como cambiaste datos publicados, un moderador los revisa de nuevo antes de que se vean.';
  return {
    estado: 'ok',
    mensaje: avisos.length > 0 ? `${base} ${avisos.join(' ')}` : base,
  };
}

/**
 * Borrado propio. Mismo criterio que `moderarPortafolio` al archivar: se
 * libera el Blob de la foto para no seguir pagando por ni exponiendo una
 * imagen de un negocio que ya pidió salir.
 */
export async function borrarPortafolio(token: string): Promise<EstadoEdicion> {
  const ip = ipDesdeHeaders(await headers());

  const limite = await verificarLimite(ip, 'estado');
  if (!limite.permitido) {
    return {
      estado: 'error',
      mensaje: `Prueba de nuevo en ${limite.minutosRestantes} minuto${limite.minutosRestantes === 1 ? '' : 's'}.`,
    };
  }
  await registrarIntento(ip, 'estado');

  let resultado: {
    id: string;
    foto_blob_pathname: string | null;
    menu_blob_pathname: string | null;
  } | null;
  try {
    resultado = await archivarPorToken(token);
  } catch (error) {
    console.error('[borrarPortafolio] falló', error);
    return { estado: 'error', mensaje: 'No pudimos borrar el registro. Intenta de nuevo.' };
  }

  if (!resultado) {
    return {
      estado: 'error',
      mensaje: 'No encontramos ese registro, o ya estaba borrado.',
    };
  }

  if (resultado.foto_blob_pathname) {
    try {
      await borrarFoto(resultado.foto_blob_pathname);
    } catch (error) {
      console.error('[borrarPortafolio] no se pudo borrar la foto', error);
    }
  }

  if (resultado.menu_blob_pathname) {
    try {
      await borrarFoto(resultado.menu_blob_pathname);
    } catch (error) {
      console.error('[borrarPortafolio] no se pudo borrar el menú', error);
    }
  }

  revalidatePath('/aliados');
  revalidatePath('/admin/aliados');
  revalidatePath(`/aliados/estado/${token}`);

  return { estado: 'ok', mensaje: 'Tu negocio se borró del directorio.' };
}
