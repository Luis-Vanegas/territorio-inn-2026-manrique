import evaluacionJson from '@/public/firmamento/modelo_evaluacion.json';

/**
 * Evaluación del sugeridor de categoría: F1 por categoría y matriz de confusión
 * del holdout agrupado por nombre. Sale de `public/firmamento/modelo_evaluacion.json`,
 * que genera `scripts/exportar-evaluacion-modelo.mjs` a partir de
 * `pipeline/reporte_modelo.md`; ninguna cifra se escribe a mano.
 *
 * Se importa solo en el servidor (las páginas) y los componentes reciben lo que
 * necesitan por props: así el JSON no viaja al navegador.
 */

export type ClaseEvaluada = {
  id: string;
  nombre: string;
  precision: number;
  recall: number;
  f1: number;
  soporte: number;
};

export type EvaluacionModelo = {
  fuente: string;
  datos: string;
  fecha_corrida: string;
  holdout: string;
  n_holdout: number;
  f1_macro: number;
  clases: ClaseEvaluada[];
  /** Filas = categoría real, columnas = predicha, mismo orden que `clases`. */
  matriz: number[][];
};

export const EVALUACION = evaluacionJson as unknown as EvaluacionModelo;
