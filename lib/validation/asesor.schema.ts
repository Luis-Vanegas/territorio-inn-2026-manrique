import { z } from 'zod';

/**
 * La pregunta al asesor. Una sola definición para las dos puertas: la del
 * negocio (`consultarAsesor`) y la de moderación (`consultarAsesorAdmin`).
 *
 * Vive acá y no en las actions porque un archivo `'use server'` solo puede
 * exportar funciones async: un schema exportado desde ahí no compila.
 */
export const preguntaSchema = z
  .string()
  .trim()
  .min(5, 'Escribe tu pregunta con un poco más de detalle')
  .max(500, 'Máximo 500 caracteres');
