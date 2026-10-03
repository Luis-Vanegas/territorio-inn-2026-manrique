#!/usr/bin/env node
/**
 * Comprueba que el destino de retorno del ingreso sea siempre una ruta interna.
 *
 *   node --experimental-strip-types scripts/verificar-destino.mjs
 *
 * Es lo que evita un open redirect: `/api/auth/google/iniciar?destino=...` y el
 * campo oculto del login de moderación pasan por `rutaInterna`, y lo que no es
 * una ruta del propio sitio se descarta.
 */
import assert from 'node:assert/strict';
import { puertaDe, rutaInterna } from '../lib/auth/destino.ts';

for (const bueno of ['/', '/firmamento/negocio', '/firmamento/equipo', '/firmamento/entidad', '/firmamento/negocio/clientes']) {
  assert.equal(rutaInterna(bueno), bueno, `acepta ${bueno}`);
}

const malos = [
  '//evil.com',
  '///evil.com',
  '/\\evil.com',
  '\\\\evil.com',
  'https://evil.com',
  'http://evil.com/firmamento/negocio',
  'javascript:alert(1)',
  'firmamento/negocio',
  '/firmamento/../admin',
  '/firmamento/negocio?x=1',
  '/firmamento/negocio#a',
  '/firmamento/negocio\n',
  '/firmamento/%2e%2e/admin',
  '/' + 'a'.repeat(300),
  '',
  null,
  undefined,
  42,
  ['/firmamento/negocio'],
];
for (const malo of malos) {
  assert.equal(rutaInterna(malo), null, `rechaza ${JSON.stringify(malo)}`);
}

assert.equal(puertaDe('/firmamento/entidad'), '/firmamento/entrar');
assert.equal(puertaDe('/aliados/registro'), '/entrar');
assert.equal(puertaDe(null), '/entrar');

console.log('destino: OK — solo rutas internas; el resto se descarta');
