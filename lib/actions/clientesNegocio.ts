'use server';

import { revalidatePath } from 'next/cache';

import { sesionActual } from '@/lib/auth/usuario';
import { actualizarCliente, borrarCliente, crearCliente, MAXIMO_CLIENTES } from '@/lib/db/clientes.repo';
import { clienteSchema, desdeFormData, type EstadoCliente } from '@/lib/validation/cliente.schema';

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
  const sesion = await sesionActual();
  if (!sesion) return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.' };

  const parsed = clienteSchema.safeParse(desdeFormData(formData));
  if (!parsed.success) return { estado: 'error', errores: parsed.error.flatten().fieldErrors };

  const { id, portafolio_id, ...datos } = parsed.data;

  try {
    if (id) {
      if (!(await actualizarCliente(sesion.id, id, datos))) {
        return { estado: 'error', mensaje: 'No encontramos ese cliente. Recarga la página.' };
      }
    } else if (!(await crearCliente(sesion.id, portafolio_id, datos))) {
      return {
        estado: 'error',
        mensaje: `No pudimos guardarlo. Revisa que el negocio sea tuyo y que no tengas ya ${MAXIMO_CLIENTES} clientes.`,
      };
    }
  } catch (error) {
    console.error('[guardarCliente] falló', error);
    return { estado: 'error', mensaje: 'No pudimos guardar. Intenta de nuevo en un momento.' };
  }

  revalidatePath('/mi-cuenta/clientes');
  return { estado: 'ok', mensaje: id ? 'Cambios guardados.' : `${datos.nombre} quedó en tu lista.` };
}

export async function borrarClienteAction(formData: FormData): Promise<void> {
  const sesion = await sesionActual();
  if (!sesion) return;

  const id = (formData.get('id') ?? '').toString();
  // El repo ya ignora un id ajeno; esto evita mandarle basura a Postgres,
  // que falla con error (no con cero filas) ante un uuid mal formado.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;

  await borrarCliente(sesion.id, id);
  revalidatePath('/mi-cuenta/clientes');
}
