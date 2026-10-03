'use server';

import { revalidatePath } from 'next/cache';

import { verificarSesion } from '@/lib/auth/admin';
import { desvincularPorEquipo, vincularPorEquipo } from '@/lib/db/accesos.repo';
import { registrarEnBitacora } from '@/lib/db/bitacora.repo';
import { desvincularCuentaSchema, vincularCuentaSchema } from '@/lib/validation/accesos.schema';

/**
 * El equipo ata un negocio a una cuenta que ya existe (o lo suelta), desde la
 * ficha en `/firmamento/equipo/aliados`. Es una decisión de acceso: quien quede
 * de dueño edita la ficha y ve sus clientes. Por eso: sesión de moderación
 * revalidada acá, Zod, el candado en el `where` del repo y bitácora.
 *
 * No toca la vitrina (el dueño no es público): no llama `invalidarVitrina()`.
 */

export type EstadoVinculo =
  | { estado: 'inicial' }
  | { estado: 'ok'; mensaje: string }
  | { estado: 'error'; mensaje: string };

const RUTA = '/firmamento/equipo/aliados';
const SESION_VENCIDA: EstadoVinculo = { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.' };

export async function vincularCuentaAction(_anterior: EstadoVinculo, formData: FormData): Promise<EstadoVinculo> {
  const sesion = await verificarSesion();
  if (!sesion) return SESION_VENCIDA;

  const parsed = vincularCuentaSchema.safeParse({
    portafolio_id: formData.get('portafolio_id') ?? '',
    correo: formData.get('correo') ?? '',
    reasignar: formData.get('reasignar'),
  });
  if (!parsed.success) return { estado: 'error', mensaje: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  const { portafolio_id, correo, reasignar } = parsed.data;

  let resultado;
  try {
    resultado = await vincularPorEquipo(portafolio_id, correo, reasignar);
  } catch (error) {
    console.error('[vincularCuentaAction]', error instanceof Error ? error.message : error);
    return { estado: 'error', mensaje: 'No se pudo vincular. Intenta de nuevo.' };
  }

  switch (resultado.estado) {
    case 'sin_negocio':
      return { estado: 'error', mensaje: 'Ese negocio ya no está disponible. Refresca la página.' };
    case 'sin_cuenta':
      return {
        estado: 'error',
        mensaje: 'No hay una cuenta con ese correo. La persona tiene que entrar una vez con Google; o envíale su enlace de acceso.',
      };
    case 'ya_era_suyo':
      return { estado: 'error', mensaje: 'El negocio ya está en esa cuenta.' };
    case 'tiene_dueno':
      return { estado: 'error', mensaje: 'El negocio ya tiene otra cuenta. Para cambiarla, marca la confirmación.' };
  }

  const base = { actor_tipo: 'equipo' as const, actor: sesion.email, portafolio_id, campos: ['usuario_id'] };
  // Reasignar es soltar y atar: dos hechos, dos filas. Se guardan nombres de
  // campos, nunca quién era el dueño (bitácora sin datos personales).
  if (resultado.estado === 'reasignado') await registrarEnBitacora({ ...base, accion: 'negocio_desvinculado' });
  await registrarEnBitacora({ ...base, accion: 'negocio_vinculado' });

  revalidatePath(RUTA);
  return { estado: 'ok', mensaje: `Listo: el negocio quedó en la cuenta de ${resultado.cuenta}.` };
}

export async function desvincularCuentaAction(_anterior: EstadoVinculo, formData: FormData): Promise<EstadoVinculo> {
  const sesion = await verificarSesion();
  if (!sesion) return SESION_VENCIDA;

  const parsed = desvincularCuentaSchema.safeParse({ portafolio_id: formData.get('portafolio_id') ?? '' });
  if (!parsed.success) return { estado: 'error', mensaje: 'Identificador inválido.' };

  try {
    if (!(await desvincularPorEquipo(parsed.data.portafolio_id))) {
      return { estado: 'error', mensaje: 'Ese negocio ya no tenía cuenta. Refresca la página.' };
    }
  } catch (error) {
    console.error('[desvincularCuentaAction]', error instanceof Error ? error.message : error);
    return { estado: 'error', mensaje: 'No se pudo desvincular. Intenta de nuevo.' };
  }

  await registrarEnBitacora({
    actor_tipo: 'equipo',
    actor: sesion.email,
    accion: 'negocio_desvinculado',
    portafolio_id: parsed.data.portafolio_id,
    campos: ['usuario_id'],
  });

  revalidatePath(RUTA);
  return { estado: 'ok', mensaje: 'El negocio ya no está en ninguna cuenta. Su enlace personal sigue sirviendo.' };
}
