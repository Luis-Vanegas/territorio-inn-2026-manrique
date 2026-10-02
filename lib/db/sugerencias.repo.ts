import 'server-only';
import { sql } from './neon';

/**
 * Sugeridor de categoría (migración 032, `sugerencias_categoria`). Guarda qué
 * categoría infirió el modelo y si la persona la aceptó. Sin FK a `portafolios`
 * ni ningún otro identificador, a propósito: la fila no se puede volver a unir con
 * una persona ni con un negocio. NUNCA el texto que se escribió.
 */
export async function guardarSugerenciaCategoria(datos: {
  categoria_inferida: string;
  confianza: number;
  aceptada: boolean | null;
  origen?: 'registro' | 'busqueda';
}): Promise<void> {
  await sql`
    insert into sugerencias_categoria (categoria_inferida, confianza, origen, aceptada)
    values (
      ${datos.categoria_inferida},
      ${Math.round(datos.confianza * 1000) / 1000},
      ${datos.origen ?? 'registro'},
      ${datos.aceptada}
    )
  `;
}
