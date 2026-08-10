'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  portafolioSchema,
  desdeFormData,
  VERSION_TERMINOS,
} from '@/lib/validation/portafolio.schema';
import { crearPortafolio, adjuntarFoto } from '@/lib/db/portafolios.repo';
import { verificarLimite, registrarIntento, ipDesdeHeaders } from '@/lib/db/rateLimit';
import { subirFoto, validarArchivo, blobConfigurado } from '@/lib/blob/fotos';
import { listarCamposActivos } from '@/lib/db/camposPersonalizados.repo';
import { extraerCamposPersonalizados } from '@/lib/validation/camposPersonalizados.schema';

export type EstadoRegistro =
  | { estado: 'inicial' }
  | { estado: 'ok'; id: string; avisoFoto?: string }
  | { estado: 'error'; mensaje?: string; errores?: Record<string, string[]> };

/**
 * Registro público de un emprendimiento. Entra como 'pendiente': no se publica
 * hasta que un moderador lo apruebe.
 *
 * Orden de las verificaciones, de la más barata a la más cara:
 *   1. rate limit — una query, corta el abuso antes de gastar nada más
 *   2. Zod        — en memoria
 *   3. archivo    — lee bytes
 *   4. insert     — escribe
 *   5. Blob + sharp — lo más caro, y solo si todo lo anterior pasó
 */
export async function registrarPortafolio(
  _anterior: EstadoRegistro,
  formData: FormData,
): Promise<EstadoRegistro> {
  const ip = ipDesdeHeaders(headers());

  // 1 · Rate limit
  const limite = await verificarLimite(ip);
  if (!limite.permitido) {
    return {
      estado: 'error',
      mensaje: `Ya enviaste varios registros. Probá de nuevo en ${limite.minutosRestantes} minuto${limite.minutosRestantes === 1 ? '' : 's'}.`,
    };
  }

  // Se cuenta el intento antes de validar: si solo contáramos los exitosos,
  // se podría martillar el endpoint con payloads inválidos sin tocar el cupo.
  await registrarIntento(ip);

  // 2 · Forma
  const parsed = portafolioSchema.safeParse(desdeFormData(formData));
  if (!parsed.success) {
    return { estado: 'error', errores: parsed.error.flatten().fieldErrors };
  }
  const datos = parsed.data;

  // 3 · Archivo (opcional)
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

  // 3.5 · Campos que definió el admin — se re-consulta cuáles están activos
  // ACÁ, en el server, en vez de confiar en una lista que mandó el cliente.
  // Si se confiara en el cliente, alguien podría mandar cualquier valor bajo
  // cualquier slug, incluida la clave de un campo ya desactivado.
  const camposActivos = await listarCamposActivos();
  const { valores: camposExtra, errores: erroresCamposExtra } =
    extraerCamposPersonalizados(formData, camposActivos);

  if (Object.keys(erroresCamposExtra).length > 0) {
    return { estado: 'error', errores: erroresCamposExtra };
  }

  // 4 · Insert
  let id: string;
  try {
    id = await crearPortafolio({
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      categoria_id: datos.categoria_id,
      direccion: datos.direccion,
      barrio: datos.barrio,
      latitud: datos.latitud,
      longitud: datos.longitud,
      whatsapp: datos.whatsapp,
      telefono: datos.telefono,
      correo: datos.correo,
      instagram: datos.instagram,
      facebook: datos.facebook,
      version_terminos: VERSION_TERMINOS,
      ip_registro: ip,
      campos_extra: camposExtra,
    });
  } catch (error) {
    console.error('[registrarPortafolio] insert falló', error);
    return {
      estado: 'error',
      mensaje: 'No pudimos guardar el registro. Intentá de nuevo en un momento.',
    };
  }

  // 5 · Foto
  // Si algo falla acá, el registro YA está guardado y no se pierde. Perder el
  // registro completo por una foto que no subió sería el peor resultado
  // posible: la persona llenó todo el formulario.
  let avisoFoto: string | undefined;

  if (foto) {
    if (!blobConfigurado()) {
      avisoFoto = 'El registro quedó guardado, pero la foto no se pudo subir.';
      console.warn('[registrarPortafolio] BLOB_READ_WRITE_TOKEN sin configurar');
    } else {
      try {
        const subida = await subirFoto(foto, id);
        if (subida) {
          await adjuntarFoto(id, subida.url, subida.pathname);
        } else {
          avisoFoto = 'El registro quedó guardado, pero la imagen no se pudo procesar.';
        }
      } catch (error) {
        console.error('[registrarPortafolio] subida de foto falló', error);
        avisoFoto = 'El registro quedó guardado, pero la foto no se pudo subir.';
      }
    }
  }

  // El panel de moderación tiene que ver el registro nuevo sin esperar cache.
  revalidatePath('/admin/aliados');

  return { estado: 'ok', id, ...(avisoFoto ? { avisoFoto } : {}) };
}
