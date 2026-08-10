#!/usr/bin/env node
/**
 * Verifica que chk_opciones_segun_tipo rechace lo que tiene que rechazar.
 *
 *   node scripts/verificar-campos-personalizados.mjs
 *
 * Existe porque la primera versión de este constraint (migración 003) tenía
 * el clásico gotcha de NULL-en-CHECK de Postgres: con tipo='seleccion' y
 * opciones=NULL, jsonb_typeof(NULL) da NULL, y NULL no es FALSE — el CHECK
 * lo dejaba pasar. La migración 004 lo corrige envolviendo en coalesce(...,
 * false). Este script prueba ambas ramas para que no vuelva a pasar
 * silenciosamente.
 *
 * Corre en una transacción que siempre se revierte: no deja datos.
 */

import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool, neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = globalThis.WebSocket;

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

const CASOS = [
  {
    caso: 'seleccion sin opciones',
    debePasar: false,
    sql: `insert into definiciones_campo (slug, etiqueta, tipo, opciones) values ('prueba_1', 'Prueba', 'seleccion', null)`,
  },
  {
    caso: 'seleccion con 1 sola opción',
    debePasar: false,
    sql: `insert into definiciones_campo (slug, etiqueta, tipo, opciones) values ('prueba_2', 'Prueba', 'seleccion', '["Sola"]'::jsonb)`,
  },
  {
    caso: 'seleccion con 2 opciones',
    debePasar: true,
    sql: `insert into definiciones_campo (slug, etiqueta, tipo, opciones) values ('prueba_3', 'Prueba', 'seleccion', '["Sí","No"]'::jsonb)`,
  },
  {
    caso: 'texto con opciones (no debería llevar)',
    debePasar: false,
    sql: `insert into definiciones_campo (slug, etiqueta, tipo, opciones) values ('prueba_4', 'Prueba', 'texto', '["algo"]'::jsonb)`,
  },
  {
    caso: 'texto sin opciones',
    debePasar: true,
    sql: `insert into definiciones_campo (slug, etiqueta, tipo) values ('prueba_5', 'Prueba', 'texto')`,
  },
  {
    caso: 'slug con mayúsculas (inválido)',
    debePasar: false,
    sql: `insert into definiciones_campo (slug, etiqueta, tipo) values ('Prueba_6', 'Prueba', 'texto')`,
  },
];

async function main() {
  cargarEnv();
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const cliente = await pool.connect();
  let fallos = 0;

  try {
    await cliente.query('begin');

    for (const { caso, sql, debePasar } of CASOS) {
      await cliente.query('savepoint sp');
      let paso;
      let detalle = '';
      try {
        await cliente.query(sql);
        paso = true;
        await cliente.query('rollback to savepoint sp');
      } catch (e) {
        paso = false;
        detalle = e.message.split('\n')[0];
        await cliente.query('rollback to savepoint sp');
      }

      const ok = paso === debePasar;
      if (!ok) fallos++;
      console.log(`  ${ok ? 'ok   ' : 'FALLO'} ${debePasar ? 'acepta  ' : 'rechaza '} ${caso}`);
      if (!ok && detalle) console.log(`        → ${detalle}`);
    }
  } finally {
    await cliente.query('rollback').catch(() => {});
    cliente.release();
    await pool.end();
  }

  console.log(fallos === 0 ? `\n${CASOS.length}/${CASOS.length} correctos.` : `\n${fallos} fallaron.`);
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
