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
