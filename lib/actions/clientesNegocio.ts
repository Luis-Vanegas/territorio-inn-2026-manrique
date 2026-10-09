'use server';

import { revalidatePath } from 'next/cache';

import { sesionActual } from '@/lib/auth/usuario';
import { actualizarCliente, borrarCliente, crearCliente, MAXIMO_CLIENTES } from '@/lib/db/clientes.repo';
import {
  clienteSchema,
  desdeFormData,
  type EstadoBorrarCliente,
  type EstadoCliente,
} from '@/lib/validation/cliente.schema';

/**
 * Guardar y borrar clientes de "Mis clientes".
 *
 * La sesión se revalida acá aunque la página ya la pida: una Server Action es
 * un endpoint HTTP que se puede invocar sin pasar por la página. Quién es
 * dueño de qué lo decide el repo (lib/db/clientes.repo.ts), nunca un id que
 * venga del formulario.
 *
 * Sin rate limit propio: detrás hay una sesión de Google, y el tope de
 * MAXIMO_CLIENTES por negocio ya le pone techo a cuánto se puede escribir.
 */

export async function guardarCliente(_anterior: EstadoCliente, formData: FormData): Promise<EstadoCliente> {
  const valores = desdeFormData(formData);

  const sesion = await sesionActual();
  if (!sesion) return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.', valores };

  const parsed = clienteSchema.safeParse(valores);
  if (!parsed.success) {
    const errores = parsed.error.flatten().fieldErrors;
    // `id` y `portafolio_id` van ocultos: su error no tiene dónde pintarse.
    const oculto = errores.id || errores.portafolio_id;
    return {
      estado: 'error',
      errores,
      mensaje: oculto ? 'Recarga la página e intenta de nuevo.' : undefined,
      valores,
    };
  }

  const { id, portafolio_id, ...datos } = parsed.data;

  try {
    if (id) {
      if (!(await actualizarCliente(sesion.id, id, datos))) {
        return { estado: 'error', mensaje: 'No encontramos ese cliente. Recarga la página.', valores };
      }
    } else {
      const resultado = await crearCliente(sesion.id, portafolio_id, datos);
      if (resultado === 'tope') {
        return {
          estado: 'error',
          mensaje: `Ya tienes ${MAXIMO_CLIENTES} clientes en este negocio, que es el máximo. Borra los que ya no necesites para agregar otro.`,
          valores,
        };
      }
      if (resultado === 'no_disponible') {
        return {
          estado: 'error',
          mensaje: 'Este negocio ya no está disponible en tu cuenta. Recarga la página.',
          valores,
        };
      }
    }
  } catch (error) {
    console.error('[guardarCliente] falló', error);
    return { estado: 'error', mensaje: 'No pudimos guardar. Intenta de nuevo en un momento.', valores };
  }

  revalidatePath('/firmamento/negocio/clientes');
  return { estado: 'ok', mensaje: id ? 'Cambios guardados.' : `${datos.nombre} quedó en tu lista.` };
}

export async function borrarClienteAction(
  _anterior: EstadoBorrarCliente,
  formData: FormData,
): Promise<EstadoBorrarCliente> {
  const sesion = await sesionActual();
  if (!sesion) return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.' };

  const id = (formData.get('id') ?? '').toString();
  // El repo ya ignora un id ajeno; esto evita mandarle basura a Postgres,
  // que falla con error (no con cero filas) ante un uuid mal formado.
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { estado: 'error', mensaje: 'No pudimos borrarlo. Recarga la página e intenta de nuevo.' };
  }

  try {
    if (!(await borrarCliente(sesion.id, id))) {
      return { estado: 'error', mensaje: 'Ese cliente ya no estaba en tu lista. Recarga la página.' };
    }
  } catch (error) {
    console.error('[borrarClienteAction] falló', error);
    return { estado: 'error', mensaje: 'No pudimos borrarlo. Intenta de nuevo en un momento.' };
  }

  revalidatePath('/firmamento/negocio/clientes');
  return { estado: 'ok' };
}
