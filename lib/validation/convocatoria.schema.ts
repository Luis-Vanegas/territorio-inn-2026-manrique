import { z } from 'zod';

/**
 * Lo que el vigía (`pipeline/04_vigia_convocatorias.py`) manda a
 * `POST /api/ingesta/convocatorias`. Es texto que salió de páginas de terceros:
 * se valida como cualquier input externo, y aun así entra `pendiente` — un
 * moderador decide si se publica.
 */

const texto = (min: number, max: number) => z.string().trim().min(min).max(max);

export const convocatoriaEntradaSchema = z.object({
  titulo: texto(3, 200),
  entidad: texto(2, 120),
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
  // Ids de categorías a las que aplica; vacío = a todos los negocios.
  aplica_a: z.array(texto(1, 60)).max(20).default([]),
});

export const ingestaConvocatoriasSchema = z.object({
  fuente: texto(2, 120),
  items: z.array(convocatoriaEntradaSchema).max(50),
});

export type ConvocatoriaEntrada = z.infer<typeof convocatoriaEntradaSchema>;

/** Lo que manda el panel al moderar una convocatoria: a cuál y qué decide. */
export const decisionConvocatoriaSchema = z.object({
  id: z.uuid('Identificador inválido'),
  decision: z.enum(['aprobar', 'descartar', 'vencida']),
});
