'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { obtenerContextoAsesor } from '@/lib/db/portafolios.repo';
import { consultarAsesor as preguntarAlModelo } from '@/lib/agente/asesor';
import { verificarLimite, registrarIntento, ipDesdeHeaders } from '@/lib/db/rateLimit';

/**
 * Consulta al asesor de formalización desde el panel del negocio.
 *
 * Es Server Action y no route handler porque no hay streaming: la respuesta
 * llega entera y el formulario la muestra. Un route handler solo agregaría un
 * endpoint público que hay que proteger por separado — la action ya corre con
 * el token que la página validó.
 *
 * ── Orden de las verificaciones, de la más barata a la más cara ──
 *   1. formato del token — una regex, corta cualquier basura al instante
 *   2. Zod             — en memoria
 *   3. rate limit      — una query
 *   4. contexto        — una query
 *   5. el modelo       — lo único que cuesta plata, y solo si todo lo anterior pasó
 */

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const preguntaSchema = z
  .string()
  .trim()
  .min(5, 'Escribe tu pregunta con un poco más de detalle')
  .max(500, 'Máximo 500 caracteres');

export type EstadoAsesor =
  | { estado: 'inicial' }
  | { estado: 'ok'; pregunta: string; respuesta: string }
  | { estado: 'error'; mensaje: string };

export async function consultarAsesor(
  _anterior: EstadoAsesor,
  formData: FormData,
): Promise<EstadoAsesor> {
  const token = (formData.get('token') ?? '').toString();

  // El token no se valida contra la base todavía: si el formato está mal, no
  // hay nada que consultar y no vale gastar una query.
  if (!FORMATO_UUID.test(token)) {
    return { estado: 'error', mensaje: 'Tu sesión no es válida. Vuelve a abrir tu enlace.' };
  }

  const validacion = preguntaSchema.safeParse((formData.get('pregunta') ?? '').toString());
  if (!validacion.success) {
    // `issues` nunca viene vacío cuando success es false, pero el tsconfig
    // tiene noUncheckedIndexedAccess y el fallback cuesta una línea.
    return {
      estado: 'error',
      mensaje: validacion.error.issues[0]?.message ?? 'Revisa tu pregunta e intenta de nuevo.',
    };
  }
  const pregunta = validacion.data;

  const ip = ipDesdeHeaders(await headers());
  const limite = await verificarLimite(ip, 'agente');
  if (!limite.permitido) {
    return {
      estado: 'error',
      mensaje: `Has hecho varias preguntas seguidas. Espera ${limite.minutosRestantes} minuto${
        limite.minutosRestantes === 1 ? '' : 's'
      } y vuelve a intentar.`,
    };
  }

  // Se cuenta antes de llamar al modelo: si solo contáramos las consultas que
  // terminan bien, se podría martillar el endpoint con entradas que fallan
  // después del límite y gastar igual.
  await registrarIntento(ip, 'agente');

  const negocio = await obtenerContextoAsesor(token);
  if (!negocio) {
    return { estado: 'error', mensaje: 'No encontramos tu negocio. Vuelve a abrir tu enlace.' };
  }

  const respuesta = await preguntarAlModelo(
    {
      nombre: negocio.nombre,
      categoria: negocio.categoria_nombre,
      barrio: negocio.barrio,
      formalidad: negocio.formalidad,
      mayorDolor: negocio.mayor_dolor,
    },
    pregunta,
  );

  if (respuesta.estado === 'error') {
    return { estado: 'error', mensaje: respuesta.mensaje };
  }

  return { estado: 'ok', pregunta, respuesta: respuesta.texto };
}
