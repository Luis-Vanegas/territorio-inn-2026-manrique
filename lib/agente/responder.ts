import 'server-only';

import type { ContextoAsesor } from '@/lib/db/portafolios.repo';
import { preguntaSchema, type EstadoAsesor } from '@/lib/validation/asesor.schema';
import { consultarAsesor } from './asesor';
import { gastarCupoAgente } from './limite';

/**
 * La parte común de las tres puertas del asesor.
 *
 * Hay tres Server Actions —la del token del negocio, la del vecino con sesión
 * de Google y la del panel de moderación— y lo único que cambia entre ellas es
 * quién pregunta y de dónde sale la ficha. Todo lo demás (validar la pregunta,
 * gastar cupo, hablar con el modelo, armar el estado del formulario) era el
 * mismo bloque copiado tres veces.
 *
 * Está partido en dos funciones y no en una sola que haga todo porque cada
 * puerta busca la ficha de una forma distinta y con su propio mensaje de error,
 * y porque el orden importa: se valida y se gasta cupo ANTES de tocar la base.
 * Con una sola función, la query de la ficha tendría que salir primero y una
 * pregunta de tres letras costaría una consulta.
 *
 * El otro motivo de que esto exista: una puerta nueva que se olvide de
 * `gastarCupoAgente` deja abierto un endpoint que gasta cupo de un modelo. Acá
 * las dos cosas van juntas y no hay forma de pedir una sin la otra.
 */

/**
 * Valida la pregunta del formulario y descuenta el cupo por IP. Devuelve la
 * pregunta lista, o el estado de error que la action tiene que devolver tal
 * cual.
 */
export async function prepararPregunta(
  formData: FormData,
): Promise<{ ok: true; pregunta: string } | { ok: false; estado: EstadoAsesor }> {
  const validacion = preguntaSchema.safeParse((formData.get('pregunta') ?? '').toString());

  if (!validacion.success) {
    // `issues` nunca viene vacío cuando success es false, pero el tsconfig
    // tiene noUncheckedIndexedAccess y el fallback cuesta una línea.
    return {
      ok: false,
      estado: {
        estado: 'error',
        mensaje: validacion.error.issues[0]?.message ?? 'Revisa tu pregunta e intenta de nuevo.',
      },
    };
  }

  const excedido = await gastarCupoAgente();
  if (excedido) return { ok: false, estado: { estado: 'error', mensaje: excedido } };

  return { ok: true, pregunta: validacion.data };
}

/**
 * Le pasa la pregunta al modelo y arma el estado del formulario.
 *
 * Recibe la fila cruda del repositorio y no una ficha ya traducida: la
 * conversión de nombres de columna a los del asesor también estaba copiada en
 * las dos puertas que tienen negocio. `null` es la consulta general, sin ficha.
 */
export async function responder(
  negocio: ContextoAsesor | null,
  pregunta: string,
): Promise<EstadoAsesor> {
  const respuesta = await consultarAsesor(
    negocio && {
      nombre: negocio.nombre,
      categoria: negocio.categoria_nombre,
      barrio: negocio.barrio,
      formalidad: negocio.formalidad,
      mayorDolor: negocio.mayor_dolor,
    },
    pregunta,
  );

  if (respuesta.estado === 'error') return { estado: 'error', mensaje: respuesta.mensaje };

  return { estado: 'ok', pregunta, respuesta: respuesta.texto };
}
