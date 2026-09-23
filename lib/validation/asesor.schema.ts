import { z } from 'zod';

/**
 * La pregunta al asesor. Una sola definición para las tres puertas: la del
 * negocio (`consultarAsesor`), la del vecino con sesión de Google
 * (`consultarAsesorUsuario`) y la de moderación (`consultarAsesorAdmin`).
 *
 * Vive acá y no en las actions porque un archivo `'use server'` solo puede
 * exportar funciones async: un schema exportado desde ahí no compila.
 */
export const preguntaSchema = z
  .string()
  .trim()
  .min(5, 'Escribe tu pregunta con un poco más de detalle')
  .max(500, 'Máximo 500 caracteres');

/**
 * Estado del formulario del asesor, el que devuelven las tres Server Actions y
 * lee `components/Asesor`.
 *
 * Vive acá, con el schema, porque es el contrato que cruza la frontera: los dos
 * lados lo necesitan y este archivo es el único de la familia del asesor que no
 * es `server-only` ni un endpoint. Estuvo dentro de `consultarAsesor.ts` y eso
 * dejaba a las otras dos puertas importando un tipo desde un endpoint ajeno.
 */
export type EstadoAsesor =
  | { estado: 'inicial' }
  | { estado: 'ok'; pregunta: string; respuesta: string }
  | { estado: 'error'; mensaje: string };
