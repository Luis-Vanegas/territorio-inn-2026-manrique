'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  portafolioSchema,
  desdeFormData,
  VERSION_TERMINOS,
} from '@/lib/validation/portafolio.schema';
import {
  crearPortafolio,
  adjuntarFoto,
  buscarPosibleDuplicado,
  registrarConsentimiento,
  guardarInvestigacion,
} from '@/lib/db/portafolios.repo';
import { verificarLimite, registrarIntento, ipDesdeHeaders, hashIp } from '@/lib/db/rateLimit';
import { subirFoto, validarArchivo, blobConfigurado } from '@/lib/blob/fotos';
import { listarCamposActivos } from '@/lib/db/camposPersonalizados.repo';
import { extraerCamposPersonalizados } from '@/lib/validation/camposPersonalizados.schema';

// Honeypot + tiempo mínimo de llenado: dos señales anti-bot baratas antes de
// gastar Zod o una query. El mensaje de error es genérico a propósito — no
// hay que delatarle a un bot que existe una trampa, o la esquiva la próxima vez.
const CAMPO_TRAMPA = 'sitio_web';
const TIEMPO_MINIMO_MS = 8000;

// Sin variante 'ok': un registro exitoso termina en redirect() a la página
// de estado, nunca vuelve a este componente a mostrar un mensaje inline.
export type EstadoRegistro =
  | { estado: 'inicial' }
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

  // 1.5 · Honeypot + tiempo mínimo de llenado. Mensaje genérico a propósito:
  // no hay que delatarle a un bot que existe una trampa.
  if (formData.get(CAMPO_TRAMPA)) {
    return { estado: 'error', mensaje: 'No pudimos procesar el registro. Intentá de nuevo.' };
  }

  const iniciadoEn = Number(formData.get('iniciado_en'));
  if (!iniciadoEn || Date.now() - iniciadoEn < TIEMPO_MINIMO_MS) {
    return { estado: 'error', mensaje: 'No pudimos procesar el registro. Intentá de nuevo.' };
  }

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
  let token_publico: string;
  try {
    ({ id, token_publico } = await crearPortafolio({
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      categoria_id: datos.categoria_id,
      categoria_otra: datos.categoria_otra,
      direccion: datos.direccion,
      barrio: datos.barrio,
      latitud: datos.latitud,
      longitud: datos.longitud,
      whatsapp: datos.whatsapp,
      correo: datos.correo,
      instagram: datos.instagram,
      facebook: datos.facebook,
      version_terminos: VERSION_TERMINOS,
      ip_registro: ip,
      campos_extra: camposExtra,
      punto_referencia: datos.punto_referencia,
      horario: datos.horario ?? [],
      medios_pago: datos.medios_pago ?? [],
    }));
  } catch (error) {
    console.error('[registrarPortafolio] insert falló', error);
    return {
      estado: 'error',
      mensaje: 'No pudimos guardar el registro. Intentá de nuevo en un momento.',
    };
  }

  // Posible duplicado por WhatsApp — solo se loguea, no bloquea ni persiste.
  // Mostrarlo en el panel de moderación es trabajo de otra fase.
  try {
    const duplicado = await buscarPosibleDuplicado(datos.whatsapp);
    if (duplicado) {
      console.warn(
        '[registrarPortafolio] posible duplicado de',
        duplicado.id,
        duplicado.nombre,
        '- nuevo registro:',
        id,
      );
    }
  } catch (error) {
    console.error('[registrarPortafolio] chequeo de duplicado falló', error);
  }

  // Consentimiento inmutable (Ley 1581). Si falla, el registro ya está
  // guardado — no tiene sentido perderlo por un insert secundario.
  try {
    await registrarConsentimiento({
      portafolio_id: id,
      acepto_terminos: true,
      acepto_habeas_data: true,
      version_politica: VERSION_TERMINOS,
      ip_hash: hashIp(ip),
      user_agent: headers().get('user-agent'),
    });
  } catch (error) {
    console.error('[registrarPortafolio] registro de consentimiento falló', error);
  }

  // Investigación (privado). tipo_negocio y mayor_dolor ya vinieron
  // validados como obligatorios; si esto falla, el registro público ya
  // está guardado — no se pierde por esto.
  try {
    await guardarInvestigacion({
      portafolio_id: id,
      nombre_dueno: datos.nombre_dueno,
      tipo_negocio: datos.tipo_negocio,
      tipo_negocio_detalle: datos.tipo_negocio_detalle,
      formalidad: datos.formalidad,
      mayor_dolor: datos.mayor_dolor,
      necesidad_crecer: datos.necesidad_crecer,
    });
  } catch (error) {
    console.error('[registrarPortafolio] guardado de investigación falló', error);
  }

  // 5 · Foto
  // Si algo falla acá, el registro YA está guardado y no se pierde. Perder el
  // registro completo por una foto que no subió sería el peor resultado
  // posible: la persona llenó todo el formulario. Sí hace falta avisar, nomás
  // que no puede ser un mensaje inline (ya no hay página inline) — viaja como
  // query param a la página de estado, que lo muestra una vez.
  let fotoFallo = false;

  if (foto) {
    if (!blobConfigurado()) {
      fotoFallo = true;
      console.warn(
        '[registrarPortafolio] store de Blob sin conectar: falta BLOB_READ_WRITE_TOKEN o BLOB_STORE_ID',
      );
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
        console.error('[registrarPortafolio] subida de foto falló', error);
      }
    }
  }

  // El panel de moderación tiene que ver el registro nuevo sin esperar cache.
  revalidatePath('/admin/aliados');

  // La confirmación ya no es la página de estado: es un modal en el inicio.
  // El token viaja en la query porque sigue siendo la única credencial para
  // llegar a /aliados/estado/[token] — el modal lo muestra y ahí la persona
  // lo guarda (copiar o WhatsApp) antes de que se pierda. redirect() corta
  // la ejecución acá — no hay código después de esto que dependa de un
  // `return`.
  redirect(`/?registrado=${token_publico}${fotoFallo ? '&foto=error' : ''}`);
}
