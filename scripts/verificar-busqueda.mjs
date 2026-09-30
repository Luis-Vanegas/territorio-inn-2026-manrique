#!/usr/bin/env node
/**
 * Comprueba el buscador de negocios de `lib/busqueda.ts`.
 *
 *   node --experimental-strip-types scripts/verificar-busqueda.mjs
 *
 * No toca la base ni la red: funciones puras sobre una lista de ejemplo.
 */

import assert from 'node:assert/strict';
import { buscarNegocios, relacionados, terminosDe } from '../lib/busqueda.ts';

const n = (id, nombre, categoria_id, categoria_nombre, extra = {}) => ({
  id, nombre, categoria_id, categoria_nombre, categoria_otra: null,
  descripcion: '', barrio: 'Manrique Central', productos: [], ...extra,
});

const NEGOCIOS = [
  n('1', 'Tienda Don Luis', 'tienda_viveres', 'Tienda y víveres', { descripcion: 'También vendemos arepas' }),
  n('2', 'Arepas Doña Rosa', 'comidas', 'Comidas y almuerzos', { barrio: 'La Salle' }),
  n('3', 'Barbería El Corte', 'barberia', 'Barbería'),
  n('4', 'Sazón de la 45', 'comidas', 'Comidas y almuerzos', { productos: [{ nombre: 'Bandeja paisa', precio: null }] }),
  n('5', 'Celulares Manrique', 'tecnologia_celulares', 'Tecnología y celulares', { descripcion: 'Arreglo de pantallas' }),
  n('6', 'Panadería La Espiga', 'panaderia', 'Panadería y repostería'),
];
const ids = (r) => r.resultados.map((x) => x.id);

assert.deepEqual(terminosDe('Busco una arepería en Manrique'), ['areperia', 'manrique'], 'tira palabras vacías');
assert.equal(buscarNegocios(NEGOCIOS, '   ').resultados.length, 6, 'sin términos no filtra');

assert.deepEqual(ids(buscarNegocios(NEGOCIOS, 'arepas')).slice(0, 2), ['2', '1'], 'el nombre pesa más que la descripción');
assert.deepEqual(ids(buscarNegocios(NEGOCIOS, 'AREPA')).slice(0, 2), ['2', '1'], 'mayúsculas y singular = plural');
assert.deepEqual(ids(buscarNegocios(NEGOCIOS, 'barberia')), ['3'], 'sin tilde encuentra con tilde');
assert.deepEqual(ids(buscarNegocios(NEGOCIOS, 'barb')), ['3'], 'por prefijo mientras se escribe');
assert.deepEqual(ids(buscarNegocios(NEGOCIOS, 'bandeja')), ['4'], 'busca en los productos');
assert.deepEqual(ids(buscarNegocios(NEGOCIOS, 'arepas la salle')), ['2'], 'varias palabras en campos distintos');

const corrientazo = buscarNegocios(NEGOCIOS, 'corrientazo');
assert.deepEqual(ids(corrientazo).slice(0, 2).sort(), ['2', '4'], 'sinónimo del barrio pone primero a Comidas');
assert.equal(ids(corrientazo).at(-1), '1', 'y después a quien las menciona en la descripción');
assert.equal(corrientazo.parcial, false);

assert.deepEqual(ids(buscarNegocios(NEGOCIOS, 'pelo')), ['3'], 'pelo → barbería');
assert.ok(!ids(buscarNegocios(NEGOCIOS, 'pantalla')).includes('6'), '"pantalla" no trae panaderías');
assert.deepEqual(ids(buscarNegocios(NEGOCIOS, 'pantalla')), ['5'], '"pantalla" trae el de celulares');

const parcial = buscarNegocios(NEGOCIOS, 'arepas sushi');
assert.equal(parcial.parcial, true, 'sin coincidencia completa, avisa que es parcial');
assert.deepEqual(ids(parcial).slice(0, 2), ['2', '1'], 'y muestra lo que tiene alguna palabra');
assert.deepEqual(ids(buscarNegocios(NEGOCIOS, 'zzzz')), [], 'nada parecido, nada');

const rel = relacionados(NEGOCIOS, buscarNegocios(NEGOCIOS, 'Doña Rosa').resultados);
assert.deepEqual(rel.map((x) => x.id), ['4'], 'recomienda de la misma categoría, sin repetir');

console.log('✓ busqueda: 18 comprobaciones');
