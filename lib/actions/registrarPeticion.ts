'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { peticionSchema, desdeFormData } from '@/lib/validation/peticion.schema';
import { crearPeticion } from '@/lib/db/peticiones.repo';
import { verificarLimite, registrarIntento, ipDesdeHeaders } from '@/lib/db/rateLimit';

export type EstadoPeticion =
  | { estado: 'inicial' }
  | { estado: 'ok' }
  | { estado: 'error'; mensaje?: string; errores?: Record<string, string[]> };

/**
 * Buzón público: cualquiera deja un mensaje, el equipo lo revisa en
 * /admin/peticiones y responde por fuera con el contacto que dejó.
 *
 * Comparte el límite de intentos_registro con registrarPortafolio a propósito:
 * ambos endpoints son públicos y sin auth, y separar el cupo por endpoint es
 * una tabla y una columna más para un volumen que hoy no lo justifica.
 * ponytail: si algún día un endpoint necesita su propio cupo, se agrega una
 * columna `origen` a intentos_registro — no antes.
 */
export async function registrarPeticion(
  _anterior: EstadoPeticion,
  formData: FormData,
): Promise<EstadoPeticion> {
  const ip = ipDesdeHeaders(await headers());

  const limite = await verificarLimite(ip);
  if (!limite.permitido) {
    return {
      estado: 'error',
      mensaje: `Ya enviaste varios mensajes. Probá de nuevo en ${limite.minutosRestantes} minuto${limite.minutosRestantes === 1 ? '' : 's'}.`,
    };
  }
  await registrarIntento(ip);

  const parsed = peticionSchema.safeParse(desdeFormData(formData));
  if (!parsed.success) {
    return { estado: 'error', errores: parsed.error.flatten().fieldErrors };
  }

  try {
    await crearPeticion({ ...parsed.data, ip_registro: ip });
  } catch (error) {
    console.error('[registrarPeticion] insert falló', error);
    return {
      estado: 'error',
      mensaje: 'No pudimos guardar tu mensaje. Intentá de nuevo en un momento.',
    };
  }

  revalidatePath('/admin/peticiones');
  return { estado: 'ok' };
}
