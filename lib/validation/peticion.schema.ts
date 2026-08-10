import { z } from 'zod';

export const peticionSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'Máximo 80 caracteres'),

  contacto: z
    .string()
    .trim()
    .min(3, 'Dejá un correo, teléfono o WhatsApp para responderte')
    .max(120, 'Máximo 120 caracteres'),

  mensaje: z
    .string()
    .trim()
    .min(10, 'Contanos un poco más — al menos 10 caracteres')
    .max(1000, 'Máximo 1000 caracteres'),
});

export type PeticionInput = z.infer<typeof peticionSchema>;

export function desdeFormData(formData: FormData) {
  const texto = (k: string) => (formData.get(k) ?? '').toString();
  return {
    nombre: texto('nombre'),
    contacto: texto('contacto'),
    mensaje: texto('mensaje'),
  };
}
