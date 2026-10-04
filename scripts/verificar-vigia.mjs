#!/usr/bin/env node
/**
 * El vigía vivo (migración 036) no se sale de su carril. Sin base ni servidor:
 *
 *  1. El schema Zod del informe (`vigia.schema.ts`) acepta un informe bueno y
 *     rechaza lo que la base también rechazaría (huella sin respuesta, fallo sin
 *     explicación, campos de más, fuentes repetidas, URL no http).
 *  2. `pipeline/fuentes_convocatorias.json`: cada fuente trae un `id` slug y único
 *     (es la llave del historial en la base).
 *  3. Los dos endpoints de ingesta pasan por `puertaIngesta` y NINGUNO deja la
 *     comparación del secreto inline (un criterio de seguridad, no dos).
 *  4. `vigia.repo.ts` solo toca las tablas del vigía y `entidades`, y ninguna
 *     columna personal; ninguna página pública lo lee.
 *
 *   node --experimental-strip-types scripts/verificar-vigia.mjs
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { informeVigiaSchema } from '../lib/validation/vigia.schema.ts';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const leer = (ruta) => readFileSync(`${RAIZ}${ruta}`, 'utf8');
const problemas = [];

// ── 1 · El contrato del informe ────────────────────────────────

const HUELLA = 'a'.repeat(64);
const buena = () => ({
  origen: 'actions',
  iniciada_en: '2026-10-03T11:00:00Z',
  terminada_en: '2026-10-03T11:00:09Z',
  fuentes: [
    {
      id: 'fondo-emprender-vigentes',
      entidad: 'Fondo Emprender (SENA)',
      url: 'https://www.fondoemprender.com/x.aspx',
      estado: 'responde',
      http_status: 200,
      huella: HUELLA,
      candidatas: 3,
      nuevas: 1,
    },
  ],
});
const con = (cambio) => {
  const i = buena();
  cambio(i);
  return i;
};
const falla = { estado: 'timeout', http_status: null, huella: null, candidatas: 0, nuevas: 0, error: 'TimeoutError: agotado' };

assert.ok(informeVigiaSchema.safeParse(buena()).success, 'el informe bueno debe pasar');
assert.ok(informeVigiaSchema.safeParse(con((i) => Object.assign(i.fuentes[0], falla))).success, 'un timeout explicado debe pasar');

const CASOS_MALOS = {
  'campo de más (strict)': con((i) => (i.extra = 1)),
  'campo de más en una fuente': con((i) => (i.fuentes[0].nombre = 'x')),
  'sin fuentes': con((i) => (i.fuentes = [])),
  'más de 50 fuentes': con((i) => (i.fuentes = Array.from({ length: 51 }, (_, n) => ({ ...i.fuentes[0], id: `f-${n}x` })))),
  'fuente repetida': con((i) => i.fuentes.push({ ...i.fuentes[0] })),
  'origen desconocido': con((i) => (i.origen = 'cron')),
  'termina antes de empezar': con((i) => (i.terminada_en = '2026-10-03T10:00:00Z')),
  'fecha sin zona': con((i) => (i.iniciada_en = '2026-10-03 11:00')),
  'responde sin huella': con((i) => (i.fuentes[0].huella = null)),
  'huella que no es sha256': con((i) => (i.fuentes[0].huella = 'abc')),
  'falla con huella': con((i) => Object.assign(i.fuentes[0], falla, { huella: HUELLA })),
  'falla sin explicar': con((i) => Object.assign(i.fuentes[0], falla, { error: null })),
  'falla con candidatas': con((i) => Object.assign(i.fuentes[0], falla, { candidatas: 2 })),
  'más nuevas que candidatas': con((i) => (i.fuentes[0].nuevas = 9)),
  'url javascript:': con((i) => (i.fuentes[0].url = 'javascript:alert(1)')),
  'id con mayúsculas': con((i) => (i.fuentes[0].id = 'Fondo Emprender')),
  'estado que solo pone el repo (cambio)': con((i) => (i.fuentes[0].estado = 'cambio')),
  'error de más de 200': con((i) => Object.assign(i.fuentes[0], falla, { error: 'x'.repeat(201) })),
  'http_status fuera de rango': con((i) => (i.fuentes[0].http_status = 99)),
};
for (const [nombre, cuerpo] of Object.entries(CASOS_MALOS)) {
  if (informeVigiaSchema.safeParse(cuerpo).success) problemas.push(`vigia.schema.ts acepta un informe malo: ${nombre}`);
}

// ── 2 · Las fuentes ────────────────────────────────────────────

const fuentes = JSON.parse(leer('pipeline/fuentes_convocatorias.json')).fuentes;
const ids = fuentes.map((f) => f.id);
for (const f of fuentes) {
  if (!/^[a-z0-9][a-z0-9-]{1,59}$/.test(f.id ?? '')) problemas.push(`fuentes_convocatorias.json: «${f.nombre}» no tiene un id slug válido`);
}
if (new Set(ids).size !== ids.length) problemas.push('fuentes_convocatorias.json: hay ids repetidos');

// ── 3 · Los endpoints ──────────────────────────────────────────

for (const ruta of ['app/api/ingesta/convocatorias/route.ts', 'app/api/ingesta/vigia/route.ts']) {
  const src = leer(ruta);
  if (!src.includes('puertaIngesta(')) problemas.push(`${ruta}: no pasa por puertaIngesta`);
  if (/secretoValido|process\.env\.INGESTA_SECRETO/.test(src)) problemas.push(`${ruta}: compara el secreto inline; va en lib/auth/puertaIngesta.ts`);
}
const puerta = leer('lib/auth/puertaIngesta.ts');
if (!/status: 503/.test(puerta) || !/status: 401/.test(puerta)) problemas.push('puertaIngesta.ts: debe responder 503 sin secreto y 401 con header malo');
if (!/excedeLimite\('ingesta:sin-ip'/.test(puerta)) problemas.push('puertaIngesta.ts: falta el contador en memoria para peticiones sin IP');
if (!/informeVigiaSchema\.safeParse/.test(leer('app/api/ingesta/vigia/route.ts'))) problemas.push('/api/ingesta/vigia: no valida con Zod');

// ── 4 · El repo y lo público ─────────────────────────────

const repo = leer('lib/db/vigia.repo.ts');
const consultas = [...repo.matchAll(/sql`([\s\S]*?)`/g)].map((m) => m[1]).join('\n');
const PERMITIDAS = new Set(['vigia_corridas', 'vigia_fuentes_estado', 'entidades']);
for (const m of consultas.matchAll(/\b(?:from|join|into|update)\s+([a-z_]+)/gi)) {
  const t = m[1].toLowerCase();
  if (['jsonb_to_recordset', 'lateral', 'c', 'f'].includes(t)) continue;
  if (!PERMITIDAS.has(t)) problemas.push(`vigia.repo.ts: consulta una tabla que no es del vigía: ${t}`);
}
if (/google_sub|whatsapp|telefono|correo|ip_registro|campos_extra/i.test(consultas)) problemas.push('vigia.repo.ts: una consulta nombra una columna personal');

// Ninguna página pública lee el vigía (Luis no quiere método ni secciones técnicas en lo público).
for (const ruta of ['app/(site)/firmamento/page.tsx', 'app/(site)/page.tsx']) {
  if (/vigia/i.test(leer(ruta))) problemas.push(`${ruta}: el vigía no va en lo público`);
}

// La page del panel va con guarda: lo comprueba verificar-accesos.mjs; aquí solo que la tarjeta esté.
if (!leer('app/(firmamento)/firmamento/equipo/convocatorias/page.tsx').includes('FuentesVigia')) problemas.push('equipo/convocatorias: falta la tarjeta «Fuentes del vigía»');

if (problemas.length) {
  console.error('verificar-vigia: FALLÓ\n' + problemas.map((p) => ` - ${p}`).join('\n'));
  process.exit(1);
}
console.log(`verificar-vigia: OK (${Object.keys(CASOS_MALOS).length} informes malos rechazados, ${fuentes.length} fuente(s), 2 endpoints por la misma puerta)`);
