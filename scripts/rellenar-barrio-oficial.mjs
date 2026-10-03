#!/usr/bin/env node
/**
 * Rellena `portafolios.barrio_oficial` con barrioDe(lat, lon) en las filas que ya
 * existían antes de la migración 033 (desde la 033, crear y editar lo escriben
 * solos: portafolios.repo.ts).
 *
 *   node --experimental-strip-types scripts/rellenar-barrio-oficial.mjs          aplica
 *   node --experimental-strip-types scripts/rellenar-barrio-oficial.mjs --seco   solo cuenta
 *
 * Por qué un script y no SQL en la migración: el polígono vive en JSON
 * (lib/geo/barrios-manrique.json), no en la base, y el ray casting es el mismo
 * que usa la app (barrioOficial.ts); copiarlo a SQL serían dos implementaciones
 * que pueden decir cosas distintas.
 *
 * Idempotente: solo toca las filas cuyo valor guardado difiere del calculado
 * (`is distinct from`), así que correrlo dos veces no cambia nada la segunda.
 * Un punto fuera de los 15 barrios queda en NULL hasta que se corrija.
 *
 * DATABASE_URL: la del entorno le gana a .env.local (y .env.local puede apuntar a
 * PRODUCCIÓN). Para una rama de Neon, pásala inline.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { barrioDe } from '../lib/geo/barrioOficial.ts';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function cargarEnv() {
  if (process.env.DATABASE_URL) return;
  try {
    for (const linea of readFileSync(join(RAIZ, '.env.local'), 'utf8').split('\n')) {
      const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch {}
}

cargarEnv();
if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL');
  process.exit(1);
}

const seco = process.argv.includes('--seco');
const sql = neon(process.env.DATABASE_URL);

const filas = await sql`select id, latitud, longitud, barrio_oficial from portafolios`;

const cambios = [];
let fuera = 0;
for (const f of filas) {
  const calculado = barrioDe(Number(f.latitud), Number(f.longitud));
  if (calculado === null) fuera++;
  if (calculado !== f.barrio_oficial) cambios.push({ id: f.id, barrio: calculado });
}

console.log(
  `${filas.length} negocio(s): ${cambios.length} por actualizar, ${fuera} fuera de los 15 barrios (quedan en NULL).`,
);

if (seco || cambios.length === 0) process.exit(0);

// Una sola sentencia: o se aplica todo o nada.
const actualizadas = await sql`
  update portafolios p
  set barrio_oficial = c.barrio
  from unnest(${cambios.map((c) => c.id)}::uuid[], ${cambios.map((c) => c.barrio)}::text[]) as c(id, barrio)
  where p.id = c.id and p.barrio_oficial is distinct from c.barrio
  returning p.id
`;
console.log(`✓ ${actualizadas.length} fila(s) actualizada(s).`);
