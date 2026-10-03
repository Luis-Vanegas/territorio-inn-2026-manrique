'use server';

import { revalidatePath } from 'next/cache';

import { verificarSesion } from '@/lib/auth/admin';
import { agregarMiembroPorCorreo, crearEntidad, quitarMiembro } from '@/lib/db/entidades.repo';
import { entidadNuevaSchema, miembroEntidadSchema, quitarMiembroSchema } from '@/lib/validation/entidad.schema';

/**
 * Alta de entidades y de sus miembros, desde el panel del equipo
 * (`/firmamento/equipo/entidades`). Cada action revalida la sesión de
 * moderación por su cuenta: es un endpoint HTTP, se puede invocar sin pasar por
 * la página. Lo que da acceso al panel de entidad es la fila en
 * `miembros_entidad`, así que agregar un miembro es una decisión de acceso.
 */

export type EstadoEntidad =
  | { estado: 'inicial' }
  | { estado: 'ok'; mensaje: string }
  | { estado: 'error'; mensaje: string };

const RUTA = '/firmamento/equipo/entidades';
const SESION_VENCIDA: EstadoEntidad = { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar.' };

function primerError(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? 'Revisa los datos.';
}

export async function crearEntidadAction(_anterior: EstadoEntidad, formData: FormData): Promise<EstadoEntidad> {
  if (!(await verificarSesion())) return SESION_VENCIDA;

  const parsed = entidadNuevaSchema.safeParse({
    nombre: formData.get('nombre') ?? '',
    tipo: formData.get('tipo') ?? '',
    sitio: formData.get('sitio') ?? '',
  });
  if (!parsed.success) return { estado: 'error', mensaje: primerError(parsed.error) };

  try {
    const id = await crearEntidad(parsed.data);
    if (!id) return { estado: 'error', mensaje: `Ya existe una entidad llamada «${parsed.data.nombre}».` };
  } catch (error) {
    console.error('[crearEntidadAction]', error instanceof Error ? error.message : error);
    return { estado: 'error', mensaje: 'No se pudo crear la entidad. Intenta de nuevo.' };
  }

  revalidatePath(RUTA);
  return { estado: 'ok', mensaje: `Entidad «${parsed.data.nombre}» creada.` };
}

const RESULTADO_MIEMBRO = {
  agregado: null,
  ya_era_miembro: 'Esa persona ya es miembro de esta entidad.',
  sin_cuenta:
    'No hay una cuenta con ese correo. La persona tiene que entrar una vez con Google en Constelaciones y después la agregas.',
  sin_entidad: 'Esa entidad ya no existe. Refresca la página.',
} as const;

export async function agregarMiembroAction(_anterior: EstadoEntidad, formData: FormData): Promise<EstadoEntidad> {
  const sesion = await verificarSesion();
  if (!sesion) return SESION_VENCIDA;

  const parsed = miembroEntidadSchema.safeParse({
    entidad_id: formData.get('entidad_id') ?? '',
    correo: formData.get('correo') ?? '',
  });
  if (!parsed.success) return { estado: 'error', mensaje: primerError(parsed.error) };

  try {
    const resultado = await agregarMiembroPorCorreo(parsed.data.entidad_id, parsed.data.correo, sesion.email);
    const problema = RESULTADO_MIEMBRO[resultado];
    if (problema) return { estado: 'error', mensaje: problema };
  } catch (error) {
    console.error('[agregarMiembroAction]', error instanceof Error ? error.message : error);
    return { estado: 'error', mensaje: 'No se pudo agregar. Intenta de nuevo.' };
  }

  revalidatePath(RUTA);
  return { estado: 'ok', mensaje: `${parsed.data.correo} ya puede entrar al panel de la entidad.` };
}

export async function quitarMiembroAction(_anterior: EstadoEntidad, formData: FormData): Promise<EstadoEntidad> {
  if (!(await verificarSesion())) return SESION_VENCIDA;

  const parsed = quitarMiembroSchema.safeParse({
    entidad_id: formData.get('entidad_id') ?? '',
    usuario_id: formData.get('usuario_id') ?? '',
  });
  if (!parsed.success) return { estado: 'error', mensaje: primerError(parsed.error) };

  try {
    if (!(await quitarMiembro(parsed.data.entidad_id, parsed.data.usuario_id))) {
      return { estado: 'error', mensaje: 'Esa persona ya no era miembro. Refresca la página.' };
    }
  } catch (error) {
    console.error('[quitarMiembroAction]', error instanceof Error ? error.message : error);
    return { estado: 'error', mensaje: 'No se pudo quitar. Intenta de nuevo.' };
  }

  revalidatePath(RUTA);
  return { estado: 'ok', mensaje: 'Acceso retirado.' };
}
