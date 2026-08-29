'use server';

import { revalidatePath } from 'next/cache';
import { verificarSesion } from '@/lib/auth/admin';
import {
  crearCampo,
  editarCampo,
  cambiarActivo,
  obtenerCampo,
} from '@/lib/db/camposPersonalizados.repo';
import {
  definicionCampoSchema,
  generarSlug,
} from '@/lib/validation/camposPersonalizados.schema';

export type EstadoCampo =
  | { estado: 'inicial' }
  | { estado: 'ok'; mensaje: string }
  | { estado: 'error'; mensaje?: string; errores?: Record<string, string[]> };

/** Un textarea, una opción por línea. Más simple que inputs dinámicos con JS. */
function parsearOpciones(crudo: FormDataEntryValue | null): string[] {
  if (typeof crudo !== 'string') return [];
  return crudo
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function datosDesdeForm(formData: FormData) {
  return {
    etiqueta: String(formData.get('etiqueta') ?? ''),
    tipo: String(formData.get('tipo') ?? ''),
    opciones: parsearOpciones(formData.get('opciones')),
    requerido: formData.get('requerido') === 'on',
    ayuda: String(formData.get('ayuda') ?? ''),
  };
}

export async function crearCampoAction(
  _anterior: EstadoCampo,
  formData: FormData,
): Promise<EstadoCampo> {
  const sesion = await verificarSesion();
  if (!sesion) return { estado: 'error', mensaje: 'Tu sesión venció. Volvé a entrar.' };

  const parsed = definicionCampoSchema.safeParse(datosDesdeForm(formData));
  if (!parsed.success) {
    return { estado: 'error', errores: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const slug = generarSlug(parsed.data.etiqueta);
  if (slug.length < 2) {
    return {
      estado: 'error',
      errores: { etiqueta: ['La etiqueta necesita al menos 2 letras para generar un identificador'] },
    };
  }

  try {
    await crearCampo(
      {
        slug,
        etiqueta: parsed.data.etiqueta,
        tipo: parsed.data.tipo,
        opciones: parsed.data.tipo === 'seleccion' ? (parsed.data.opciones ?? null) : null,
        requerido: parsed.data.requerido,
        ayuda: parsed.data.ayuda ?? null,
      },
      sesion.email,
    );
  } catch (error) {
    // Colisión de slug (dos etiquetas que normalizan igual, p. ej. "Año" y "año").
    if (error instanceof Error && error.message.includes('definiciones_campo_slug_key')) {
      return {
        estado: 'error',
        errores: { etiqueta: ['Ya existe un campo con un nombre muy parecido — prueba algo más específico'] },
      };
    }
    console.error('[crearCampoAction]', error);
    return { estado: 'error', mensaje: 'No se pudo crear el campo. Intenta de nuevo.' };
  }

  revalidatePath('/admin/campos');
  revalidatePath('/aliados/registro');
  return { estado: 'ok', mensaje: `Campo "${parsed.data.etiqueta}" creado.` };
}

export async function editarCampoAction(
  _anterior: EstadoCampo,
  formData: FormData,
): Promise<EstadoCampo> {
  const sesion = await verificarSesion();
  if (!sesion) return { estado: 'error', mensaje: 'Tu sesión venció. Volvé a entrar.' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { estado: 'error', mensaje: 'Falta el identificador del campo.' };

  // El tipo real sale de la base, no de un campo oculto del formulario: un
  // hidden input lo puede falsificar cualquiera, y usar ese valor acá haría
  // que "opciones" se borre silenciosamente si alguien manda un tipo distinto
  // al que el campo realmente tiene guardado.
  const actual = await obtenerCampo(id);
  if (!actual) return { estado: 'error', mensaje: 'Ese campo ya no existe.' };

  const datos = datosDesdeForm(formData);
  const parsed = definicionCampoSchema.safeParse({ ...datos, tipo: actual.tipo });
  if (!parsed.success) {
    return { estado: 'error', errores: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    await editarCampo(id, {
      etiqueta: parsed.data.etiqueta,
      opciones: parsed.data.tipo === 'seleccion' ? (parsed.data.opciones ?? null) : null,
      requerido: parsed.data.requerido,
      ayuda: parsed.data.ayuda ?? null,
    });
  } catch (error) {
    console.error('[editarCampoAction]', error);
    return { estado: 'error', mensaje: 'No se pudo guardar el cambio.' };
  }

  revalidatePath('/admin/campos');
  revalidatePath('/aliados/registro');
  return { estado: 'ok', mensaje: 'Campo actualizado.' };
}

/** Activar/desactivar es una acción de un clic — no necesita useFormState. */
export async function cambiarActivoCampoAction(formData: FormData): Promise<void> {
  const sesion = await verificarSesion();
  if (!sesion) return;

  const id = String(formData.get('id') ?? '');
  const activo = formData.get('activo') === 'true';
  if (!id) return;

  await cambiarActivo(id, activo);
  revalidatePath('/admin/campos');
  revalidatePath('/aliados/registro');
}
