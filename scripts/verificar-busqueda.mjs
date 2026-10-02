#!/usr/bin/env node
/**
 * Comprueba el buscador de negocios de `lib/busqueda.ts`.
 *
 *   node --experimental-strip-types scripts/verificar-busqueda.mjs
 *
 * No toca la base ni la red: funciones puras sobre una lista de ejemplo.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buscarNegocios, relacionados, terminosDe } from '../lib/busqueda.ts';
import {
  aBuscable,
  aplanarComercios,
  cocinaLegible,
  esComercioOsm,
  horarioLegible,
  nombreCategoriaOsm,
  webLegible,
} from '../lib/geo/comerciosOsm.ts';

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

// ── Comercios de OpenStreetMap: la misma función, con el JSON real ──────

const datos = JSON.parse(readFileSync(new URL('../public/firmamento/constelaciones.json', import.meta.url), 'utf8'));
const comercios = aplanarComercios(datos);
const OSM = comercios.map(aBuscable);
assert.equal(OSM.length, datos.resumen.total_comercios, 'aplana estrellas y puntos sueltos: ninguno se pierde');
assert.equal(new Set(OSM.map((o) => o.id)).size, OSM.length, 'ids únicos');
assert.ok(OSM.every(esComercioOsm), 'todos quedan marcados como OSM');

const TODOS = [...NEGOCIOS, ...OSM];
const hay = (r, osm) => r.resultados.some((x) => x.comercio?.osm === osm);

const porCategoria = buscarNegocios(TODOS, 'peluquería');
assert.ok(hay(porCategoria, 'n5449526346'), 'por categoría: «peluquería» encuentra un comercio de OSM de Belleza y peluquería');
assert.equal(nombreCategoriaOsm('belleza_peluqueria'), 'Belleza y peluquería');
assert.equal(nombreCategoriaOsm(null), 'Sin categoría');

const porCalle = buscarNegocios(TODOS, 'calle 71A');
assert.ok(hay(porCalle, 'n5449526346'), 'por dirección: «calle 71A» encuentra «Calle 71A #31-36»');
const porCarrera = buscarNegocios(TODOS, 'cra 31A');
assert.ok(
  porCarrera.resultados.some((x) => x.comercio?.detalle?.direccion?.startsWith('Carrera 31A')),
  '«cra» vale por «carrera» en una dirección',
);
assert.ok(
  !buscarNegocios(TODOS, 'sin categoría').resultados.some(
    (x) => esComercioOsm(x) && !x.comercio.categoria && !/\bsin\b/i.test(x.nombre),
  ),
  '«Sin categoría» no es una palabra que se busque',
);

const cocina = comercios.find((c) => c.detalle?.cocina === 'coffee_shop');
assert.ok(cocina && hay(buscarNegocios(TODOS, 'café'), cocina.osm), 'por cocina: «café» encuentra la cocina coffee_shop');

const empate = buscarNegocios(
  [
    aBuscable({ osm: 'n1', nombre: 'Sandra Spa', lat: 0, lon: 0, categoria: 'belleza_peluqueria' }),
    n('9', 'Sandra Spa', 'belleza_peluqueria', 'Belleza y peluquería'),
  ],
  'sandra spa',
);
assert.deepEqual(empate.resultados.map((x) => x.id), ['9', 'osm:n1'], 'ante empate, el aliado va primero aunque venga después');

const rel2 = relacionados(NEGOCIOS, buscarNegocios(TODOS, 'peluquería').resultados);
assert.ok(rel2.every((x) => !esComercioOsm(x)), 'las recomendaciones salen de los aliados');

// ── Texto de OSM para vecinos ───────────────────────────────────────────

assert.equal(horarioLegible('24/7'), 'Abierto las 24 horas');
assert.equal(horarioLegible('Mo-Sa 08:00-18:00'), 'Lunes a sábado, 8:00 a. m. – 6:00 p. m.');
assert.equal(horarioLegible('Mo-Su 09:00-21:00'), 'Todos los días, 9:00 a. m. – 9:00 p. m.');
assert.equal(horarioLegible('08:00-19:00'), 'Todos los días, 8:00 a. m. – 7:00 p. m.');
assert.equal(
  horarioLegible('Mo-Fr 09:00-23:00; Sa-Su 13:00-02:00'),
  'Lunes a viernes, 9:00 a. m. – 11:00 p. m.; Sábado a domingo, 1:00 p. m. – 2:00 a. m.',
);
assert.equal(
  horarioLegible('Mo,We,Fr 08:00-12:00,14:00-18:00'),
  'Lunes, miércoles y viernes, 8:00 a. m. – 12:00 p. m. y 2:00 p. m. – 6:00 p. m.',
);
assert.equal(horarioLegible('Mo-Sa 08:00-18:00; Su off'), 'Lunes a sábado, 8:00 a. m. – 6:00 p. m.; Domingo, cerrado');
assert.equal(horarioLegible('Mo-Su 00:00-24:00'), 'Todos los días, las 24 horas');
assert.equal(horarioLegible('7:00 am 8:00 pm'), '7:00 am 8:00 pm', 'lo que no se entiende se muestra tal cual');
assert.equal(horarioLegible('Sa,Su'), 'Sa,Su', 'solo días, sin horas: tal cual');
assert.equal(horarioLegible('Mo-Fr 08:00-17:00; PH off'), 'Mo-Fr 08:00-17:00; PH off', 'feriados (PH): tal cual, no a medias');
for (const h of new Set(comercios.map((c) => c.detalle?.horario).filter(Boolean))) {
  const texto = horarioLegible(h);
  assert.ok(texto === h || !/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/.test(texto), `«${h}» no queda a medio traducir`);
}

assert.equal(cocinaLegible('burger'), 'Hamburguesas');
assert.equal(cocinaLegible('coffee_shop'), 'Café');
assert.equal(cocinaLegible('regional;burger'), 'Comida regional, hamburguesas');
assert.equal(cocinaLegible('regional;algo_raro'), 'Comida regional', 'un valor que no está en el diccionario no se muestra');
assert.equal(cocinaLegible('algo_raro'), '');
for (const c of comercios.map((x) => x.detalle?.cocina).filter(Boolean)) {
  for (const v of c.split(';')) {
    assert.ok(cocinaLegible(v), `el diccionario de cocinas cubre «${v}» (el JSON lo trae)`);
  }
}
assert.equal(webLegible('https://www.smartfit.com.co/ruta'), 'smartfit.com.co');

console.log('✓ busqueda: aliados, comercios de OpenStreetMap y texto de OSM');
