'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

import { verificarSesion } from '@/lib/auth/admin';
import { crearInvitacion, revocarInvitacion } from '@/lib/db/invitaciones.repo';
import { origenDe } from '@/lib/sitio';
import { invitacionNuevaSchema, revocarInvitacionSchema } from '@/lib/validation/accesos.schema';

/**
 * Invitaciones (migración 035), desde Entidades («Invitar a alguien de esta
 * entidad») y Moderadores («Invitar moderador»). Crear una es entregar un acceso,
 * así que la sesión de moderación se revalida acá y el input pasa por Zod.
 *
 * El enlace vuelve UNA vez en el estado de la action y no se guarda en ninguna
 * parte: la base tiene solo el sha256 del token. No va a la consola: un log con
 * el enlace es un acceso para quien lea los logs.
 */

export type EstadoInvitacion =
  | { estado: 'inicial' }
  | { estado: 'ok'; enlace: string }
  | { estado: 'error'; mensaje: string };

export type EstadoRevocar = { estado: 'inicial' } | { estado: 'ok' } | { estado: 'error'; mensaje: string };

const RUTAS = ['/firmamento/equipo/entidades', '/firmamento/equipo/moderadores'];

export async function crearInvitacionAction(
  _anterior: EstadoInvitacion,
  formData: FormData,
): Promise<EstadoInvitacion> {
  const sesion = await verificarSesion();
  if (!sesion) return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.' };

  const parsed = invitacionNuevaSchema.safeParse({
    tipo: formData.get('tipo'),
    entidad_id: formData.get('entidad_id'),
    nota: formData.get('nota'),
  });
  if (!parsed.success) return { estado: 'error', mensaje: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };

  let creada;
  try {
    creada = await crearInvitacion({
      tipo: parsed.data.tipo,
      entidadId: parsed.data.tipo === 'entidad' ? (parsed.data.entidad_id ?? null) : null,
      nota: parsed.data.nota,
      creadaPor: sesion.email,
    });
  } catch (error) {
    console.error('[crearInvitacionAction]', error instanceof Error ? error.message : error);
    return { estado: 'error', mensaje: 'No se pudo crear la invitación. Intenta de nuevo.' };
  }
  if (!creada) return { estado: 'error', mensaje: 'Esa entidad no existe o está inactiva. Refresca la página.' };

  RUTAS.forEach((r) => revalidatePath(r));
  return { estado: 'ok', enlace: `${origenDe(await headers())}/firmamento/invitacion/${creada.token}` };
}

export async function revocarInvitacionAction(_anterior: EstadoRevocar, formData: FormData): Promise<EstadoRevocar> {
  if (!(await verificarSesion())) return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.' };

  const parsed = revocarInvitacionSchema.safeParse({ id: formData.get('id') ?? '' });
  if (!parsed.success) return { estado: 'error', mensaje: 'Identificador inválido.' };

  try {
    if (!(await revocarInvitacion(parsed.data.id))) {
      return { estado: 'error', mensaje: 'Esa invitación ya no estaba pendiente. Refresca la página.' };
    }
  } catch (error) {
    console.error('[revocarInvitacionAction]', error instanceof Error ? error.message : error);
    return { estado: 'error', mensaje: 'No se pudo revocar. Intenta de nuevo.' };
  }

  RUTAS.forEach((r) => revalidatePath(r));
  return { estado: 'ok' };
}
