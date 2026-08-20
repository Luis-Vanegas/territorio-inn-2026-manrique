import { z } from 'zod';

/**
 * Schema del módulo Servicios, compartido entre el formulario y la server
 * action. Mismo criterio que `portafolio.schema.ts`: una sola definición, o
 * el cliente valida distinto que el server y la persona llena todo para que
 * se lo rechacen igual.
 *
 * Lo que NO existe acá es tan importante como lo que existe: no hay dirección,
 * ni latitud, ni longitud, ni documento de identidad. Quien presta un servicio
 * se desplaza — su dirección es su casa, y no se pide.
 */

/** Versión propia del módulo: el texto legal que se acepta acá no es el mismo. */
export const VERSION_TERMINOS_SERVICIO = '2026-08-servicios-v1';

export const OPCIONES_COMO_CONSIGUE = [
  'voz_a_voz',
  'redes',
  'volantes',
  'ninguno',
  'otro',
] as const;

export const OPCIONES_FORMACION = ['sena', 'tecnico', 'empirico', 'ninguna'] as const;

export const OPCIONES_NECESITA = [
  'herramientas',
  'capacitacion',
  'transporte',
  'capital',
  'clientes',
] as const;

/** Mismo formato que el resto del sitio. Se guarda como lo escribió la persona. */
const telefonoColombiano = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{6,14}$/, 'Número inválido. Ej: 300 123 4567');

const opcional = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.literal('')]).transform((v) => (v === '' ? null : v));

export const servicioSchema = z
  .object({
    // ── Público ──────────────────────────────────────────────
    nombre: z
      .string()
      .trim()
      .min(2, 'Escribí tu nombre')
      .max(80, 'Máximo 80 caracteres'),

    categoria_id: z.string().trim().min(1, 'Elegí un oficio'),
    categoria_otra: opcional(z.string().trim().max(60)),

    // Mínimo real de 20: "arreglo cosas" no le sirve a nadie para decidir a
    // quién dejar entrar a su casa.
    descripcion: z
      .string()
      .trim()
      .min(20, 'Contá con detalle qué hacés — mínimo 20 caracteres')
      .max(400, 'Máximo 400 caracteres'),

    anos_experiencia: z
      .number({ message: 'Indicá tus años de experiencia' })
      .int('Tiene que ser un número entero')
      .min(0)
      .max(70, '¿Seguro? Máximo 70 años'),

    cobertura: z
      .array(z.string().trim().min(1))
      .min(1, 'Elegí al menos un barrio donde atendés')
      .max(25, 'Máximo 25 barrios'),

    telefono: telefonoColombiano,

    // ── Privado (nunca se publica) ───────────────────────────
    correo: opcional(z.string().trim().email('Correo inválido')),

    mayor_dificultad: z
      .string()
      .trim()
      .min(3, 'Contanos qué te dificulta conseguir trabajo')
      .max(300, 'Máximo 300 caracteres'),

    ingreso_principal: z.boolean().nullable().default(null),
    horas_semana: z.number().int().min(1).max(90).nullable().default(null),
    como_consigue_clientes: opcional(z.enum(OPCIONES_COMO_CONSIGUE)),
    herramientas_propias: z.boolean().nullable().default(null),
    formacion: opcional(z.enum(OPCIONES_FORMACION)),
    tiene_arl: z.boolean().nullable().default(null),
    necesita: z.array(z.enum(OPCIONES_NECESITA)).default([]),
    sale_de_comuna: z.boolean().nullable().default(null),

    // ── Consentimiento ───────────────────────────────────────
    acepto_terminos: z.literal(true, { message: 'Tenés que aceptar los términos' }),
    acepto_habeas_data: z.literal(true, {
      message: 'Tenés que autorizar el tratamiento de datos',
    }),
    acepto_codigo_conducta: z.literal(true, {
      message: 'Tenés que aceptar el código de conducta para publicarte',
    }),
    // Autorización específica: sin esto el proyecto no puede guardar la
    // caracterización laboral, así que no es un checkbox más — es la condición
    // que habilita todo el resto.
    acepto_investigacion: z.literal(true, {
      message: 'Necesitamos tu autorización para usar tus datos en la investigación',
    }),
  })
  // "Otro" oficio sin escribir cuál deja una ficha inútil en la vitrina.
  .refine((d) => d.categoria_id !== 'otros' || Boolean(d.categoria_otra), {
    message: 'Escribí cuál es tu oficio',
    path: ['categoria_otra'],
  });

export type DatosServicio = z.infer<typeof servicioSchema>;

/** FormData → objeto plano, antes de Zod. Mismo patrón que portafolio.schema. */
export function desdeFormData(formData: FormData) {
  const texto = (k: string) => (formData.get(k) ?? '').toString();
  const numero = (k: string) => {
    const v = formData.get(k);
    if (v === null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  // Un radio sin marcar no manda nada: null explícito, no false silencioso.
  const triestado = (k: string) => {
    const v = formData.get(k);
    if (v === null || v === '') return null;
    return v === 'si';
  };

  return {
    nombre: texto('nombre'),
    categoria_id: texto('categoria_id'),
    categoria_otra: texto('categoria_otra'),
    descripcion: texto('descripcion'),
    anos_experiencia: numero('anos_experiencia'),
    cobertura: formData.getAll('cobertura').map(String),
    telefono: texto('telefono'),

    correo: texto('correo'),
    mayor_dificultad: texto('mayor_dificultad'),
    ingreso_principal: triestado('ingreso_principal'),
    horas_semana: numero('horas_semana') ?? null,
    como_consigue_clientes: texto('como_consigue_clientes'),
    herramientas_propias: triestado('herramientas_propias'),
    formacion: texto('formacion'),
    tiene_arl: triestado('tiene_arl'),
    necesita: formData.getAll('necesita').map(String),
    sale_de_comuna: triestado('sale_de_comuna'),

    acepto_terminos: formData.get('acepto_terminos') === 'on',
    acepto_habeas_data: formData.get('acepto_habeas_data') === 'on',
    acepto_codigo_conducta: formData.get('acepto_codigo_conducta') === 'on',
    acepto_investigacion: formData.get('acepto_investigacion') === 'on',
  };
}
