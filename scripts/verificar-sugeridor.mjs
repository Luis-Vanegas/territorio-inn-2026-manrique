#!/usr/bin/env node
/**
 * Verifica que `lib/ml/categoria.ts` (la inferencia que corre en el navegador)
 * da lo mismo que `pipeline/verificar_salidas.py` (`inferir`) sobre
 * `public/modelo_categoria.json`.
 *
 * Los casos y sus probabilidades salen de correr la función de Python con el
 * modelo vigente (2026-10-01); no se calculan acá. Si se reentrena el modelo,
 * hay que volver a generarlos: este script falla a propósito, porque una
 * sugerencia que cambió sin que nadie lo mirara es justo lo que se quiere ver.
 *
 *   node --experimental-strip-types scripts/verificar-sugeridor.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clasificar, sugerirCategoria, normalizar } from '../lib/ml/categoria.ts';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const modelo = JSON.parse(readFileSync(join(RAIZ, 'public/modelo_categoria.json'), 'utf8'));

// [nombre, clase esperada, probabilidad de Python]. Nombres inventados.
const CASOS = [
  ['Panadería La Espiga Dorada', 'panaderia', 0.825741],
  ['Veterinaria Patitas Felices', 'mascotas', 0.998224],
  ['Droguería San Rafael', 'salud_bienestar', 0.996884],
  ['Repuestos y Motos El Tornillo', 'mecanica_motos', 0.811987],
  ['Restaurante Sabor Paisa', 'comidas', 0.905959],
  ['Peluquería Estilo', 'belleza_peluqueria', 0.973635],
  ['Barbería El Corte', 'belleza_peluqueria', 0.524059],
  ['Ferretería y construcción Don Pedro', 'construccion', 0.986126],
  ['Papelería y Variedades Luna', 'papeleria', 0.997362],
  ['Cacharrería Ñandú 24 horas', 'panaderia', 0.480905],
  ['Tienda de Doña Marta', 'tienda_viveres', 0.949582],
  ['Celulares & Accesorios JR', 'tecnologia_celulares', 0.976157],
  ['Salón de belleza Rosa', 'belleza_peluqueria', 0.998582],
  ['Misceláneo El Vecino', 'comidas', 0.540664],
  ['y', 'belleza_peluqueria', 0.28471],
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

if (modelo.umbral_confianza !== 0.45) errores.push(`umbral ${modelo.umbral_confianza} != 0.45`);

console.log(`${CASOS.length} casos revisados`);
if (errores.length) {
  for (const e of errores) console.error('ERROR:', e);
  process.exit(1);
}
console.log('verificar-sugeridor: ok');
