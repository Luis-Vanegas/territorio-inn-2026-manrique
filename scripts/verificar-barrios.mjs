#!/usr/bin/env node
/**
 * Self-check de los barrios oficiales (lib/geo/barrios-manrique.json y barrioDe).
 *
 *   node --experimental-strip-types scripts/verificar-barrios.mjs
 *
 * Sin base de datos. Falla si:
 *  - los nombres del JSON no son exactamente los de BARRIOS_COMUNA_3 (el selector
 *    del registro y `portafolios.barrio` guardan esa grafía; una distinta rompe
 *    el aviso de «barrio no coincide» y el conteo de /api/datos);
 *  - el centroide de un barrio no cae en su barrio;
 *  - barrioDe da otra cosa en tres puntos conocidos;
 *  - la unión de los barrios deja de cubrir la comuna;
 *  - el `barrio` que escribió el pipeline no coincide con barrioDe (dos
 *    implementaciones, shapely y ray casting, que tienen que decir lo mismo).
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { barrioDe } from '../lib/geo/barrioOficial.ts';
import { anillosDe, dentroDeAnillos } from '../lib/geo/puntoEnPoligono.ts';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (ruta) => readFileSync(join(RAIZ, ruta), 'utf8');

const barrios = JSON.parse(leer('lib/geo/barrios-manrique.json'));
const comuna = JSON.parse(leer('lib/geo/manrique.json'));

// BARRIOS_COMUNA_3 sale del texto de constantes.ts: importarlo arrastra manrique.json
// sin `with { type: 'json' }`, que strip-types no resuelve.
const bloque = /export const BARRIOS_COMUNA_3: string\[\] = \[([\s\S]*?)\];/.exec(leer('lib/geo/constantes.ts'));
assert.ok(bloque, 'no se encontró BARRIOS_COMUNA_3 en constantes.ts');
const oficiales = [...bloque[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
assert.equal(oficiales.length, 15, 'BARRIOS_COMUNA_3 tiene 15 barrios');

// ── 1. Metadata y nombres ──
assert.ok(barrios.metadata?.fuente, 'metadata.fuente presente');
assert.equal(barrios.features.length, 15, '15 barrios');
const nombres = barrios.features.map((f) => f.properties.nombre);
assert.deepEqual([...nombres].sort(), [...oficiales].sort(), 'los 15 nombres son los de BARRIOS_COMUNA_3');
assert.deepEqual(
  barrios.features.map((f) => f.properties.codigo),
  Array.from({ length: 15 }, (_, i) => String(301 + i)),
  'códigos 301–315',
);

// ── 2. Centroide de cada barrio dentro de su barrio ──
// Centroide por área del anillo mayor; un barrio muy cóncavo podría dejarlo
// fuera, y entonces este verificador lo dice en vez de esconderlo.
function centroide(geometria) {
  const anillo = anillosDe(geometria).reduce((a, b) => (a.length >= b.length ? a : b));
  let area2 = 0, cx = 0, cy = 0;
  for (let i = 0; i < anillo.length - 1; i++) {
    const [x0, y0] = anillo[i];
    const [x1, y1] = anillo[i + 1];
    const cruz = x0 * y1 - x1 * y0;
    area2 += cruz;
    cx += (x0 + x1) * cruz;
    cy += (y0 + y1) * cruz;
  }
  return [cx / (3 * area2), cy / (3 * area2)];
}
for (const f of barrios.features) {
  const [lng, lat] = centroide(f.geometry);
  assert.equal(barrioDe(lat, lng), f.properties.nombre, `el centroide de ${f.properties.nombre} cae en ${barrioDe(lat, lng)}`);
}

// ── 3. Puntos conocidos ──
const [lngCentro, latCentro] = comuna.metadata.centro;
const CASOS = [
  // Los dos esperados se contrastaron aparte con shapely (covers), no con barrioDe.
  ['centro de la comuna', latCentro, lngCentro, 'Santa Inés'],
  ['punto de verificar-geo (6,2755; -75,5455)', 6.2755, -75.5455, 'Las Granjas'],
  ['Aranjuez (Comuna 4), fuera', 6.295, -75.557, null],
  ['centro de Medellín, fuera', 6.2518, -75.5636, null],
  ['lat/lng inválidos', NaN, NaN, null],
];
for (const [nombre, lat, lng, esperado] of CASOS) {
  assert.equal(barrioDe(lat, lng), esperado, `${nombre}: ${barrioDe(lat, lng)} != ${esperado}`);
}

// ── 4. Los barrios cubren la comuna (malla de ~22 m) ──
{
  const paso = 0.0002;
  const anillosComuna = comuna.features.flatMap((f) => anillosDe(f.geometry));
  const [x0, y0, x1, y1] = comuna.bbox;
  let enComuna = 0, conBarrio = 0;
  for (let y = y0; y <= y1; y += paso) {
    for (let x = x0; x <= x1; x += paso) {
      if (!dentroDeAnillos(anillosComuna, y, x)) continue;
      enComuna++;
      if (barrioDe(y, x)) conBarrio++;
    }
  }
  const pct = (100 * conBarrio) / enComuna;
  assert.ok(pct >= 99.5, `los barrios cubren ${pct.toFixed(2)} % de la comuna (mínimo 99,5 %)`);
  console.log(`cobertura de la comuna por los barrios: ${pct.toFixed(2)} % (${enComuna} puntos de malla)`);
}

// ── 5. El barrio del pipeline coincide con barrioDe ──
{
  const datos = JSON.parse(leer('public/firmamento/constelaciones.json'));
  const todos = [...datos.constelaciones.flatMap((c) => c.estrellas), ...datos.puntos_sueltos];
  for (const e of todos) {
    assert.ok('barrio' in e, `${e.osm} sin campo barrio: falta regenerar con pipeline/02_constelaciones.py`);
    assert.equal(e.barrio, barrioDe(e.lat, e.lon), `${e.osm}: el JSON dice ${e.barrio}, barrioDe dice ${barrioDe(e.lat, e.lon)}`);
  }
  console.log(`barrio del pipeline coincide con barrioDe en ${todos.length} comercios`);
}

console.log(`ok: 15 barrios, nombres de BARRIOS_COMUNA_3, ${CASOS.length} puntos conocidos`);
