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
  adjuntarFoto,
} from '@/lib/db/portafolios.repo';
import { verificarLimite, registrarIntento, ipDesdeHeaders } from '@/lib/db/rateLimit';
import { subirFoto, validarArchivo, blobConfigurado, borrarFoto } from '@/lib/blob/fotos';

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

  const archivo = formData.get('foto');
  const foto = archivo instanceof File && archivo.size > 0 ? archivo : null;

  if (foto) {
    const problema = validarArchivo(foto);
    if (problema === 'tipo-no-permitido') {
      return { estado: 'error', errores: { foto: ['Solo se aceptan JPG, PNG o WebP'] } };
    }
    if (problema === 'muy-grande') {
      return { estado: 'error', errores: { foto: ['La foto no puede pesar más de 5 MB'] } };
    }
  }

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
  // perder. Si falla, los datos que sí importaban ya quedaron guardados —
  // pero a diferencia del registro, acá sí hay a dónde volver a mostrar el
  // aviso: esta misma respuesta.
  let fotoFallo = false;

  if (foto) {
    if (!blobConfigurado()) {
      fotoFallo = true;
    } else {
      try {
        const subida = await subirFoto(foto, id);
        if (subida) {
          await adjuntarFoto(id, subida.url, subida.pathname);
        } else {
          fotoFallo = true;
        }
      } catch (error) {
        fotoFallo = true;
        console.error('[actualizarPortafolio] subida de foto falló', error);
      }
    }
  }

  revalidatePath('/aliados');
  revalidatePath('/admin/aliados');
  revalidatePath(`/aliados/estado/${token}`);

  const base = 'Guardado. Como cambiaste datos publicados, un moderador los revisa de nuevo antes de que se vean.';

  return {
    estado: 'ok',
    mensaje: fotoFallo ? `${base} La foto no se pudo subir — prueba de nuevo.` : base,
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

  let resultado: { id: string; foto_blob_pathname: string | null } | null;
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

  revalidatePath('/aliados');
  revalidatePath('/admin/aliados');
  revalidatePath(`/aliados/estado/${token}`);

  return { estado: 'ok', mensaje: 'Tu negocio se borró del directorio.' };
}
