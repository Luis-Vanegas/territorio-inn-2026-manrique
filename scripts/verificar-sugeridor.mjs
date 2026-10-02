#!/usr/bin/env node
/**
 * Verifica que `lib/ml/categoria.ts` (la inferencia que corre en el navegador)
 * da lo mismo que `pipeline/verificar_salidas.py` (`inferir`) sobre
 * `public/modelo_categoria.json`.
 *
 * Los casos y sus probabilidades salen de correr la función de Python con el
 * modelo vigente (2026-10-02); no se calculan acá. Si se reentrena el modelo,
 * hay que volver a generarlos: este script falla a propósito, porque una
 * sugerencia que cambió sin que nadie lo mirara es justo lo que se quiere ver.
 *
 *   node --experimental-strip-types scripts/verificar-sugeridor.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clasificar, sugerirCategoria, normalizar } from '../lib/ml/categoria.ts';
import {
  sugerenciaDesdeFormData,
  respuestaASugerencia,
} from '../lib/validation/sugerenciaCategoria.schema.ts';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const modelo = JSON.parse(readFileSync(join(RAIZ, 'public/modelo_categoria.json'), 'utf8'));

// [nombre, clase esperada, probabilidad de Python]. Nombres inventados.
const CASOS = [
  ['Panadería La Espiga Dorada', 'panaderia', 0.857897],
  ['Veterinaria Patitas Felices', 'mascotas', 0.999729],
  ['Droguería San Rafael', 'salud_bienestar', 0.999553],
  ['Repuestos y Motos El Tornillo', 'mecanica_motos', 0.912855],
  ['Restaurante Sabor Paisa', 'comidas', 0.898379],
  ['Peluquería Estilo', 'belleza_peluqueria', 0.996561],
  ['Barbería El Corte', 'barberia', 0.500637],
  ['Ferretería y construcción Don Pedro', 'construccion', 0.994138],
  ['Papelería y Variedades Luna', 'papeleria', 0.998797],
  ['Cacharrería Ñandú 24 horas', 'panaderia', 0.829353],
  ['Tienda de Doña Marta', 'tienda_viveres', 0.988023],
  ['Celulares & Accesorios JR', 'tecnologia_celulares', 0.991436],
  ['Salón de belleza Rosa', 'belleza_peluqueria', 0.999563],
  ['Misceláneo El Vecino', 'comidas', 0.899511],
  ['y', 'belleza_peluqueria', 0.324474],
];

const TOLERANCIA = 1e-4;
const errores = [];

for (const [nombre, esperada, prob] of CASOS) {
  const orden = clasificar(modelo, nombre);
  const mejor = orden[0];
  if (!mejor) {
    errores.push(`${nombre}: sin resultado, esperaba ${esperada}`);
    continue;
  }
  const ok = mejor.id === esperada && Math.abs(mejor.probabilidad - prob) <= TOLERANCIA;
  console.log(
    `${ok ? 'ok ' : 'MAL'} ${nombre} -> ${mejor.id} (${mejor.probabilidad.toFixed(4)}) esperado ${esperada} (${prob})`,
  );
  if (!ok) errores.push(`${nombre}: ${mejor.id} ${mejor.probabilidad.toFixed(6)} != ${esperada} ${prob}`);

  const suma = orden.reduce((a, s) => a + s.probabilidad, 0);
  if (Math.abs(suma - 1) > 1e-9) errores.push(`${nombre}: las probabilidades suman ${suma}`);

  // La decisión una/varias sale del umbral del propio modelo.
  const r = sugerirCategoria(modelo, nombre);
  if (prob >= modelo.umbral_confianza) {
    if (r.tipo !== 'una' || r.sugerida.id !== esperada) errores.push(`${nombre}: debía sugerir una`);
  } else if (r.tipo !== 'varias' || r.opciones.length !== 3 || r.opciones[0].id !== esperada) {
    errores.push(`${nombre}: debía mostrar las 3 mejores`);
  }
}

// Mayúsculas y tildes no cambian nada (el entrenamiento las quita).
const a = clasificar(modelo, 'PANADERÍA LA ESPIGA DORADA')[0];
const b = clasificar(modelo, 'panaderia la espiga dorada')[0];
if (!a || !b || a.id !== b.id || Math.abs(a.probabilidad - b.probabilidad) > 1e-12) {
  errores.push('mayúsculas/tildes cambian el resultado');
}
if (normalizar('  Ñandú   CAFÉ ') !== 'nandu cafe') errores.push('normalizar mal');

// Sin texto útil, no se sugiere nada (el modelo solo devolvería su sesgo).
for (const vacio of ['', '   ', '\n']) {
  if (sugerirCategoria(modelo, vacio).tipo !== 'nada') errores.push(`texto vacío ${JSON.stringify(vacio)} sugiere algo`);
}
if (sugerirCategoria(modelo, '\u{1F600}\u{1F600}').tipo !== 'nada') errores.push('solo emojis sugiere algo');

// Lo que viaja al servidor: solo la categoría inferida y su confianza, y un dato
// inválido o ausente no registra nada (en vez de romper el envío del registro).
const form = (campos) => {
  const f = new FormData();
  for (const [k, val] of Object.entries(campos)) f.set(k, val);
  return f;
};
const ok = sugerenciaDesdeFormData(form({ sugerencia_categoria: 'panaderia', sugerencia_confianza: '0.8579' }));
if (!ok || ok.categoria_inferida !== 'panaderia' || ok.confianza !== 0.8579) errores.push('sugerencia válida mal leída');
if (Object.keys(ok ?? {}).sort().join() !== 'categoria_inferida,confianza') {
  errores.push('la sugerencia lleva campos de más (¿el texto escrito?)');
}
const nombreEscrito = sugerenciaDesdeFormData(
  form({ sugerencia_categoria: 'panaderia', sugerencia_confianza: '0.5', nombre: 'Panadería La Espiga' }),
);
if (nombreEscrito && 'nombre' in nombreEscrito) errores.push('el nombre escrito llegó a la sugerencia');
for (const [cat, conf] of [
  ['Panadería La Espiga', '0.5'], // un nombre en el campo de la categoría
  ['panaderia', '1.5'],
  ['panaderia', '-0.1'],
  ['panaderia', 'abc'],
  ['', '0.5'],
  ['a'.repeat(61), '0.5'],
]) {
  if (sugerenciaDesdeFormData(form({ sugerencia_categoria: cat, sugerencia_confianza: conf }))) {
    errores.push(`sugerencia inválida aceptada: ${cat.slice(0, 20)} / ${conf}`);
  }
}
if (sugerenciaDesdeFormData(form({ sugerencia_categoria: 'panaderia' }))) errores.push('sin confianza aceptó');
if (sugerenciaDesdeFormData(new FormData())) errores.push('formulario sin sugeridor registró algo');
if (respuestaASugerencia('panaderia', 'panaderia') !== true) errores.push('aceptada: true');
if (respuestaASugerencia('panaderia', 'comidas') !== false) errores.push('aceptada: false');
if (respuestaASugerencia('panaderia', '') !== null) errores.push('aceptada: null (sin elegir)');
if (respuestaASugerencia('panaderia', null) !== null) errores.push('aceptada: null (sin campo)');

if (modelo.umbral_confianza !== 0.45) errores.push(`umbral ${modelo.umbral_confianza} != 0.45`);

console.log(`${CASOS.length} casos revisados`);
if (errores.length) {
  for (const e of errores) console.error('ERROR:', e);
  process.exit(1);
}
console.log('verificar-sugeridor: ok');
