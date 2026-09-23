'use server';

import { prepararPregunta, responder } from '@/lib/agente/responder';
import type { EstadoAsesor } from '@/lib/validation/asesor.schema';
import { verificarSesion } from '@/lib/auth/admin';

/**
 * Consulta al asesor desde el panel de moderación.
 *
 * Es una consulta general: a diferencia de la del negocio, no recibe la ficha
 * de ningún negocio (por eso `responder` recibe `null`). Sirve para que el
 * equipo pruebe qué responde el asesor y para orientar a un negocio sin abrir
 * su ficha.
 *
 * ── Por qué revalida la sesión acá ──
 *
 * El layout del panel protege la NAVEGACIÓN. Una Server Action es un endpoint
 * HTTP que se puede invocar sin pasar por ninguna página, así que confiar solo
 * en el layout dejaría este endpoint —que gasta cupo de un modelo pago o
 * gratuito— abierto a cualquiera que arme el POST. Ver docs/seguridad.md.
 *
 * No guarda preguntas ni respuestas: una consulta, una respuesta.
 */
export async function consultarAsesorAdmin(
  _anterior: EstadoAsesor,
  formData: FormData,
): Promise<EstadoAsesor> {
  if (!(await verificarSesion())) {
    return { estado: 'error', mensaje: 'Tu sesión de moderación venció. Vuelve a entrar.' };
  }

  const preparada = await prepararPregunta(formData);
  if (!preparada.ok) return preparada.estado;

  return responder(null, preparada.pregunta);
}
