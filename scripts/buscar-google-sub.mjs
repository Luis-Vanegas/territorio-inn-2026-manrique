#!/usr/bin/env node
/**
 * Muestra el `google_sub` de una cuenta que ya entró al sitio con Google.
 *
 *   npm run db:google-sub -- --correo tucorreo@gmail.com
 *
 * Para qué: el acceso de moderación por Google se concede por `sub`, no por
 * correo (ver docs/seguridad.md). Este script lo saca de la base para pegarlo
 * en `ADMIN_GOOGLE_SUBS`, sin tener que decodificar nada a mano.
 *
 * Solo lee. La cuenta tiene que haber entrado al menos una vez por «Entrar con
 * Google», que es lo que crea la fila en `usuarios`.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

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

const indice = process.argv.indexOf('--correo');
const correo = process.argv[indice + 1]?.toLowerCase().trim();

if (indice === -1 || !correo) {
  console.error('Uso: npm run db:google-sub -- --correo tucorreo@gmail.com');
  process.exit(1);
}

cargarEnv();
if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL (en el entorno o en .env.local).');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const filas = await sql`
  select google_sub, nombre, creado_en from usuarios where correo = ${correo}
`;

if (filas.length === 0) {
  console.error(
    `No hay ninguna cuenta con ${correo}. Entra primero al sitio con «Entrar con Google» y vuelve a correr esto.`,
  );
  process.exit(1);
}

const { google_sub: sub, nombre, creado_en: creado } = filas[0];
console.log(`Cuenta: ${nombre} <${correo}> (creada ${new Date(creado).toISOString().slice(0, 10)})`);
console.log(`google_sub: ${sub}`);
console.log('\nPégalo en la variable ADMIN_GOOGLE_SUBS (varios moderadores: separados por coma).');
