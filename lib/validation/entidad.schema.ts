import { z } from 'zod';

/**
 * Entidades (migración 033) y sus miembros. Lo escribe solo el equipo desde su
 * panel; aun así pasa por Zod, porque una Server Action es un endpoint HTTP.
 */

export const TIPOS_ENTIDAD = ['territorial', 'oferente'] as const;
export type TipoEntidad = (typeof TIPOS_ENTIDAD)[number];

export const entidadNuevaSchema = z.object({
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120, 'Máximo 120 caracteres'),
  tipo: z.enum(TIPOS_ENTIDAD),
  // Solo http(s): se muestra como <a href>, y `javascript:` no es un enlace.
  sitio: z
    .string()
    .trim()
    .max(300)
    .url('Escribe una dirección completa, con https://')
    .refine((u) => /^https?:\/\//i.test(u), 'Solo http o https')
    .nullish()
    .or(z.literal('').transform(() => null)),
});

export type EntidadNueva = z.infer<typeof entidadNuevaSchema>;

/**
 * Agregar un miembro: la persona ya tiene que haber entrado una vez con Google
 * (su fila en `usuarios` existe). Se busca por correo porque es lo que el equipo
 * conoce; la identidad sigue siendo `google_sub` (docs/seguridad.md), el correo
 * solo ubica la fila.
 */
export const miembroEntidadSchema = z.object({
  entidad_id: z.uuid('Identificador inválido'),
  // Recortar y bajar a minúsculas ANTES de validar (así se guarda en `usuarios`).
  correo: z.string().trim().toLowerCase().max(254).pipe(z.email('Correo inválido')),
});

export const quitarMiembroSchema = z.object({
  entidad_id: z.uuid('Identificador inválido'),
  usuario_id: z.uuid('Identificador inválido'),
});
