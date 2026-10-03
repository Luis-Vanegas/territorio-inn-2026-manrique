'use server';

import { revalidatePath } from 'next/cache';
import { verificarSesion } from '@/lib/auth/admin';
import { invalidarVitrina } from '@/lib/db/cache';
import { registrarEnBitacora } from '@/lib/db/bitacora.repo';
import { decidirCategoriaFicha, listarCategorias, type DecisionEquipo } from '@/lib/db/portafolios.repo';
import { decisionCategoriaSchema } from '@/lib/validation/sugerenciaCategoria.schema';

export type EstadoDecisionCategoria =
  | { estado: 'inicial' }
  | { estado: 'ok'; mensaje: string }
  | { estado: 'error'; mensaje: string };

/**
 * El sugeridor en la moderación: «Usar «X»», «Mantener» o corregir a mano la
 * categoría de un registro pendiente o de una ficha en «Otros». Cada decisión
 * queda como ejemplo para reentrenar (`sugerencias_categoria`, origen
 * `moderacion`): el ejemplo es el nombre de la ficha + su categoría final, y la
 * tabla guarda solo ids y confianza, nunca el texto.
 *
 * Recibe un objeto y no FormData: el modelo corre en el navegador y la tarjeta
 * ya tiene todo tipado. Igual pasa por Zod: una Server Action es un endpoint
 * HTTP y lo que llega se puede inventar. Por lo mismo revalida `admin_session`
 * acá y no confía en el layout del panel.
 */
export async function decidirCategoria(
  _anterior: EstadoDecisionCategoria,
  entrada: unknown,
): Promise<EstadoDecisionCategoria> {
  const sesion = await verificarSesion();
  if (!sesion) return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.' };

  const parsed = decisionCategoriaSchema.safeParse(entrada);
  if (!parsed.success) return { estado: 'error', mensaje: 'No pudimos leer la decisión.' };
  const d = parsed.data;

  const final = d.decision === 'mantener' ? d.categoria_actual : (d.categoria_elegida ?? d.categoria_actual);

  // Los ids salen del navegador: solo valen categorías que existen hoy.
  const vigentes = await listarCategorias();
  const nombreDe = (id: string) => vigentes.find((c) => c.id === id)?.nombre;
  const nombreFinal = nombreDe(final);
  if (!nombreFinal || !nombreDe(d.categoria_inferida)) {
    return { estado: 'error', mensaje: 'Esa categoría ya no existe. Recarga la página.' };
  }

  // Elegir a mano justo la que proponía el modelo es usarla.
  const decision: DecisionEquipo =
    final === d.categoria_actual
      ? 'mantenida'
      : d.decision === 'usar' || final === d.categoria_inferida
        ? 'usada'
        : 'corregida';

  let resultado: Awaited<ReturnType<typeof decidirCategoriaFicha>>;
  try {
    resultado = await decidirCategoriaFicha({
      id: d.portafolio_id,
      actual: d.categoria_actual,
      final,
      inferida: d.categoria_inferida,
      confianza: d.confianza,
      decision,
    });
  } catch (error) {
    console.error('[decidirCategoria] falló', error);
    return { estado: 'error', mensaje: 'No se pudo guardar la decisión. Intenta de nuevo.' };
  }

  if (!resultado || (decision !== 'mantenida' && !resultado.cambio)) {
    return {
      estado: 'error',
      mensaje: 'La ficha cambió mientras tanto (otra categoría o ya no está por revisar). Recarga la página.',
    };
  }

  // Un «Mantener» repetido no guarda nada nuevo: tampoco se anota.
  if (resultado.cambio || resultado.guardada) {
    await registrarEnBitacora({
      actor_tipo: 'equipo',
      actor: sesion.email,
      accion: resultado.cambio ? 'categoria_corregida' : 'categoria_mantenida',
      portafolio_id: d.portafolio_id,
      campos: resultado.cambio ? ['categoria_id', ...(resultado.borroOtra ? ['categoria_otra'] : [])] : [],
    });
  }

  revalidatePath('/firmamento/equipo', 'layout');
  if (resultado.cambio) {
    revalidatePath('/aliados');
    invalidarVitrina();
  }

  return {
    estado: 'ok',
    mensaje: resultado.cambio
      ? `Categoría cambiada a «${nombreFinal}». Queda como ejemplo para reentrenar el sugeridor.`
      : resultado.guardada
        ? `Se mantiene «${nombreFinal}». Queda como ejemplo para reentrenar el sugeridor.`
        : `Se mantiene «${nombreFinal}» (ya estaba anotado).`,
  };
}
