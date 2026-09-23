#!/usr/bin/env node
/**
 * Comprueba que solo JPEG, PNG y WebP lleguen a sharp.
 *
 *   node --experimental-strip-types scripts/verificar-formato-imagen.mjs
 *
 * Nació de GHSA-2xp9-vwfh-vxw4 (sep. 2026): el tipo que declara el navegador
 * se falsifica, y sharp decide el decodificador por el contenido — un AVIF
 * disfrazado de JPEG llegaba a libheif. Las imágenes de prueba se generan con
 * el mismo sharp, no se escriben a mano: así se prueba contra archivos reales.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

import { esFormatoPermitido } from '../lib/blob/formatoImagen.ts';

const base = sharp({ create: { width: 8, height: 8, channels: 3, background: '#3c8af6' } });
const casos = [
  ['JPEG real', await base.clone().jpeg().toBuffer(), true],
  ['PNG real', await base.clone().png().toBuffer(), true],
  ['WebP real', await base.clone().webp().toBuffer(), true],
  ['foto del sitio (public/fotos)', readFileSync('public/fotos/manrique-iglesia.jpg'), true],
  ['AVIF real', await base.clone().avif().toBuffer(), false],
  ['GIF real', await base.clone().gif().toBuffer(), false],
  ['RIFF que no es WebP (WAV)', Buffer.from('RIFF\0\0\0\0WAVEfmt '), false],
  ['texto con extensión .jpg', Buffer.from('esto no es una imagen'), false],
  ['vacío', Buffer.alloc(0), false],
  ['JPEG truncado a 2 bytes', Buffer.from([0xff, 0xd8]), false],
];

let fallos = 0;
for (const [nombre, bytes, esperado] of casos) {
  const ok = esFormatoPermitido(bytes) === esperado;
  if (!ok) fallos++;
  console.log(`  ${ok ? 'ok' : '✗ '}   ${esperado ? 'acepta ' : 'rechaza'}  ${nombre}`);
}

// El caso del aviso, tal cual: un AVIF que declara ser JPEG. Lo que declara no
// importa — la decisión sale de los bytes.
const disfrazado = new File([await base.clone().avif().toBuffer()], 'foto.jpg', { type: 'image/jpeg' });
assert.equal(disfrazado.type, 'image/jpeg');
assert.equal(esFormatoPermitido(new Uint8Array(await disfrazado.arrayBuffer())), false, 'AVIF disfrazado de JPEG');
console.log('  ok   rechaza  AVIF declarado como image/jpeg');

assert.equal(fallos, 0, `${fallos} caso(s) fallaron`);
console.log(`\n${casos.length + 1}/${casos.length + 1} correctos.`);
