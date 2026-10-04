import 'server-only';

import { headers } from 'next/headers';
import {
  portafolioSchema,
  desdeFormData,
  VERSION_TERMINOS,
} from '@/lib/validation/portafolio.schema';
import {
  crearPortafolio,
  adjuntarFoto,
  adjuntarMenu,
  buscarPosibleDuplicado,
  registrarConsentimiento,
  guardarInvestigacion,
  listarCategorias,
  type NuevoPortafolio,
} from '@/lib/db/portafolios.repo';
import { guardarSugerenciaCategoria } from '@/lib/db/sugerencias.repo';
import { registrarEnBitacora, type EntradaBitacora } from '@/lib/db/bitacora.repo';
import {
  sugerenciaDesdeFormData,
  respuestaASugerencia,
} from '@/lib/validation/sugerenciaCategoria.schema';
import { verificarLimite, registrarIntento, ipDesdeHeaders, hashIp } from '@/lib/db/rateLimit';
import { subirFoto, subirMenu, blobConfigurado, extraerArchivoValidado } from '@/lib/blob/fotos';
import { listarCamposActivos } from '@/lib/db/camposPersonalizados.repo';
import { extraerCamposPersonalizados } from '@/lib/validation/camposPersonalizados.schema';

/**
 * El registro de un negocio, compartido por las dos puertas (AGENTS.md › «Dos
 * puertas, una ficha»): `registrarPortafolio` (vecino con sesión de Google) y
 * `registrarAsistido` (el equipo en campo). NO es una Server Action: lleva
 * `server-only` y quien la llama ya resolvió la sesión. Así el dueño
 * (`usuario_id`) y quién capturó (`capturado_por`) salen siempre de la cookie de
 * la action, nunca del formulario.
 *
 * Orden de las verificaciones, de la más barata a la más cara:
 *   1. rate limit — una query, corta el abuso antes de gastar nada más
 *   2. Zod        — en memoria
 *   3. archivo    — lee bytes
 *   4. insert     — escribe
 *   5. Blob + sharp — lo más caro, y solo si todo lo anterior pasó
 */

// Honeypot + tiempo mínimo de llenado: dos señales anti-bot baratas antes de
// gastar Zod o una query. El mensaje de error es genérico a propósito — no
// hay que delatarle a un bot que existe una trampa, o la esquiva la próxima vez.
const CAMPO_TRAMPA = 'sitio_web';
const TIEMPO_MINIMO_MS = 8000;

export type ErrorRegistro = { estado: 'error'; mensaje?: string; errores?: Record<string, string[]> };

export type RegistroGuardado = {
  estado: 'guardado';
  id: string;
  token_publico: string;
  nombre: string;
  whatsapp: string | null;
  fotoFallo: boolean;
  menuFallo: boolean;
};

export type Origen = Pick<
  NuevoPortafolio,
  'usuario_id' | 'origen_registro' | 'capturado_por' | 'consentimiento_asistido'
> & {
  /** El cupo por IP es para la puerta del vecino; el equipo en campo registra varios seguidos desde un celular. */
  limitar: boolean;
  bitacora: Pick<EntradaBitacora, 'actor_tipo' | 'actor'>;
};

export async function guardarRegistro(
  formData: FormData,
  origen: Origen,
): Promise<ErrorRegistro | RegistroGuardado> {
  const cabeceras = await headers();
  const ip = ipDesdeHeaders(cabeceras);

  // 1 · Rate limit
  if (origen.limitar) {
    const limite = await verificarLimite(ip);
    if (!limite.permitido) {
      return {
        estado: 'error',
        mensaje: `Ya enviaste varios registros. Prueba de nuevo en ${limite.minutosRestantes} minuto${limite.minutosRestantes === 1 ? '' : 's'}.`,
      };
    }

    // Se cuenta el intento antes de validar: si solo contáramos los exitosos,
    // se podría martillar el endpoint con payloads inválidos sin tocar el cupo.
    await registrarIntento(ip);
  }

  // 1.5 · Honeypot + tiempo mínimo de llenado.
  if (formData.get(CAMPO_TRAMPA)) {
    return { estado: 'error', mensaje: 'No pudimos procesar el registro. Intenta de nuevo.' };
  }

  const iniciadoEn = Number(formData.get('iniciado_en'));
  if (!iniciadoEn || Date.now() - iniciadoEn < TIEMPO_MINIMO_MS) {
    return { estado: 'error', mensaje: 'No pudimos procesar el registro. Intenta de nuevo.' };
  }

  // 2 · Forma
  const parsed = portafolioSchema.safeParse(desdeFormData(formData));
  if (!parsed.success) {
    return { estado: 'error', errores: parsed.error.flatten().fieldErrors };
  }
  const datos = parsed.data;

  // 3 · Archivos (opcionales)
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
      productos: datos.productos,
      usuario_id: origen.usuario_id,
      origen_registro: origen.origen_registro,
      capturado_por: origen.capturado_por,
      consentimiento_asistido: origen.consentimiento_asistido,
    }));
  } catch (error) {
    console.error('[registro] insert falló', error);
    return {
      estado: 'error',
      mensaje: 'No pudimos guardar el registro. Intenta de nuevo en un momento.',
    };
  }

  // Posible duplicado por WhatsApp — solo se loguea, no bloquea ni persiste.
  try {
    const duplicado = await buscarPosibleDuplicado(datos.whatsapp);
    if (duplicado && duplicado.id !== id) {
      console.warn('[registro] posible duplicado de', duplicado.id, duplicado.nombre, '- nuevo registro:', id);
    }
  } catch (error) {
    console.error('[registro] chequeo de duplicado falló', error);
  }

  // Consentimiento inmutable (Ley 1581). Si falla, el registro ya está
  // guardado — no tiene sentido perderlo por un insert secundario. En el
  // asistido la IP es la del equipo: lo que prueba la autorización del titular
  // es `consentimiento_asistido`, que la base exige (027).
  try {
    await registrarConsentimiento({
      portafolio_id: id,
      acepto_terminos: true,
      acepto_habeas_data: true,
      version_politica: VERSION_TERMINOS,
      ip_hash: hashIp(ip),
      user_agent: cabeceras.get('user-agent'),
    });
  } catch (error) {
    console.error('[registro] registro de consentimiento falló', error);
  }

  // Investigación (privado, opcional): formalidad y mayor_dolor (029).
  try {
    await guardarInvestigacion({
      portafolio_id: id,
      formalidad: datos.formalidad,
      mayor_dolor: datos.mayor_dolor,
    });
  } catch (error) {
    console.error('[registro] guardado de investigación falló', error);
  }

  // Sugeridor de categoría: SOLO la categoría inferida, su confianza y si la
  // persona quedó con ella. Jamás el texto escrito. Desde la 033 lleva
  // `portafolio_id` para reentrenar con la categoría FINAL de la ficha. Es
  // telemetría: si falla, el registro ya está guardado.
  try {
    const sugerencia = sugerenciaDesdeFormData(formData);
    if (sugerencia) {
      // El id sale del navegador: solo vale si es una categoría que existe hoy.
      const vigentes = await listarCategorias();
      if (vigentes.some((c) => c.id === sugerencia.categoria_inferida)) {
        await guardarSugerenciaCategoria({
          portafolio_id: id,
          categoria_inferida: sugerencia.categoria_inferida,
          confianza: sugerencia.confianza,
          aceptada: respuestaASugerencia(
            sugerencia.categoria_inferida,
            formData.get('categoria_id'),
          ),
        });
      }
    }
  } catch (error) {
    console.error('[registro] guardado de la sugerencia falló', error);
  }

  await registrarEnBitacora({ ...origen.bitacora, accion: 'registrado', portafolio_id: id });

  // 5 · Foto y menú
  // Si algo falla acá, el registro YA está guardado y no se pierde: perderlo
  // por un archivo que no subió sería el peor resultado posible. Se avisa.
  let fotoFallo = false;
  let menuFallo = false;

  if ((foto || menu) && !blobConfigurado()) {
    fotoFallo = Boolean(foto);
    menuFallo = Boolean(menu);
    console.warn('[registro] store de Blob sin conectar: falta BLOB_READ_WRITE_TOKEN o BLOB_STORE_ID');
  } else {
    if (foto) {
      try {
        const subida = await subirFoto(foto, id);
        if (subida) {
          await adjuntarFoto(id, subida.url, subida.pathname);
        } else {
          fotoFallo = true;
        }
      } catch (error) {
        fotoFallo = true;
        console.error('[registro] subida de foto falló', error);
      }
    }

    if (menu) {
      try {
        const subida = await subirMenu(menu, id);
        if (subida) {
          await adjuntarMenu(id, subida.url, subida.pathname);
        } else {
          menuFallo = true;
        }
      } catch (error) {
        menuFallo = true;
        console.error('[registro] subida de menú falló', error);
      }
    }
  }

  return { estado: 'guardado', id, token_publico, nombre: datos.nombre, whatsapp: datos.whatsapp, fotoFallo, menuFallo };
}
