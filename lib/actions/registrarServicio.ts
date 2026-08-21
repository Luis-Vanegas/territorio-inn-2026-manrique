'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  servicioSchema,
  desdeFormData,
  nombrePublico,
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

/**
 * Lo que la persona tipeó, para repoblar el formulario si hay que rechazar el
 * envío. React 19 resetea los inputs no controlados al terminar CUALQUIER
 * acción —éxito o error— así que sin esto la persona tendría que reescribir
 * las cuatro pantallas por, por ejemplo, olvidarse de elegir la foto. No
 * incluye la foto en sí: un input de archivo no se puede repoblar por API del
 * navegador, así que esa siempre hay que volver a elegirla.
 */
export type ValoresEnviados = ReturnType<typeof desdeFormData>;

export type EstadoRegistroServicio =
  | { estado: 'inicial' }
  | {
      estado: 'error';
      mensaje?: string;
      errores?: Record<string, string[]>;
      valores?: ValoresEnviados;
    };

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
 *   4. archivo     — obligatoria, lee bytes
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
  const crudo = desdeFormData(formData);
  const parsed = servicioSchema.safeParse(crudo);
  if (!parsed.success) {
    return { estado: 'error', errores: parsed.error.flatten().fieldErrors, valores: crudo };
  }
  const datos = parsed.data;

  // 4 · Archivo (obligatorio). Es el mecanismo para identificar a la persona
  // si hace falta, así que a diferencia de los negocios acá no es decorativo:
  // sin foto no hay registro.
  const archivo = formData.get('foto');
  const foto = archivo instanceof File && archivo.size > 0 ? archivo : null;

  if (!foto) {
    return {
      estado: 'error',
      errores: { foto: ['La foto es obligatoria: es lo que nos permite identificarte si hace falta'] },
      valores: crudo,
    };
  }

  const problema = validarArchivo(foto);
  if (problema === 'tipo-no-permitido') {
    return { estado: 'error', errores: { foto: ['Solo se aceptan JPG, PNG o WebP'] }, valores: crudo };
  }
  if (problema === 'muy-grande') {
    return { estado: 'error', errores: { foto: ['La foto no puede pesar más de 5 MB'] }, valores: crudo };
  }

  // 5 · Insert público. `nombre` es el derivado —primer nombre + primer
  // apellido—, no lo que la persona escribió completo: eso vive reservado,
  // se guarda en el paso 5.5.
  let id: string;
  let token_publico: string;
  try {
    ({ id, token_publico } = await crearServicio({
      nombre: nombrePublico(datos.nombres, datos.apellidos),
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
      valores: crudo,
    };
  }

  // 5.5 · Caracterización (reservada). Si falla, el registro público ya está
  // guardado: no se pierde el trabajo de la persona por un insert secundario.
  try {
    await guardarCaracterizacion({
      servicio_id: id,
      nombres: datos.nombres,
      apellidos: datos.apellidos,
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
  //
  // Si la subida falla acá (Blob caído, archivo corrupto pese a pasar la
  // validación de tipo), el registro público YA está guardado y no se
  // descarta: perder todo el trabajo de la persona por un fallo de
  // infraestructura sería peor que dejar pasar un registro sin foto. La
  // moderación manual —obligatoria para cualquier servicio— es la red de
  // seguridad real: un moderador que no ve foto puede rechazar y pedir que
  // se vuelva a intentar.
  let fotoFallo = false;

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

  revalidatePath('/admin/servicios');

  redirect(`/servicios?registrado=${token_publico}${fotoFallo ? '&foto=error' : ''}`);
}
