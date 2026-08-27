'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { candidatoSchema, desdeFormData, VERSION_TERMINOS_EMPLEO } from '@/lib/validation/candidato.schema';
import { crearCandidato } from '@/lib/db/candidatos.repo';
import { verificarLimite, registrarIntento, ipDesdeHeaders } from '@/lib/db/rateLimit';

// Mismas dos señales anti-bot baratas que el resto de los formularios del
// sitio: cortar antes de gastar Zod o una query.
const CAMPO_TRAMPA = 'sitio_web';
const TIEMPO_MINIMO_MS = 8000;

/** Lo que la persona tipeó, para repoblar el formulario si hay que rechazar el envío. */
export type ValoresEnviados = ReturnType<typeof desdeFormData>;

export type EstadoRegistroCandidato =
  | { estado: 'inicial' }
  | {
      estado: 'error';
      mensaje?: string;
      errores?: Record<string, string[]>;
      valores?: ValoresEnviados;
    };

/**
 * Registro público de una persona que busca trabajo.
 *
 * Entra como 'pendiente': un moderador lo revisa antes de publicarlo, mismo
 * criterio que Aliados y Servicios — evita spam en un listado con teléfonos
 * reales.
 */
export async function registrarCandidato(
  _anterior: EstadoRegistroCandidato,
  formData: FormData,
): Promise<EstadoRegistroCandidato> {
  const ip = ipDesdeHeaders(await headers());

  // 1 · Rate limit
  const limite = await verificarLimite(ip);
  if (!limite.permitido) {
    return {
      estado: 'error',
      mensaje: `Ya enviaste varios registros. Probá de nuevo en ${limite.minutosRestantes} minuto${limite.minutosRestantes === 1 ? '' : 's'}.`,
    };
  }
  await registrarIntento(ip);

  // 2 · Anti-bot
  if (formData.get(CAMPO_TRAMPA)) {
    return { estado: 'error', mensaje: 'No pudimos procesar el registro. Intentá de nuevo.' };
  }
  const iniciadoEn = Number(formData.get('iniciado_en'));
  if (!iniciadoEn || Date.now() - iniciadoEn < TIEMPO_MINIMO_MS) {
    return { estado: 'error', mensaje: 'No pudimos procesar el registro. Intentá de nuevo.' };
  }

  // 3 · Forma
  const crudo = desdeFormData(formData);
  const parsed = candidatoSchema.safeParse(crudo);
  if (!parsed.success) {
    return { estado: 'error', errores: parsed.error.flatten().fieldErrors, valores: crudo };
  }
  const datos = parsed.data;

  // 4 · Insert
  try {
    await crearCandidato({
      nombre: datos.nombre,
      telefono: datos.telefono,
      nivel_formacion: datos.nivel_formacion,
      programa: datos.programa,
      graduado: datos.graduado,
      experiencia: datos.experiencia,
      busca: datos.busca,
      version_terminos: VERSION_TERMINOS_EMPLEO,
    });
  } catch (error) {
    console.error('[registrarCandidato] insert falló', error);
    return {
      estado: 'error',
      mensaje: 'No pudimos guardar el registro. Intentá de nuevo en un momento.',
      valores: crudo,
    };
  }

  revalidatePath('/admin/empleo');
  redirect('/empleo?registrado=1');
}
