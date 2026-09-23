'use server';

import { prepararPregunta, responder } from '@/lib/agente/responder';
import type { EstadoAsesor } from '@/lib/validation/asesor.schema';
import { sesionActual } from '@/lib/auth/usuario';
import { obtenerContextoAsesor } from '@/lib/db/portafolios.repo';
import { negociosDe } from '@/lib/db/usuarios.repo';

/**
 * Consulta al asesor desde el botón flotante, para un vecino con sesión de Google.
 *
 * Tercera puerta, junto a la del token del negocio (`consultarAsesor`) y la del
 * panel (`consultarAsesorAdmin`). La sesión se revalida acá y no se confía en
 * que el layout solo pinte el botón con sesión: una Server Action es un
 * endpoint HTTP que se puede invocar sin pasar por ninguna página.
 *
 * Si la persona tiene un negocio registrado, la pregunta va con los datos del
 * más reciente — el mismo contexto que ve desde su ficha. Sin negocio, la
 * consulta es general.
 */
export async function consultarAsesorUsuario(
  _anterior: EstadoAsesor,
  formData: FormData,
): Promise<EstadoAsesor> {
  const sesion = await sesionActual();
  if (!sesion) {
    return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar para usar el asesor.' };
  }

  const preparada = await prepararPregunta(formData);
  if (!preparada.ok) return preparada.estado;

  const [negocio] = await negociosDe(sesion.id);
  const contexto = negocio ? await obtenerContextoAsesor(negocio.token_publico) : null;

  return responder(contexto, preparada.pregunta);
}
