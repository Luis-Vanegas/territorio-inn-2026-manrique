#!/usr/bin/env node
/**
 * Comprueba la lógica del indicador de entorno.
 *
 *   node --experimental-strip-types scripts/verificar-entorno.mjs
 *
 * Por qué existe una prueba para diez líneas: el caso que importa es el que no
 * se puede ver mirando el sitio. En local el indicador aparece siempre, así que
 * abrir el navegador confirma el caso fácil y deja sin probar el único que
 * duele — que en PRODUCCIÓN no se renderice. Si esa condición se invierte
 * alguna vez, el sitio real le muestra a todo el mundo un cartel que dice
 * "PREPRODUCCIÓN", y nadie se entera hasta que un tercero lo reporta.
 *
 * Sin framework de tests a propósito: el proyecto no tiene uno, y traer uno
 * para esto sería desproporcionado. `assert` viene con Node.
 */
import assert from 'node:assert/strict';
import { entornoDesde, debeMostrarIndicador } from '../lib/entorno.ts';

const casos = [
  ['production', 'produccion', false],
  ['preview', 'preproduccion', true],
  ['development', 'local', true],
  [undefined, 'local', true],
  ['valor-inesperado', 'local', true],
];

for (const [vercelEnv, esperado, muestra] of casos) {
  const obtenido = entornoDesde(vercelEnv);
  assert.equal(
    obtenido,
    esperado,
    `VERCEL_ENV=${String(vercelEnv)} debería mapear a "${esperado}", dio "${obtenido}"`,
  );
  assert.equal(
    debeMostrarIndicador(obtenido),
    muestra,
    `con VERCEL_ENV=${String(vercelEnv)} el indicador ${muestra ? 'SÍ' : 'NO'} debería mostrarse`,
  );
}

console.log(`entorno: ${casos.length * 2}/${casos.length * 2} OK — en producción el indicador no se renderiza`);
