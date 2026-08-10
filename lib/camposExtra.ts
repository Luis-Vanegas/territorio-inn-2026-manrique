import type { DefinicionCampo } from '@/lib/db/camposPersonalizados.repo';

export type CampoExtraFormateado = { etiqueta: string; valor: string };

/**
 * Empareja los valores guardados en `campos_extra` (por slug) con sus
 * definiciones, para mostrarlos con su etiqueta legible. Se usa tanto en la
 * tarjeta pública como en la ficha de moderación — de ahí que viva acá y no
 * copiado en los dos componentes.
 *
 * Recibe TODAS las definiciones (activas e inactivas): un registro viejo
 * puede tener un valor bajo un campo que ya se desactivó, y sigue mereciendo
 * mostrarse con su nombre en vez de perderse.
 */
export function formatearCamposExtra(
  camposExtra: Record<string, string | number | boolean>,
  definiciones: DefinicionCampo[],
): CampoExtraFormateado[] {
  const resultado: CampoExtraFormateado[] = [];

  for (const def of definiciones) {
    const valor = camposExtra[def.slug];
    if (valor === undefined || valor === null || valor === '') continue;

    resultado.push({
      etiqueta: def.etiqueta,
      valor: def.tipo === 'si_no' ? (valor ? 'Sí' : 'No') : String(valor),
    });
  }

  return resultado;
}
