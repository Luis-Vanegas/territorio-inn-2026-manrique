import { z } from 'zod';
import type { DefinicionCampo } from '@/lib/db/camposPersonalizados.repo';

/**
 * Genera el slug a partir de la etiqueta: minúsculas, sin acentos, espacios a
 * guion bajo. Coincide con el CHECK de la base (^[a-z][a-z0-9_]{1,49}$) — si
 * alguno de los dos cambia, el otro tiene que actualizarse junto.
 */
export function generarSlug(etiqueta: string): string {
  return etiqueta
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // saca tildes (marcas diacriticas tras NFD)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^[^a-z]+/, '') // el CHECK exige que arranque con letra
    .slice(0, 50);
}

const TIPOS = ['texto', 'numero', 'si_no', 'seleccion'] as const;

/** Schema del formulario admin para crear/editar una definición de campo. */
export const definicionCampoSchema = z
  .object({
    etiqueta: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80, 'Máximo 80 caracteres'),
    tipo: z.enum(TIPOS, { error: 'Elige un tipo de campo' }),
    opciones: z.array(z.string().trim().min(1)).optional(),
    requerido: z.boolean(),
    ayuda: z
      .union([z.string().trim().max(200, 'Máximo 200 caracteres'), z.literal('')])
      .transform((v) => (v === '' ? null : v))
      .optional(),
  })
  .refine(
    (d) => d.tipo !== 'seleccion' || (d.opciones && d.opciones.length >= 2),
    { message: 'Un campo de selección necesita al menos 2 opciones', path: ['opciones'] },
  )
  .refine(
    (d) => d.tipo === 'seleccion' || !d.opciones || d.opciones.length === 0,
    { message: 'Las opciones solo aplican a campos de selección', path: ['opciones'] },
  );

export type DefinicionCampoInput = z.infer<typeof definicionCampoSchema>;

/**
 * Valida los campos personalizados a mano, en vez de armar un schema de Zod
 * dinámico. Las definiciones cambian en runtime (el admin las edita), así que
 * un schema de Zod "compilado" no aporta nada sobre un switch por tipo — y es
 * mucho más simple de leer que la construcción dinámica de un ZodObject.
 *
 * El nombre de campo en el FormData es `campo_<slug>`, para no chocar nunca
 * con los nombres de los campos fijos del formulario (nombre, categoria_id...).
 */

export type ValorCampoPersonalizado = string | number | boolean;

const PREFIJO = 'campo_';

export function nombreCampoFormulario(slug: string): string {
  return `${PREFIJO}${slug}`;
}

export function extraerCamposPersonalizados(
  formData: FormData,
  definiciones: DefinicionCampo[],
): { valores: Record<string, ValorCampoPersonalizado>; errores: Record<string, string[]> } {
  const valores: Record<string, ValorCampoPersonalizado> = {};
  const errores: Record<string, string[]> = {};

  for (const def of definiciones) {
    const campoForm = nombreCampoFormulario(def.slug);
    const crudo = formData.get(campoForm);

    if (def.tipo === 'si_no') {
      // Un checkbox ausente en el FormData significa "no marcado", no "falta".
      valores[def.slug] = crudo === 'on' || crudo === 'true';
      continue;
    }

    const texto = typeof crudo === 'string' ? crudo.trim() : '';

    if (!texto) {
      if (def.requerido) {
        errores[campoForm] = [`${def.etiqueta} es obligatorio`];
      }
      continue; // vacío y opcional: no se guarda la clave
    }

    switch (def.tipo) {
      case 'texto': {
        if (texto.length > 400) {
          errores[campoForm] = [`Máximo 400 caracteres`];
          break;
        }
        valores[def.slug] = texto;
        break;
      }

      case 'numero': {
        const n = Number(texto);
        if (!Number.isFinite(n)) {
          errores[campoForm] = [`${def.etiqueta} debe ser un número`];
          break;
        }
        valores[def.slug] = n;
        break;
      }

      case 'seleccion': {
        const opciones = def.opciones ?? [];
        if (!opciones.includes(texto)) {
          errores[campoForm] = [`Elige una opción válida para ${def.etiqueta}`];
          break;
        }
        valores[def.slug] = texto;
        break;
      }
    }
  }

  return { valores, errores };
}
