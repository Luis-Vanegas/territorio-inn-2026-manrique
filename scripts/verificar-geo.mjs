#!/usr/bin/env node
/**
 * Self-check de la validación geométrica.
 *
 *   node --experimental-strip-types scripts/verificar-geo.mjs
 *
 * Si esto falla, el módulo o rechaza emprendimientos legítimos de Manrique,
 * o deja entrar negocios de otra comuna. Las dos cosas rompen el proyecto.
 *
 * Dos implementaciones se contrastan: la de referencia con turf (abajo) y la
 * real, lib/geo/dentroDeManrique.ts (la que usa el schema del registro, con
 * tolerancia de borde). Para puntos lejos del borde tienen que coincidir.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { dentroDeManrique, metrosAlBorde, TOLERANCIA_BORDE_M } from '../lib/geo/dentroDeManrique.ts';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const geo = JSON.parse(readFileSync(join(RAIZ, 'lib/geo/manrique.json'), 'utf8'));

const [minLng, minLat, maxLng, maxLat] = geo.bbox;

function dentro(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) return false;
  const pt = point([lng, lat]);
  return geo.features.some((f) => booleanPointInPolygon(pt, f));
}

const [lngCentro, latCentro] = geo.metadata.centro;

const CASOS = [
  // Dentro
  ['centroide de la comuna',            latCentro,  lngCentro,  true],
  ['Manrique Central aprox',            6.2755,     -75.5455,   true],

  // Fuera — otras zonas de Medellín
  ['Centro de Medellín (La Candelaria)', 6.2518,    -75.5636,   false],
  ['El Poblado',                         6.2087,    -75.5679,   false],
  ['Robledo',                            6.2790,    -75.5900,   false],

  // Fuera — lejos
  ['Bogotá',                             4.7110,    -74.0721,   false],
  ['Buenos Aires',                     -34.6037,    -58.3816,   false],

  // Esquinas del bbox: por definición fuera del polígono, que no es rectangular.
  // Este es el caso que atrapa una validación hecha solo con bbox.
  ['esquina SO del bbox',               minLat,     minLng,     false],
  ['esquina NE del bbox',               maxLat,     maxLng,     false],

  // Entradas basura
  ['NaN',                               NaN,        NaN,        false],
  ['Infinity',                          Infinity,   0,          false],
  ['null coords',                       null,       null,       false],
  ['isla nula (0,0)',                   0,          0,          false],

  // Coordenadas invertidas: el error clásico de GeoJSON.
  // Manrique está en (6.27, -75.54); si alguien pasa (-75.54, 6.27) debe fallar.
  ['lat/lng invertidos',              -75.5453,      6.2731,     false],
];

// Casos del registro: lo que la validación del schema deja pasar o rechaza.
// [nombre, lat, lng, esperado]
const REGISTRO = [
  ['centro de Manrique',                          latCentro, lngCentro, true],
  ['Manrique Central aprox',                      6.2755,    -75.5455,  true],
  ['aliado fuera 1 (reportado, ~5 km al oeste)',  6.269732,  -75.602560, false],
  ['aliado fuera 2 (reportado, ~4,7 km al oeste)', 6.281950, -75.595519, false],
  ['aliado fuera 3 (reportado, borde occidental)', 6.276003, -75.554997, false],
  ['Aranjuez (Comuna 4)',                         6.2950,    -75.5570,  false],
  ['Robledo',                                     6.2790,    -75.5900,  false],
  ['NaN',                                         NaN,       -75.5455,  false],
];

let fallos = 0;

console.log('dentroDeManrique (la del schema, tolerancia ' + TOLERANCIA_BORDE_M + ' m):');
for (const [nombre, lat, lng, esperado] of REGISTRO) {
  const obtenido = dentroDeManrique(lat, lng);
  const ok = obtenido === esperado;
  if (!ok) fallos++;
  console.log(
    `  ${ok ? 'ok   ' : 'FALLO'} ${esperado ? 'dentro ' : 'fuera  '} ${nombre}  (a ${Math.round(metrosAlBorde(lat, lng))} m del borde)`,
  );
}

// Contraste con turf: lo que turf da por dentro, el punto-en-polígono propio
// también (la tolerancia solo puede AGREGAR puntos, nunca quitarlos), y lo que
// turf da fuera a más de la tolerancia, también fuera.
const [x0, y0, x1, y1] = geo.bbox;
let discrepancias = 0;
for (let i = 0; i < 4000; i++) {
  const lng = x0 - 0.002 + Math.random() * (x1 - x0 + 0.004);
  const lat = y0 - 0.002 + Math.random() * (y1 - y0 + 0.004);
  const turf = geo.features.some((f) => booleanPointInPolygon(point([lng, lat]), f));
  const propio = dentroDeManrique(lat, lng);
  if ((turf && !propio) || (!turf && propio && metrosAlBorde(lat, lng) > TOLERANCIA_BORDE_M)) {
    discrepancias++;
  }
}
if (discrepancias > 0) fallos++;
console.log(`  ${discrepancias === 0 ? 'ok   ' : 'FALLO'} contraste con turf en 4000 puntos aleatorios: ${discrepancias} discrepancias
`);

for (const [nombre, lat, lng, esperado] of CASOS) {
  const obtenido = dentro(lat, lng);
  const ok = obtenido === esperado;
  if (!ok) fallos++;
  console.log(
    `  ${ok ? 'ok   ' : 'FALLO'} ${esperado ? 'dentro ' : 'fuera  '} ${nombre}` +
      (ok ? '' : `  (dio ${obtenido})`),
  );
}

console.log(
  fallos === 0
    ? `\n${CASOS.length}/${CASOS.length} correctos.`
    : `\n${fallos} de ${CASOS.length} fallaron.`,
);
process.exit(fallos === 0 ? 0 : 1);
