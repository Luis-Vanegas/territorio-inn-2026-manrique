#!/usr/bin/env node
/**
 * Exporta a JSON la evaluación del sugeridor de categoría que hoy solo está en
 * `pipeline/reporte_modelo.md`: F1 por categoría y matriz de confusión.
 *
 *   node scripts/exportar-evaluacion-modelo.mjs
 *
 * Escribe `public/firmamento/modelo_evaluacion.json`, que leen `/firmamento` y
 * el panel del equipo (`equipo/modelos`) para dibujar las barras y la matriz. Las
 * cifras salen del reporte que genera `pipeline/03_clasificador.py` (holdout
 * agrupado por nombre) y se leen del texto: ninguna se copia a mano.
 *
 * Cuando se vuelva a correr el clasificador, correr esto después;
 * `scripts/verificar-evaluacion-modelo.mjs` (dentro de `npm run verificar`)
 * falla si el JSON quedó viejo respecto del reporte.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const RUTA_REPORTE = join(RAIZ, 'pipeline', 'reporte_modelo.md');
export const RUTA_MODELO = join(RAIZ, 'public', 'modelo_categoria.json');
export const RUTA_SALIDA = join(RAIZ, 'public', 'firmamento', 'modelo_evaluacion.json');

/** Las filas de datos de la tabla markdown que sigue al encabezado `titulo`. */
function tablaDe(texto, titulo) {
  const inicio = texto.indexOf(titulo);
  if (inicio < 0) throw new Error(`el reporte no tiene «${titulo}»`);
  const filas = [];
  for (const linea of texto.slice(inicio + titulo.length).split('\n').slice(1)) {
    if (!linea.startsWith('|')) {
      if (filas.length) break;
      continue;
    }
    filas.push(linea.split('|').slice(1, -1).map((c) => c.trim()));
  }
  // filas[0] = encabezado, filas[1] = separador `---`.
  return { cabeza: filas[0], cuerpo: filas.slice(2) };
}

/** Arma el objeto de evaluación a partir del texto del reporte y del modelo publicado. */
export function construirEvaluacion(reporte, modelo) {
  const fecha = /Fecha de corrida: (\S+)/.exec(reporte)?.[1];
  const n = /(\d+) locales, ningún nombre visto/.exec(reporte)?.[1];
  const f1Macro = /\*\*TF-IDF[^|]*\*\* \| \*\*([\d.]+)\*\*/.exec(reporte)?.[1];
  if (!fecha || !n || !f1Macro) throw new Error('no se pudo leer fecha, tamaño del holdout o F1 macro del reporte');

  const porClase = tablaDe(reporte, '## Detalle por categoría').cuerpo;
  const matriz = tablaDe(reporte, '## Matriz de confusión').cuerpo;

  const clases = porClase.map(([id, precision, recall, f1, soporte]) => {
    const i = modelo.clases.indexOf(id);
    if (i < 0) throw new Error(`categoría «${id}» del reporte no está en el modelo`);
    return {
      id,
      nombre: modelo.nombres[i],
      precision: Number(precision),
      recall: Number(recall),
      f1: Number(f1),
      soporte: Number(soporte),
    };
  });

  return {
    fuente: 'pipeline/reporte_modelo.md, generado por pipeline/03_clasificador.py',
    datos: modelo.fuente,
    fecha_corrida: fecha,
    holdout:
      'Holdout estratificado y agrupado por nombre (20 % de los locales): ningún nombre del holdout se vio al entrenar.',
    n_holdout: Number(n),
    f1_macro: Number(f1Macro),
    clases,
    // Filas = categoría real, columnas = predicha; mismo orden que `clases`.
    matriz: matriz.map((fila) => fila.slice(1).map(Number)),
  };
}

function main() {
  const reporte = readFileSync(RUTA_REPORTE, 'utf8');
  const modelo = JSON.parse(readFileSync(RUTA_MODELO, 'utf8'));
  const salida = construirEvaluacion(reporte, modelo);
  writeFileSync(RUTA_SALIDA, `${JSON.stringify(salida, null, 2)}\n`, 'utf8');
  console.log(`${RUTA_SALIDA}: ${salida.clases.length} categorías, holdout de ${salida.n_holdout}, F1 macro ${salida.f1_macro}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
