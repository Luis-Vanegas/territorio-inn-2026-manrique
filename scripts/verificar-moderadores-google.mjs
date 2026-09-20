#!/usr/bin/env node
/**
 * Comprueba quién cuenta como moderador por Google.
 *
 *   node --experimental-strip-types scripts/verificar-moderadores-google.mjs
 *
 * Es la puerta al panel de moderación: el caso que importa no es que el
 * moderador entre, sino que NADIE más lo haga. Por eso la mayoría de los casos
 * son negativos.
 */
import assert from 'node:assert/strict';
import { esModeradorGoogle } from '../lib/auth/moderadoresGoogle.ts';

const MIO = '104512345678901234567';

const casos = [
  // [descripción, sub, lista, esperado]
  ['sin variable: nadie entra', MIO, undefined, false],
  ['variable vacía: nadie entra', MIO, '', false],
  ['solo comas y espacios: nadie entra', MIO, ' , ,, ', false],
  ['un solo sub, coincide', MIO, MIO, true],
  ['varios subs, coincide el segundo', MIO, `999, ${MIO} ,111`, true],
  ['otro sub no entra', '999999', MIO, false],
  ['un prefijo NO coincide', MIO.slice(0, 10), MIO, false],
  ['una extensión NO coincide', `${MIO}0`, MIO, false],
  ['sub vacío nunca entra, aunque la lista tenga huecos', '', `${MIO},,`, false],
  ['el correo no sirve de llave', 'luis@gmail.com', MIO, false],
];

for (const [descripcion, sub, lista, esperado] of casos) {
  assert.equal(esModeradorGoogle(sub, lista), esperado, descripcion);
}

console.log(`moderadores por Google: ${casos.length}/${casos.length} OK — solo entra un sub que esté en la lista`);
