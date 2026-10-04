import { z } from 'zod';

/**
 * Lo que el equipo decide sobre accesos: dueño de un negocio, invitaciones y
 * moderadores. Solo lo escribe el panel del equipo; aun así pasa por Zod, porque
 * una Server Action es un endpoint HTTP.
 */

// Recortar y bajar a minúsculas ANTES de validar (así se guarda en `usuarios` y `admins`).
const correo = z.string().trim().toLowerCase().max(254).pipe(z.email('Correo inválido'));

export const vincularCuentaSchema = z.object({
  portafolio_id: z.uuid('Identificador inválido'),
  correo,
  // El checkbox de confirmación: solo «si» autoriza quitarle el negocio a otra cuenta.
  reasignar: z
    .literal('si', { error: 'Confirmación no válida.' })
    .nullish()
    .transform((v) => v === 'si'),
});

export const desvincularCuentaSchema = z.object({
  portafolio_id: z.uuid('Identificador inválido'),
});

export const invitacionNuevaSchema = z
  .object({
    tipo: z.enum(['entidad', 'moderador']),
    entidad_id: z
      .uuid('Identificador inválido')
      .nullish()
      .or(z.literal('').transform(() => null)),
    nota: z
      .string()
      .trim()
      .max(80, 'Máximo 80 caracteres')
      .nullish()
      .transform((v) => v || null),
  })
  .refine((d) => (d.tipo === 'entidad') === Boolean(d.entidad_id), 'Falta la entidad de la invitación.');

export const revocarInvitacionSchema = z.object({
  id: z.uuid('Identificador inválido'),
});

export const desactivarModeradorSchema = z.object({
  email: correo,
});
