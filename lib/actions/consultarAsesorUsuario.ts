'use server';

import { consultarAsesor as preguntarAlModelo } from '@/lib/agente/asesor';
import { gastarCupoAgente } from '@/lib/agente/limite';
import { sesionActual } from '@/lib/auth/usuario';
import { obtenerContextoAsesor } from '@/lib/db/portafolios.repo';
import { negociosDe } from '@/lib/db/usuarios.repo';
import { preguntaSchema } from '@/lib/validation/asesor.schema';
import type { EstadoAsesor } from '@/lib/actions/consultarAsesor';

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

  const validacion = preguntaSchema.safeParse((formData.get('pregunta') ?? '').toString());
  if (!validacion.success) {
    return {
      estado: 'error',
      mensaje: validacion.error.issues[0]?.message ?? 'Revisa tu pregunta e intenta de nuevo.',
    };
  }
  const pregunta = validacion.data;

  const excedido = await gastarCupoAgente();
  if (excedido) return { estado: 'error', mensaje: excedido };

  const [negocio] = await negociosDe(sesion.id);
  const contexto = negocio ? await obtenerContextoAsesor(negocio.token_publico) : null;

  const respuesta = await preguntarAlModelo(
    contexto && {
      nombre: contexto.nombre,
      categoria: contexto.categoria_nombre,
      barrio: contexto.barrio,
      formalidad: contexto.formalidad,
      mayorDolor: contexto.mayor_dolor,
    },
    pregunta,
  );
  if (respuesta.estado === 'error') return { estado: 'error', mensaje: respuesta.mensaje };

  return { estado: 'ok', pregunta, respuesta: respuesta.texto };
}
