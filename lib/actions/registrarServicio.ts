'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  servicioSchema,
  desdeFormData,
  VERSION_TERMINOS_SERVICIO,
} from '@/lib/validation/servicio.schema';
import { crearServicio } from '@/lib/db/servicios.repo';
import { guardarCaracterizacion, adjuntarFoto } from '@/lib/db/serviciosPrivado.repo';
import { verificarLimite, registrarIntento, ipDesdeHeaders } from '@/lib/db/rateLimit';
import { subirFoto, validarArchivo, blobConfigurado } from '@/lib/blob/fotos';

// Mismas dos señales anti-bot baratas que el registro de negocios, y por la
// misma razón: cortar antes de gastar Zod, una query o el procesamiento de
// una imagen. El mensaje es genérico a propósito.
const CAMPO_TRAMPA = 'sitio_web';
const TIEMPO_MINIMO_MS = 8000;

export type EstadoRegistroServicio =
  | { estado: 'inicial' }
  | { estado: 'error'; mensaje?: string; errores?: Record<string, string[]> };

/**
 * Registro público de una persona que presta servicios.
 *
 * Entra como 'pendiente' siempre. Acá la moderación pesa más que en Aliados:
 * se está por publicar a alguien que va a entrar a casas ajenas, así que
 * ningún registro se ve sin que un humano lo haya mirado.
 *
 * Orden de verificaciones, de lo más barato a lo más caro — igual que
 * registrarPortafolio:
 *   1. rate limit  — una query
 *   2. anti-bot    — en memoria
 *   3. Zod         — en memoria
 *   4. archivo     — lee bytes
 *   5. insert      — escribe
 *   6. Blob+sharp  — lo más caro, y solo si todo lo anterior pasó
 */
export async function registrarServicio(
  _anterior: EstadoRegistroServicio,
  formData: FormData,
): Promise<EstadoRegistroServicio> {
  const ip = ipDesdeHeaders(await headers());

  // 1 · Rate limit
  const limite = await verificarLimite(ip);
  if (!limite.permitido) {
    return {
      estado: 'error',
      mensaje: `Ya enviaste varios registros. Probá de nuevo en ${limite.minutosRestantes} minuto${limite.minutosRestantes === 1 ? '' : 's'}.`,
    };
  }
  await registrarIntento(ip);

  // 2 · Anti-bot
  if (formData.get(CAMPO_TRAMPA)) {
    return { estado: 'error', mensaje: 'No pudimos procesar el registro. Intentá de nuevo.' };
  }
  const iniciadoEn = Number(formData.get('iniciado_en'));
  if (!iniciadoEn || Date.now() - iniciadoEn < TIEMPO_MINIMO_MS) {
    return { estado: 'error', mensaje: 'No pudimos procesar el registro. Intentá de nuevo.' };
  }

  // 3 · Forma
  const parsed = servicioSchema.safeParse(desdeFormData(formData));
  if (!parsed.success) {
    return { estado: 'error', errores: parsed.error.flatten().fieldErrors };
  }
  const datos = parsed.data;

  // 4 · Archivo (opcional)
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

  // 5 · Insert público
  let id: string;
  let token_publico: string;
  try {
    ({ id, token_publico } = await crearServicio({
      nombre: datos.nombre,
      categoria_id: datos.categoria_id,
      categoria_otra: datos.categoria_otra,
      descripcion: datos.descripcion,
      anos_experiencia: datos.anos_experiencia,
      cobertura: datos.cobertura,
      telefono: datos.telefono,
      version_terminos: VERSION_TERMINOS_SERVICIO,
    }));
  } catch (error) {
    console.error('[registrarServicio] insert falló', error);
    return {
      estado: 'error',
      mensaje: 'No pudimos guardar el registro. Intentá de nuevo en un momento.',
    };
  }

  // 5.5 · Caracterización (reservada). Si falla, el registro público ya está
  // guardado: no se pierde el trabajo de la persona por un insert secundario.
  try {
    await guardarCaracterizacion({
      servicio_id: id,
      correo: datos.correo,
      ingreso_principal: datos.ingreso_principal,
      horas_semana: datos.horas_semana,
      como_consigue_clientes: datos.como_consigue_clientes,
      mayor_dificultad: datos.mayor_dificultad,
      herramientas_propias: datos.herramientas_propias,
      formacion: datos.formacion,
      tiene_arl: datos.tiene_arl,
      necesita: datos.necesita,
      sale_de_comuna: datos.sale_de_comuna,
      ip_registro: ip,
    });
  } catch (error) {
    console.error('[registrarServicio] guardado de caracterización falló', error);
  }

  // 6 · Foto. Se sube igual que en los negocios (sharp sin withMetadata()
  // descarta el EXIF completo, incluidas las coordenadas GPS que agregan las
  // cámaras de celular), pero el destino es la fila RESERVADA, no la pública:
  // esta foto nunca aparece en la ficha, es un dato interno para poder
  // identificar a la persona si hace falta. Por eso se adjunta después de
  // `guardarCaracterizacion` — necesita que esa fila ya exista.
  let fotoFallo = false;

  if (foto) {
    if (!blobConfigurado()) {
      fotoFallo = true;
      console.warn('[registrarServicio] store de Blob sin conectar');
    } else {
      try {
        const subida = await subirFoto(foto, id, 'servicios');
        if (subida) {
          await adjuntarFoto(id, subida.url, subida.pathname);
        } else {
          fotoFallo = true;
        }
      } catch (error) {
        fotoFallo = true;
        console.error('[registrarServicio] subida de foto falló', error);
      }
    }
  }

  revalidatePath('/admin/servicios');

  redirect(`/servicios?registrado=${token_publico}${fotoFallo ? '&foto=error' : ''}`);
}
