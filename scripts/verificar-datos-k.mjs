#!/usr/bin/env node
/**
 * Verifica la privacidad de `/api/datos` (regla k = 5, Ley 1581):
 *
 *  1. `suprimir`/`celda` de lib/privacidad/kAnonimato.ts: ninguna celda < 5 sale
 *     con número, y la supresión complementaria cubre el caso de una sola celda
 *     escondida (se deduciría restando del total).
 *  2. `hallarFugas` atrapa lo que debe (control positivo) y deja pasar una
 *     respuesta limpia — si el detector no detecta nada, no verifica nada.
 *  3. Estático sobre lib/db/datos.repo.ts: solo lee negocios aprobados, no
 *     selecciona columnas personales, no usa `select *`, y pasa por la regla.
 *  4. Estático sobre app/api/datos/route.ts: rate limit compartido y CORS.
 *  5. Opcional, contra un servidor vivo: `VERIFICAR_URL_DATOS=http://localhost:3000/api/datos`.
 *     Sin la variable no se toca la red (este verificador no necesita servidor).
 *
 *   node --experimental-strip-types scripts/verificar-datos-k.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { celda, suprimir, hallarFugas, K_MINIMO } from '../lib/privacidad/kAnonimato.ts';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (ruta) => readFileSync(join(RAIZ, ruta), 'utf8').replace(/\r\n/g, '\n');
const errores = [];
const falla = (m) => errores.push(m);

// ─── 1 · La regla ───────────────────────────────────────────

for (const n of [0, 1, 4]) if (celda(n) !== '<5') falla(`celda(${n}) debía ser "<5"`);
for (const n of [5, 6, 120]) if (celda(n) !== n) falla(`celda(${n}) debía ser ${n}`);
if (K_MINIMO !== 5) falla(`K_MINIMO es ${K_MINIMO}, debía ser 5`);

const f = (...ns) => ns.map((negocios, i) => ({ id: `c${i}`, negocios }));
const valores = (filas) => filas.map((x) => x.negocios);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const CASOS = [
  // [entrada, particion, esperado]
  [f(0, 3, 7, 20), true, ['<5', '<5', 7, 20]], // ya hay 2 escondidas: nada más que hacer
  [f(2, 7, 9, 20), true, ['<5', '<5', 9, 20]], // una sola escondida: se esconde también la menor visible
  [f(2, 7, 9, 20), false, ['<5', 7, 9, 20]], // sin total publicado no hace falta
  [f(5, 5, 5), true, [5, 5, 5]], // exactamente k es visible
  [f(4, 4, 4), true, ['<5', '<5', '<5']],
  [f(3), true, ['<5']],
  [f(), true, []],
  [f(0, 12, 13), true, ['<5', '<5', 13]], // un cero también es una celda pequeña
];
for (const [entrada, particion, esperado] of CASOS) {
  const salida = valores(suprimir(entrada, { particion }));
  if (!eq(salida, esperado)) {
    falla(`suprimir(${valores(entrada)}, particion=${particion}) = ${JSON.stringify(salida)}, esperaba ${JSON.stringify(esperado)}`);
  }
  for (const v of salida) {
    if (typeof v === 'number' && v < K_MINIMO) falla(`salió ${v} con número`);
  }
}

// Propiedad: en una partición, nunca queda UNA sola celda escondida (salvo que
// sea la única fila). Se prueba con muchas combinaciones.
for (let a = 0; a <= 8; a++) {
  for (let b = 0; b <= 8; b++) {
    for (let c = 0; c <= 8; c++) {
      const salida = valores(suprimir(f(a, b, c, 30), { particion: true }));
      const escondidas = salida.filter((v) => v === '<5').length;
      if (escondidas === 1) falla(`una sola celda escondida con (${a},${b},${c},30): se deduce restando`);
      if (salida.some((v) => typeof v === 'number' && v < K_MINIMO)) falla(`celda chica con número en (${a},${b},${c})`);
    }
  }
}

// ─── 2 · El detector ────────────────────────────────────────

const LIMPIA = {
  generado_en: '2026-10-01T20:00:38.000Z',
  negocios_aprobados: 12,
  por_categoria: [
    { id: 'comidas', nombre: 'Comidas y almuerzos', negocios: 9 },
    { id: 'barberia', nombre: 'Barberías', negocios: '<5' },
  ],
};
if (hallarFugas(LIMPIA).length) falla(`el detector marcó una respuesta limpia: ${hallarFugas(LIMPIA)}`);

const SUCIAS = {
  'conteo chico con número': { por_categoria: [{ id: 'x', negocios: 3 }] },
  'cero con número': { negocios_aprobados: 0 },
  'conteo decimal': { por_barrio: [{ nombre: 'La Cruz', negocios: 7.5 }] },
  'whatsapp': { negocios: [{ whatsapp: '3001234567' }] },
  'correo en un texto': { nota: 'escribe a vecino@example.com' },
  'teléfono en un texto': { nota: 'llama al 300 123 4567' },
  'coordenadas': { puntos: [{ latitud: 6.27, longitud: -75.55 }] },
  'token': { token_publico: 'abc' },
  'ip': { ip_hash: 'abc' },
};
for (const [caso, doc] of Object.entries(SUCIAS)) {
  if (!hallarFugas(doc).length) falla(`el detector no atrapó: ${caso}`);
}

// ─── 3 · El repo ────────────────────────────────────────────

const repo = leer('lib/db/datos.repo.ts');

// Cada consulta que toca `portafolios` debe filtrar por aprobado.
const consultas = [...repo.matchAll(/sql`([\s\S]*?)`/g)].map((m) => m[1]);
if (!consultas.length) falla('datos.repo.ts: no se encontraron consultas (¿cambió el patrón sql`…`?)');
for (const q of consultas) {
  if (/\bportafolios\b/.test(q) && !/estado\s*=\s*'aprobado'/.test(q)) {
    falla(`datos.repo.ts: consulta sobre portafolios sin estado = 'aprobado': ${q.trim().slice(0, 60)}…`);
  }
  if (/select\s+\*/i.test(q) || /\.\*/.test(q)) falla('datos.repo.ts: select * / alias.* no permitido');
  const personal = q.match(
    /\b[a-z]\.(nombre|descripcion|direccion|whatsapp|telefono|correo|instagram|facebook|latitud|longitud|token_publico|ip_registro|ip_hash|usuario_id|foto_url|menu_url|productos|campos_extra|punto_referencia|capturado_por|id_usuario)\b/g,
  );
  // `c.nombre` es el nombre de la categoría (público); cualquier otro alias no.
  for (const col of personal ?? []) {
    if (col !== 'c.nombre') falla(`datos.repo.ts: selecciona la columna personal ${col}`);
  }
  if (/\b(latitud|longitud|whatsapp|telefono|correo|direccion|token_publico|ip_registro)\b/.test(q)) {
    falla(`datos.repo.ts: una consulta nombra una columna personal: ${q.trim().slice(0, 60)}…`);
  }
}
if (!/suprimir\(/.test(repo) || !/celda\(/.test(repo)) falla('datos.repo.ts: no pasa los conteos por kAnonimato');
if (!/revalidate:\s*3600/.test(repo)) falla('datos.repo.ts: la caché no es de 1 h (revalidate: 3600)');

// ─── 4 · La ruta ────────────────────────────────────────────

const ruta = leer('app/api/datos/route.ts');
if (!/verificarLimite\([^)]*'datos'\)/.test(ruta)) falla("route.ts: sin rate limit compartido (verificarLimite(ip, 'datos'))");
if (!/Access-Control-Allow-Origin['"]?:\s*['"]\*/.test(ruta)) falla('route.ts: sin CORS abierto');
if (!/s-maxage=3600/.test(ruta)) falla('route.ts: sin Cache-Control de 1 h');
if (/export\s+(async\s+)?function\s+(POST|PUT|PATCH|DELETE)\b/.test(ruta)) falla('route.ts: solo debe haber GET y OPTIONS');
const limite = leer('lib/db/rateLimit.ts');
if (!/datos:\s*\{/.test(limite)) falla("rateLimit.ts: falta el cupo del origen 'datos'");

// ─── 5 · Opcional: servidor vivo ────────────────────────────

const url = process.env.VERIFICAR_URL_DATOS;
if (url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (r.status !== 200) falla(`${url}: respondió ${r.status}`);
  else {
    const cuerpo = await r.json();
    for (const fuga of hallarFugas(cuerpo)) falla(`${url}: ${fuga}`);
    if (r.headers.get('access-control-allow-origin') !== '*') falla(`${url}: sin CORS abierto`);
    if (!/s-maxage=3600/.test(r.headers.get('cache-control') ?? '')) falla(`${url}: sin Cache-Control de 1 h`);
    console.log(`en vivo: ${url} limpio (negocios_aprobados = ${JSON.stringify(cuerpo.negocios_aprobados)})`);
  }
}

console.log(`${CASOS.length} casos de la regla, ${Object.keys(SUCIAS).length} controles positivos, ${consultas.length} consultas revisadas`);
if (errores.length) {
  for (const e of errores) console.error('ERROR:', e);
  process.exit(1);
}
console.log('verificar-datos-k: ok');
