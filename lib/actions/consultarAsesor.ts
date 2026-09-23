'use server';

import { prepararPregunta, responder } from '@/lib/agente/responder';
import type { EstadoAsesor } from '@/lib/validation/asesor.schema';
import { obtenerContextoAsesor } from '@/lib/db/portafolios.repo';

/**
 * Consulta al asesor de formalización desde el panel del negocio, con el token
 * del enlace. Primera de las tres puertas; la parte que comparten las tres vive
 * en lib/agente/responder.ts.
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

  const preparada = await prepararPregunta(formData);
  if (!preparada.ok) return preparada.estado;

  const negocio = await obtenerContextoAsesor(token);
  if (!negocio) {
    return { estado: 'error', mensaje: 'No encontramos tu negocio. Vuelve a abrir tu enlace.' };
  }

  return responder(negocio, preparada.pregunta);
}
