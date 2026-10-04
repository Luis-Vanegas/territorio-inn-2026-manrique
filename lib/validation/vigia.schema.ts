import { z } from 'zod';

/**
 * Informe de UNA corrida del vigía (`pipeline/04_vigia_convocatorias.py`) a
 * `POST /api/ingesta/vigia`. Lo manda una máquina con el secreto, pero lo que trae
 * (URLs, textos de error) sale de páginas de terceros: Zod estricto, sin campos
 * de más.
 *
 * El pipeline NO dice «cambió» ni «sin cambios»: manda la huella y el repo la
 * compara con la última de esa fuente (un runner de Actions nace limpio cada día,
 * no puede recordarla). Por eso `estado` acá es solo lo que el pipeline sabe.
 */

export const ESTADOS_INFORME = ['responde', 'error_http', 'timeout', 'bloqueada_robots'] as const;

const texto = (min: number, max: number) => z.string().trim().min(min).max(max);

export const fuenteInformeSchema = z
  .strictObject({
    // Slug de `id` en fuentes_convocatorias.json.
    id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,59}$/, 'Slug inválido'),
    // Nombre de la entidad (igual a `entidades.nombre`); el repo la busca, no la crea.
    entidad: texto(2, 120),
    url: z
      .string()
      .trim()
      .max(500)
      .url()
      .refine((u) => /^https?:\/\//i.test(u), 'Solo http o https'),
    estado: z.enum(ESTADOS_INFORME),
    http_status: z.number().int().min(100).max(599).nullish(),
    huella: z
      .string()
      .regex(/^[0-9a-f]{64}$/, 'Huella sha256 en hex')
      .nullish(),
    candidatas: z.number().int().min(0).max(1000),
    nuevas: z.number().int().min(0).max(1000),
    error: texto(1, 200).nullish(),
  })
  .superRefine((f, ctx) => {
    const leida = f.estado === 'responde';
    if (leida !== (f.huella != null)) {
      ctx.addIssue({ code: 'custom', path: ['huella'], message: 'Hay huella si y solo si la página respondió' });
    }
    if (!leida && !f.error) {
      ctx.addIssue({ code: 'custom', path: ['error'], message: 'Una fuente que falla dice por qué' });
    }
    if (!leida && (f.candidatas !== 0 || f.nuevas !== 0)) {
      ctx.addIssue({ code: 'custom', path: ['candidatas'], message: 'Sin lectura no hay candidatas' });
    }
    if (f.nuevas > f.candidatas) {
      ctx.addIssue({ code: 'custom', path: ['nuevas'], message: 'Las nuevas no pueden pasar de las candidatas' });
    }
  });

export const informeVigiaSchema = z
  .strictObject({
    origen: z.enum(['actions', 'manual']),
    iniciada_en: z.iso.datetime(),
    terminada_en: z.iso.datetime(),
    fuentes: z.array(fuenteInformeSchema).min(1).max(50),
  })
  .superRefine((i, ctx) => {
    if (Date.parse(i.terminada_en) < Date.parse(i.iniciada_en)) {
      ctx.addIssue({ code: 'custom', path: ['terminada_en'], message: 'Termina antes de empezar' });
    }
    const ids = i.fuentes.map((f) => f.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['fuentes'], message: 'Fuente repetida en la misma corrida' });
    }
  });

export type InformeVigia = z.infer<typeof informeVigiaSchema>;
