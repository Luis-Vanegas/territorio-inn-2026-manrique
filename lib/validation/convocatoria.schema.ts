import { z } from 'zod';
import { OPCIONES_FORMALIDAD } from '@/lib/validation/portafolio.schema';

/**
 * Lo que el vigía (`pipeline/04_vigia_convocatorias.py`) manda a
 * `POST /api/ingesta/convocatorias`. Es texto que salió de páginas de terceros:
 * se valida como cualquier input externo, y aun así entra `pendiente` — un
 * moderador decide si se publica.
 */

const texto = (min: number, max: number) => z.string().trim().min(min).max(max);

export const convocatoriaEntradaSchema = z.object({
  titulo: texto(3, 200),
  // Nombre de la entidad (igual al de `entidades.nombre`): la ingesta lo resuelve
  // a `entidad_id`, y si no existe crea la entidad oferente (convocatorias.repo.ts).
  entidad: texto(2, 120),
  tema: texto(2, 80).nullish(),
  // Solo http(s): el enlace se muestra como <a href>, y `javascript:` no es un enlace.
  url: z
    .string()
    .trim()
    .max(500)
    .url()
    .refine((u) => /^https?:\/\//i.test(u), 'Solo http o https'),
  resumen: texto(1, 600).nullish(),
  fecha_cierre: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato AAAA-MM-DD')
    // Una fecha con forma válida pero imposible (2026-13-45) llegaría a Postgres
    // y tiraría un 500: el viaje de ida y vuelta por Date la descarta antes.
    .refine((f) => {
      const d = new Date(`${f}T00:00:00Z`);
      // `toISOString` tira RangeError con una fecha inválida: se mira antes.
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === f;
    }, 'Fecha inexistente')
    .nullish(),
});

export const ingestaConvocatoriasSchema = z.object({
  fuente: texto(2, 120),
  items: z.array(convocatoriaEntradaSchema).max(50),
});

export type ConvocatoriaEntrada = z.infer<typeof convocatoriaEntradaSchema>;

/**
 * Lo que manda el panel al moderar una convocatoria: a cuál, qué decide y, al
 * aprobar, a quién aplica. Vacío = a todos (todas las categorías / cualquier
 * formalidad). Las categorías que no existan se ignoran en el repo (join contra
 * `categorias`), no acá: la lista vigente vive en la base.
 */
export const decisionConvocatoriaSchema = z.object({
  id: z.uuid('Identificador inválido'),
  decision: z.enum(['aprobar', 'descartar', 'vencida']),
  categorias: z.array(texto(1, 60)).max(60).default([]),
  formalidades: z.array(z.enum(OPCIONES_FORMALIDAD)).max(OPCIONES_FORMALIDAD.length).default([]),
});

/**
 * Lo que una entidad aliada propone desde su panel (`/firmamento/entidad/convocatorias`).
 * Texto de una persona, no del vigía: mensajes en «tú» porque salen tal cual a la
 * pantalla. NO trae `entidad`: sale de la membresía de la sesión (`entidadDeSesion`),
 * nunca del formulario, o una entidad podría proponer a nombre de otra. Entra
 * `pendiente`: el equipo decide.
 *
 * `tema` es una lista cerrada (en la base es texto libre de 2 a 80 letras): con
 * lista, el equipo no recibe «financiacion», «Financiación» y «plata» como tres temas.
 */
export const TEMAS_CONVOCATORIA = [
  'Financiación',
  'Capacitación',
  'Formalización',
  'Comercialización y ventas',
  'Tecnología y digitalización',
  'Otro',
] as const;

/** AAAA-MM-DD de hoy en Bogotá: a las 8 p. m. de Colombia en UTC ya es mañana. */
function hoyBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

export const propuestaConvocatoriaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(5, 'Escribe el nombre completo de la convocatoria (mínimo 5 letras).')
    .max(200, 'El nombre es muy largo: máximo 200 letras.'),
  url: z
    .string()
    .trim()
    .max(500, 'El enlace es muy largo.')
    .refine((u) => /^https?:\/\//i.test(u), 'El enlace debe empezar por https://')
    .refine((u) => z.url().safeParse(u).success, 'Ese enlace no parece válido.'),
  resumen: z.string().trim().max(600, 'El resumen es muy largo: máximo 600 letras.').optional(),
  fecha_cierre: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige la fecha de cierre en el calendario.')
    .refine((f) => {
      const d = new Date(`${f}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === f;
    }, 'Esa fecha no existe.')
    .refine((f) => f >= hoyBogota(), 'La fecha de cierre ya pasó: no tendría a quién avisarle.')
    .optional(),
  tema: z.enum(TEMAS_CONVOCATORIA, 'Elige un tema de la lista.'),
});

export type PropuestaConvocatoria = z.infer<typeof propuestaConvocatoriaSchema>;
