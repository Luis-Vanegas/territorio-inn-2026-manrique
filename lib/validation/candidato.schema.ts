import { z } from 'zod';

/**
 * Schema del módulo Empleo, compartido entre el formulario y la server action.
 *
 * A diferencia de `servicio.schema.ts`, acá no hay separación público/privado:
 * quien busca trabajo quiere que lo encuentren, así que todo lo que se pide es
 * exactamente lo que se publica. No hay foto, ni correo, ni documento.
 */

export const VERSION_TERMINOS_EMPLEO = '2026-08-empleo-v1';

export const OPCIONES_NIVEL_FORMACION = [
  'universitaria',
  'tecnologica',
  'tecnica',
  'tecnico_sena',
  'bachiller',
  'ninguna',
] as const;

/** Niveles que implican un programa/carrera concreta que nombrar. */
const NIVELES_CON_PROGRAMA = ['universitaria', 'tecnologica', 'tecnica', 'tecnico_sena'];

const telefonoColombiano = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{6,14}$/, 'Número inválido. Ej: 300 123 4567');

const opcional = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.literal('')]).transform((v) => (v === '' ? null : v));

export const candidatoSchema = z
  .object({
    nombre: z.string().trim().min(2, 'Escribe tu nombre').max(80, 'Máximo 80 caracteres'),
    telefono: telefonoColombiano,

    nivel_formacion: z.enum(OPCIONES_NIVEL_FORMACION, { message: 'Elige una opción' }),
    programa: opcional(z.string().trim().max(100, 'Máximo 100 caracteres')),
    graduado: z.boolean().nullable().default(null),

    experiencia: z
      .string()
      .trim()
      .min(10, 'Cuenta qué sabes hacer — mínimo 10 caracteres')
      .max(400, 'Máximo 400 caracteres'),
    busca: z
      .string()
      .trim()
      .min(5, 'Cuenta qué tipo de trabajo buscas')
      .max(200, 'Máximo 200 caracteres'),

    acepto_terminos: z.literal(true, { message: 'Tienes que aceptar los términos' }),
    acepto_habeas_data: z.literal(true, {
      message: 'Tienes que autorizar el tratamiento de datos',
    }),
  })
  // Universitaria/tecnológica/técnica/SENA sin nombrar el programa deja una
  // ficha inútil para quien busca perfiles concretos.
  .refine((d) => !NIVELES_CON_PROGRAMA.includes(d.nivel_formacion) || Boolean(d.programa), {
    message: 'Escribe el nombre del programa o carrera',
    path: ['programa'],
  });

export type DatosCandidato = z.infer<typeof candidatoSchema>;

/** FormData → objeto plano, antes de Zod. Mismo patrón que servicio.schema. */
export function desdeFormData(formData: FormData) {
  const texto = (k: string) => (formData.get(k) ?? '').toString();
  // Un radio sin marcar no manda nada: null explícito, no false silencioso.
  const triestado = (k: string) => {
    const v = formData.get(k);
    if (v === null || v === '') return null;
    return v === 'si';
  };

  return {
    nombre: texto('nombre'),
    telefono: texto('telefono'),
    nivel_formacion: texto('nivel_formacion'),
    programa: texto('programa'),
    graduado: triestado('graduado'),
    experiencia: texto('experiencia'),
    busca: texto('busca'),
    acepto_terminos: formData.get('acepto_terminos') === 'on',
    acepto_habeas_data: formData.get('acepto_habeas_data') === 'on',
  };
}
