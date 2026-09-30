#!/usr/bin/env node
/**
 * Comprueba el límite en memoria de `lib/limiteMemoria.ts`.
 *
 *   node --experimental-strip-types scripts/verificar-limite-memoria.mjs
 *
 * No toca la base ni la red: es una función pura con reloj inyectable.
 */

import assert from 'node:assert/strict';
import { excedeLimite } from '../lib/limiteMemoria.ts';

const T = 1_000_000;

for (let i = 1; i <= 3; i++) {
  assert.equal(excedeLimite('1.1.1.1', 3, 60_000, T), false, `llamada ${i} dentro del cupo`);
}
assert.equal(excedeLimite('1.1.1.1', 3, 60_000, T + 1), true, 'la cuarta pasa el tope');
assert.equal(excedeLimite('2.2.2.2', 3, 60_000, T + 1), false, 'otra IP tiene su propio cupo');
assert.equal(excedeLimite('1.1.1.1', 3, 60_000, T + 60_001), false, 'la ventana vencida libera el cupo');
assert.equal(excedeLimite(null, 1, 60_000, T), false, 'sin IP no se limita');
assert.equal(excedeLimite(null, 1, 60_000, T), false, 'ni en la segunda llamada');

console.log('✓ limite-memoria: 6 comprobaciones');
