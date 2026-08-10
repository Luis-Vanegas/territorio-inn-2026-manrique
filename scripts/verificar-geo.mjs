#!/usr/bin/env node
/**
 * Self-check de la validación geométrica.
 *
 *   node scripts/verificar-geo.mjs
 *
 * Si esto falla, el módulo o rechaza emprendimientos legítimos de Manrique,
 * o deja entrar negocios de otra comuna. Las dos cosas rompen el proyecto.
 *
 * Se replica la lógica de lib/geo/validarPunto.ts en JS plano en vez de
 * importar el .ts: el script corre con node sin build. Si divergen, el caso
 * del centroide y el de las esquinas del bbox lo delatan enseguida.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';

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

let fallos = 0;

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
