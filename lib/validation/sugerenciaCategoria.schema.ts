import { z } from 'zod';

/**
 * Lo único que el formulario de registro manda del sugeridor: la categoría que
 * infirió el modelo y con cuánta confianza. NUNCA el texto escrito (el nombre del
 * negocio es dato de la persona): el schema ni siquiera tiene dónde recibirlo.
 */
export const sugerenciaCategoriaSchema = z.object({
  categoria_inferida: z.string().regex(/^[a-z_]{1,60}$/, 'Categoría inválida'),
  confianza: z
    .string()
    .regex(/^\d(\.\d{1,6})?$/, 'Confianza inválida')
    .transform(Number)
    .pipe(z.number().min(0).max(1)),
});

export type SugerenciaCategoria = z.infer<typeof sugerenciaCategoriaSchema>;

/**
 * Lee los dos campos ocultos del sugeridor. `null` si faltan o no son válidos: no
 * hubo sugerencia que registrar, y eso nunca debe romper el envío del formulario.
 */
export function sugerenciaDesdeFormData(formData: FormData): SugerenciaCategoria | null {
  const inferida = formData.get('sugerencia_categoria');
  const confianza = formData.get('sugerencia_confianza');
  if (typeof inferida !== 'string' || typeof confianza !== 'string') return null;

  const parsed = sugerenciaCategoriaSchema.safeParse({
    categoria_inferida: inferida,
    confianza,
  });
  return parsed.success ? parsed.data : null;
}

/**
 * null = no eligió categoría; true = quedó con la que sugería el modelo; false =
 * eligió otra. Es la columna `aceptada` de `sugerencias_categoria`.
 */
export function respuestaASugerencia(
  inferida: string,
  elegida: FormDataEntryValue | null,
): boolean | null {
  if (typeof elegida !== 'string' || elegida === '') return null;
  return elegida === inferida;
}
