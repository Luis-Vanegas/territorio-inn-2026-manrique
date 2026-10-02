#!/usr/bin/env node
/**
 * Comprueba a qué constelación de OSM pertenece un punto (`constelacionDe` y
 * `vecinosDeConstelacion` de lib/geo/comerciosOsm.ts), lo que alimenta «Otros
 * negocios de tu constelación» en la ficha de un aliado.
 *
 *   node --experimental-strip-types scripts/verificar-constelacion.mjs
 *
 * No toca la base ni la red: funciones puras sobre un caso sintético y sobre
 * public/firmamento/constelaciones.json.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { constelacionDe, vecinosDeConstelacion } from '../lib/geo/comerciosOsm.ts';

const datos = JSON.parse(readFileSync(new URL('../public/firmamento/constelaciones.json', import.meta.url), 'utf8'));

// ~1 m en grados de latitud (111,32 km por grado).
const M = 1 / 111_320;

// ── Caso sintético: la regla es «el centroide más cercano, y dentro de su p90» ──
const a = { id: 'a', centroide: { lat: 6.26, lon: -75.54 }, radio_p90_m: 100, estrellas: [] };
const b = { id: 'b', centroide: { lat: 6.26 + 150 * M, lon: -75.54 }, radio_p90_m: 100, estrellas: [] };

assert.equal(constelacionDe({ lat: 6.26, lon: -75.54 }, [a, b])?.id, 'a', 'en el centroide');
assert.equal(constelacionDe({ lat: 6.26 + 99 * M, lon: -75.54 }, [a, b])?.id, 'b', 'a 99 m de A pero a 51 m de B: gana el más cercano');
assert.equal(constelacionDe({ lat: 6.26 - 99 * M, lon: -75.54 }, [a, b])?.id, 'a', 'dentro del radio, lejos de B');
assert.equal(constelacionDe({ lat: 6.26 - 101 * M, lon: -75.54 }, [a, b]), null, 'a 101 m: fuera del p90');
assert.equal(constelacionDe({ lat: 6.26, lon: -75.54 }, []), null, 'sin constelaciones');
// Caso borde de la regla: dentro del radio de A, pero el centroide más cercano es B y B no lo cubre.
const c = { ...a, radio_p90_m: 200 };
const d = { ...b, centroide: { lat: 6.26 + 120 * M, lon: -75.54 }, radio_p90_m: 10 };
assert.equal(constelacionDe({ lat: 6.26 + 70 * M, lon: -75.54 }, [c, d]), null, 'el más cercano (D) no lo cubre: no cae en ninguna');

// ── Datos reales ──
assert.ok(datos.constelaciones.length > 0, 'el JSON trae constelaciones');
let probadas = 0;
for (const k of datos.constelaciones) {
  // El centroide de una constelación es de esa constelación.
  assert.equal(constelacionDe(k.centroide, datos.constelaciones)?.id, k.id, `centroide de ${k.id}`);

  // Una estrella de la constelación a menos de su p90 del centroide cae en ella.
  const v = vecinosDeConstelacion(k.centroide, datos);
  assert.ok(v, `vecinos de ${k.id}`);
  assert.equal(v.constelacion.id, k.id);
  assert.ok(v.comercios.length <= 5, `${k.id}: máximo 5`);
  assert.ok(v.total >= v.comercios.length, `${k.id}: total coherente`);
  // Sin el nombre del aliado: solo se descartan los que están a ≤ 25 m del punto.
  const lejanos = k.estrellas.filter(
    (e) => e.nombre?.trim() && Math.hypot((e.lat - k.centroide.lat) * 111_320, (e.lon - k.centroide.lon) * 111_320 * Math.cos((k.centroide.lat * Math.PI) / 180)) > 25,
  );
  assert.equal(v.total, lejanos.length, `${k.id}: total = comercios con nombre a más de 25 m`);
  for (const { comercio } of v.comercios) {
    assert.ok(comercio.nombre?.trim(), `${k.id}: un comercio sin nombre se coló`);
    assert.ok(k.estrellas.some((e) => e.osm === comercio.osm), `${k.id}: comercio de otra constelación`);
  }
  for (let i = 1; i < v.comercios.length; i++) {
    assert.ok(v.comercios[i - 1].metros <= v.comercios[i].metros, `${k.id}: orden por cercanía`);
  }
  probadas++;
}

// ── El propio aliado no se lista como «otro» negocio ──
{
  const k = datos.constelaciones.find((x) => x.estrellas.filter((e) => e.nombre?.trim()).length >= 3);
  const conNombre = k.estrellas.filter((e) => e.nombre?.trim());
  const yo = conNombre[0];
  const punto = { lat: yo.lat, lon: yo.lon };

  // A ≤ 25 m (aquí, exactamente encima): fuera, aunque el nombre sea otro.
  const porDistancia = vecinosDeConstelacion(punto, datos, 100, 'Un nombre que no existe');
  assert.ok(porDistancia, 'el punto cae en su constelación');
  assert.ok(!porDistancia.comercios.some((v) => v.comercio.osm === yo.osm), 'comercio a 0 m excluido');
  assert.ok(porDistancia.comercios.every((v) => v.metros > 25), 'ninguno a ≤ 25 m');

  // Mismo nombre normalizado (mayúsculas y tildes no cuentan), aunque esté lejos del punto.
  const otro = conNombre.find((e) => e.osm !== yo.osm && Math.hypot(e.lat - yo.lat, e.lon - yo.lon) * 111_320 > 25);
  const alterado = otro.nombre.toUpperCase().normalize('NFD').replace(/\p{M}/gu, '');
  const porNombre = vecinosDeConstelacion(punto, datos, 100, `  ${alterado} `);
  assert.ok(!porNombre.comercios.some((v) => v.comercio.osm === otro.osm), 'mismo nombre normalizado excluido');
  assert.ok(porNombre.total < conNombre.length, 'total descuenta a los excluidos');
}

// Lejos de todas (centro de Medellín, a kilómetros de Manrique): no se muestra la sección.
assert.equal(constelacionDe({ lat: 6.2442, lon: -75.5812 }, datos.constelaciones), null, 'centro de Medellín');
assert.equal(vecinosDeConstelacion({ lat: 6.2442, lon: -75.5812 }, datos), null, 'sin sección fuera de las constelaciones');

console.log(`ok: regla del centroide más cercano y ${probadas} constelaciones reales`);
