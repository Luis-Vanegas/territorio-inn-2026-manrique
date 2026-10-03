#!/usr/bin/env node
/**
 * Self-check de `public/firmamento/modelo_evaluacion.json` (F1 por categoría y
 * matriz de confusión que dibuja el sitio).
 *
 *   node scripts/verificar-evaluacion-modelo.mjs
 *
 * Sin base de datos. Falla si:
 *  - el JSON no es exactamente lo que sale de volver a leer
 *    `pipeline/reporte_modelo.md` (quedó viejo: correr
 *    `node scripts/exportar-evaluacion-modelo.mjs`);
 *  - la matriz no es de 12 × 12, o no suma el tamaño del holdout, o la suma de
 *    cada fila no es el soporte de su categoría;
 *  - el F1 macro no es el del modelo publicado (el del holdout agrupado por
 *    nombre; el del split ingenuo está inflado y no se cita) o no es el promedio
 *    de los F1 por categoría;
 *  - el orden de las categorías no es el del modelo.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  construirEvaluacion,
  RUTA_MODELO,
  RUTA_REPORTE,
  RUTA_SALIDA,
} from './exportar-evaluacion-modelo.mjs';

const modelo = JSON.parse(readFileSync(RUTA_MODELO, 'utf8'));
const guardado = JSON.parse(readFileSync(RUTA_SALIDA, 'utf8'));
const esperado = construirEvaluacion(readFileSync(RUTA_REPORTE, 'utf8'), modelo);

assert.deepEqual(
  guardado,
  esperado,
  'public/firmamento/modelo_evaluacion.json no coincide con pipeline/reporte_modelo.md: correr node scripts/exportar-evaluacion-modelo.mjs',
);

const { clases, matriz, n_holdout: n, f1_macro: f1Macro } = guardado;
assert.deepEqual(
  clases.map((c) => c.id),
  modelo.clases,
  'las categorías del reporte van en el mismo orden que las del modelo',
);
assert.equal(matriz.length, clases.length, 'matriz de 12 filas');
for (const [i, fila] of matriz.entries()) {
  assert.equal(fila.length, clases.length, `la fila ${i} de la matriz tiene 12 columnas`);
  assert.equal(
    fila.reduce((a, b) => a + b, 0),
    clases[i].soporte,
    `la fila de ${clases[i].id} suma su soporte`,
  );
}
assert.equal(
  matriz.flat().reduce((a, b) => a + b, 0),
  n,
  'la matriz suma el tamaño del holdout',
);
assert.equal(n, modelo.metricas.n_holdout, 'el holdout es el del modelo publicado');
assert.ok(
  Math.abs(f1Macro - modelo.metricas.f1_macro_holdout) < 0.001,
  `F1 macro ${f1Macro} distinto del del modelo (${modelo.metricas.f1_macro_holdout})`,
);
const promedio = clases.reduce((a, c) => a + c.f1, 0) / clases.length;
assert.ok(
  Math.abs(promedio - f1Macro) < 0.002,
  `el promedio de los F1 por categoría (${promedio.toFixed(3)}) no es el F1 macro (${f1Macro})`,
);

console.log(`modelo_evaluacion.json: ${clases.length} categorías, holdout de ${n}, F1 macro ${f1Macro}. OK`);
