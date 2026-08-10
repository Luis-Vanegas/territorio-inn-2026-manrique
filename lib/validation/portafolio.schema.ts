import { z } from 'zod';
import { BBOX_MANRIQUE } from '@/lib/geo/constantes';

/**
 * Schema compartido entre el formulario (cliente) y la server action.
 * Una sola definición: si el cliente y el server validan distinto, el usuario
 * llena el formulario, pasa la validación y el server se lo rechaza igual.
 *
 * Este es el piso de validación, no el techo: la server action además verifica
 * point-in-polygon contra el límite real, y la base tiene sus propios CHECK.
 */

/** Se sube cuando cambie el texto legal. Queda grabado en cada registro. */
export const VERSION_TERMINOS = '2026-01-v1';

export const TIPOS_FOTO_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const TAMANO_MAX_FOTO = 5 * 1024 * 1024;

/**
 * Acepta formatos colombianos: "3001234567", "300 123 4567", "+57 300 1234567",
 * "604 1234567". Se guarda como lo escribió la persona; normalizar acá haría
 * que el número mostrado no coincida con el que dictó.
 */
const telefonoColombiano = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{6,14}$/, 'Número inválido. Ej: 300 123 4567');

/** Campo opcional que llega como "" desde un input vacío. */
const opcional = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.literal('')]).transform((v) => (v === '' ? null : v));

const [minLng, minLat, maxLng, maxLat] = BBOX_MANRIQUE;

export const portafolioSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(80, 'Máximo 80 caracteres'),

    descripcion: opcional(z.string().trim().max(400, 'Máximo 400 caracteres')),

    categoria_id: z.string().min(1, 'Elegí una categoría'),

    direccion: z
      .string()
      .trim()
      .min(5, 'Escribí la dirección completa')
      .max(200, 'Máximo 200 caracteres'),

    barrio: z
      .string()
      .trim()
      .min(2, 'Indicá el barrio')
      .max(80, 'Máximo 80 caracteres'),

    // El bbox descarta lo obviamente lejano y da un mensaje claro. El polígono
    // real se verifica aparte: un bbox es un rectángulo y Manrique no lo es.
    latitud: z
      .number({ error: 'Marcá la ubicación en el mapa' })
      .min(minLat, 'La ubicación está fuera de Manrique')
      .max(maxLat, 'La ubicación está fuera de Manrique'),

    longitud: z
      .number({ error: 'Marcá la ubicación en el mapa' })
      .min(minLng, 'La ubicación está fuera de Manrique')
      .max(maxLng, 'La ubicación está fuera de Manrique'),

    whatsapp: opcional(telefonoColombiano),
    telefono: opcional(telefonoColombiano),
    correo: opcional(z.email('Correo inválido')),
    instagram: opcional(
      z.string().trim().max(60).transform((v) => v.replace(/^@/, '')),
    ),
    facebook: opcional(z.string().trim().max(120)),

    acepto_terminos: z.literal(true, {
      error: 'Debés aceptar los términos y condiciones',
    }),
    acepto_habeas_data: z.literal(true, {
      error: 'Debés autorizar el tratamiento de datos',
    }),
  })
  .refine(
    (d) => Boolean(d.whatsapp || d.telefono || d.correo || d.instagram || d.facebook),
    {
      message: 'Dejá al menos una forma de que te contacten',
      path: ['whatsapp'],
    },
  );

export type PortafolioInput = z.infer<typeof portafolioSchema>;

/**
 * Arma el objeto a validar desde el FormData de la server action.
 * Vive acá, al lado del schema, para que agregar un campo sea un solo archivo.
 */
export function desdeFormData(formData: FormData) {
  const texto = (k: string) => (formData.get(k) ?? '').toString();
  const numero = (k: string) => {
    const v = formData.get(k);
    if (v === null || v === '') return undefined; // undefined dispara invalid_type_error
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  return {
    nombre: texto('nombre'),
    descripcion: texto('descripcion'),
    categoria_id: texto('categoria_id'),
    direccion: texto('direccion'),
    barrio: texto('barrio'),
    latitud: numero('latitud'),
    longitud: numero('longitud'),
    whatsapp: texto('whatsapp'),
    telefono: texto('telefono'),
    correo: texto('correo'),
    instagram: texto('instagram'),
    facebook: texto('facebook'),
    acepto_terminos: formData.get('acepto_terminos') === 'on',
    acepto_habeas_data: formData.get('acepto_habeas_data') === 'on',
  };
}
