#!/usr/bin/env node
/**
 * Comprueba los atributos de las cookies de sesión.
 *
 *   node --experimental-strip-types scripts/verificar-cookies.mjs
 *
 * Nació de un error que solo existía en producción: las cookies `__Host-…` se
 * borraban con un `Set-Cookie` sin `Secure`, el navegador lo rechazaba en
 * silencio y «Cerrar sesión» no cerraba nada. En local no se ve, porque allí
 * la cookie no lleva prefijo.
 *
 * Lo que se prueba es la regla del navegador para `__Host-`: para crear Y para
 * borrar hacen falta `Secure`, `Path=/` y ningún `Domain`.
 */
import assert from 'node:assert/strict';
import { opcionesBorrado, opcionesCookie } from '../lib/auth/cookies.ts';

for (const produccion of [true, false]) {
  const crear = opcionesCookie(produccion);
  const borrar = opcionesBorrado(produccion);
  const donde = produccion ? 'producción' : 'local';

  assert.equal(crear.secure, produccion, `${donde}: Secure al crear`);
  assert.equal(borrar.secure, produccion, `${donde}: Secure también al BORRAR (el bug de __Host-)`);
  assert.equal(borrar.path, '/', `${donde}: Path=/ al borrar`);
  assert.equal(crear.path, '/', `${donde}: Path=/ al crear`);
  assert.equal(borrar.maxAge, 0, `${donde}: borrar expira de inmediato`);
  assert.equal(borrar.httpOnly, true, `${donde}: httpOnly al borrar`);
  assert.ok(!('domain' in crear) && !('domain' in borrar), `${donde}: sin Domain (lo prohíbe __Host-)`);
  // El borrado es la creación con maxAge 0: nada más ni nada menos.
  assert.deepEqual({ ...borrar, maxAge: undefined }, { ...crear, maxAge: undefined }, `${donde}: mismos atributos`);
}

console.log('cookies: OK — crear y borrar llevan los mismos atributos (Secure en producción)');
