'use server';

import { consultarAsesor as preguntarAlModelo } from '@/lib/agente/asesor';
import { gastarCupoAgente } from '@/lib/agente/limite';
import { verificarSesion } from '@/lib/auth/admin';
import { preguntaSchema } from '@/lib/validation/asesor.schema';
import type { EstadoAsesor } from '@/lib/actions/consultarAsesor';

/**
 * Consulta al asesor desde el panel de moderación.
 *
 * Es una consulta general: a diferencia de la del negocio, no recibe la ficha
 * de ningún negocio (ver `consultarAsesor` en lib/agente/asesor.ts, que acepta
 * `null`). Sirve para que el equipo pruebe qué responde el asesor y para
 * orientar a un negocio sin abrir su ficha.
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

  const validacion = preguntaSchema.safeParse((formData.get('pregunta') ?? '').toString());
  if (!validacion.success) {
    return {
      estado: 'error',
      mensaje: validacion.error.issues[0]?.message ?? 'Revisa la pregunta e intenta de nuevo.',
    };
  }
  const pregunta = validacion.data;

  const excedido = await gastarCupoAgente();
  if (excedido) return { estado: 'error', mensaje: excedido };

  const respuesta = await preguntarAlModelo(null, pregunta);
  if (respuesta.estado === 'error') return { estado: 'error', mensaje: respuesta.mensaje };

  return { estado: 'ok', pregunta, respuesta: respuesta.texto };
}
