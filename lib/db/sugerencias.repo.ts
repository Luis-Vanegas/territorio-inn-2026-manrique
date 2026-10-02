import 'server-only';
import { sql } from './neon';

/**
 * Sugeridor de categoría (migración 032, `sugerencias_categoria`). Guarda qué
 * categoría infirió el modelo y si la persona la aceptó. Sin FK a `portafolios`
 * ni ningún otro identificador, y la fecha se guarda truncada al DÍA (no la hora
 * exacta), para que la fila no se pueda cruzar con un registro por el instante en
 * que se creó. NUNCA el texto que se escribió. Lo que NO se garantiza: con muy
 * poco volumen, categoría + día + confianza podrían coincidir con un solo
 * registro de ese día; es telemetría agregada, no se publica ni se expone fila a fila.
 */
export async function guardarSugerenciaCategoria(datos: {
  categoria_inferida: string;
  confianza: number;
  aceptada: boolean | null;
  origen?: 'registro' | 'busqueda';
}): Promise<void> {
  await sql`
    insert into sugerencias_categoria (categoria_inferida, confianza, origen, aceptada, creado_en)
    values (
      ${datos.categoria_inferida},
      ${Math.round(datos.confianza * 1000) / 1000},
      ${datos.origen ?? 'registro'},
      ${datos.aceptada},
      date_trunc('day', now())
    )
  `;
}
