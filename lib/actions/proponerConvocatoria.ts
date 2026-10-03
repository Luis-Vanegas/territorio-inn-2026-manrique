'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

import { entidadDeSesion } from '@/lib/auth/entidad';
import { sesionActual } from '@/lib/auth/usuario';
import { registrarEnBitacora } from '@/lib/db/bitacora.repo';
import { proponerConvocatoria as guardarPropuesta } from '@/lib/db/convocatorias.repo';
import { ipDesdeHeaders, registrarIntento, verificarLimite } from '@/lib/db/rateLimit';
import { propuestaConvocatoriaSchema } from '@/lib/validation/convocatoria.schema';

// Un archivo 'use server' solo puede exportar funciones async (y tipos).
const CAMPOS_PROPUESTA = ['titulo', 'url', 'tema', 'resumen', 'fecha_cierre'] as const;
export type CampoPropuesta = (typeof CAMPOS_PROPUESTA)[number];

export type EstadoPropuesta =
  | { estado: 'inicial' }
  | { estado: 'ok'; mensaje: string }
  | {
      estado: 'error';
      mensaje: string;
      /** Por campo, para pintar el error junto a su casilla. */
      errores?: Partial<Record<CampoPropuesta, string[]>>;
      /** Lo que la persona escribió: React vacía el formulario al terminar la acción. */
      valores?: Partial<Record<CampoPropuesta, string>>;
    };

/**
 * Una entidad aliada propone una convocatoria. Entra `pendiente` con
 * `origen = 'entidad'`: el equipo la revisa y decide, igual que un negocio.
 *
 * Una Server Action es un endpoint invocable sin pasar por el layout del panel,
 * así que la autorización se revalida acá: sesión de vecino Y membresía activa en
 * `miembros_entidad`. La entidad sale de `entidadDeSesion()`, nunca del formulario
 * (el schema ni siquiera tiene ese campo). El cupo es el de `estado` (6 cada 10
 * minutos, mismo criterio de «corregir un dato»): no se agregó un origen nuevo
 * porque exigiría una migración del CHECK de `intentos_registro`.
 */
export async function proponerConvocatoria(
  _anterior: EstadoPropuesta,
  formData: FormData,
): Promise<EstadoPropuesta> {
  const sesion = await sesionActual();
  const entidad = sesion ? await entidadDeSesion() : null;
  if (!sesion || !entidad) {
    return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a entrar a Firmamento.' };
  }

  const ip = ipDesdeHeaders(await headers());
  const limite = await verificarLimite(ip, 'estado');
  if (!limite.permitido) {
    return {
      estado: 'error',
      mensaje: `Has enviado varias propuestas seguidas. Prueba de nuevo en ${limite.minutosRestantes} minuto${limite.minutosRestantes === 1 ? '' : 's'}.`,
    };
  }
  await registrarIntento(ip, 'estado');

  // Texto crudo, tal como se escribió (para devolverlo si algo falla). Una casilla
  // opcional vacía llega como '' y el schema la quiere ausente.
  const valores: Partial<Record<CampoPropuesta, string>> = {};
  for (const campo of CAMPOS_PROPUESTA) {
    const v = formData.get(campo);
    valores[campo] = typeof v === 'string' ? v : '';
  }
  const aOpcional = (v: string | undefined) => (v && v.trim() !== '' ? v : undefined);

  const parsed = propuestaConvocatoriaSchema.safeParse({
    titulo: valores.titulo,
    url: valores.url,
    tema: valores.tema,
    resumen: aOpcional(valores.resumen),
    fecha_cierre: aOpcional(valores.fecha_cierre),
  });
  if (!parsed.success) {
    return {
      estado: 'error',
      mensaje: 'Revisa los campos marcados.',
      errores: parsed.error.flatten().fieldErrors as Partial<Record<CampoPropuesta, string[]>>,
      valores,
    };
  }

  let id: string | null;
  try {
    id = await guardarPropuesta(entidad.id, sesion.id, parsed.data);
  } catch (error) {
    console.error('[proponerConvocatoria] falló', error);
    return { estado: 'error', mensaje: 'No pudimos guardar tu propuesta. Inténtalo de nuevo.', valores };
  }
  if (!id) {
    return {
      estado: 'error',
      mensaje: 'Ese enlace ya está registrado. Búscalo en «Abiertas ahora» o en «Tus propuestas».',
      errores: { url: ['Ya tenemos una convocatoria con este enlace.'] },
      valores,
    };
  }

  await registrarEnBitacora({
    actor_tipo: 'entidad',
    actor: sesion.id,
    accion: 'convocatoria_propuesta',
    convocatoria_id: id,
    campos: Object.keys(parsed.data),
  });

  revalidatePath('/firmamento/entidad/convocatorias');
  return { estado: 'ok', mensaje: 'Enviada. El equipo la revisa y aquí ves su estado.' };
}
