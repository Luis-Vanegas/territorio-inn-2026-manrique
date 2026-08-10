#!/usr/bin/env node
/**
 * Corre las migraciones pendientes de lib/db/migrations contra DATABASE_URL.
 *
 *   node scripts/migrar.mjs            aplica lo pendiente
 *   node scripts/migrar.mjs --estado   solo reporta, no escribe
 *
 * Por qué un runner propio y no drizzle-kit / node-pg-migrate:
 * son ~80 líneas contra una dependencia con su propio CLI, su config y su
 * formato. El día que el proyecto necesite rollbacks automáticos o migraciones
 * generadas desde un schema declarativo, se cambia — hasta entonces, esto sobra.
 *
 * Portabilidad: habla Postgres puro. Apuntá DATABASE_URL a Supabase, RDS o un
 * Postgres local y corre igual.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool, neonConfig } from '@neondatabase/serverless';

// Node 21+ trae WebSocket nativo, así que el driver de Neon no necesita `ws`.
// El driver HTTP no sirve acá: no soporta transacciones interactivas, y una
// migración a medio aplicar es peor que una migración que no corrió.
neonConfig.webSocketConstructor = globalThis.WebSocket;

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR_MIGRACIONES = join(RAIZ, 'lib/db/migrations');

const TABLA_CONTROL = `
  create table if not exists _migraciones (
    nombre      text primary key,
    checksum    text not null,
    aplicada_en timestamptz not null default now()
  )
`;

function cargarEnv() {
  if (process.env.DATABASE_URL) return;

  // Sin dotenv: leer el .env.local a mano son seis líneas.
  for (const archivo of ['.env.local', '.env']) {
    try {
      for (const linea of readFileSync(join(RAIZ, archivo), 'utf8').split('\n')) {
        const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      // el archivo puede no existir; en CI las vars vienen del entorno
    }
  }
}

function listarMigraciones() {
  return readdirSync(DIR_MIGRACIONES)
    .filter((f) => f.endsWith('.sql'))
    .sort() // el prefijo numérico define el orden: 001, 002, 010…
    .map((nombre) => {
      const sql = readFileSync(join(DIR_MIGRACIONES, nombre), 'utf8');
      return {
        nombre,
        sql,
        // Se normalizan los saltos de línea: si no, un checkout con CRLF en
        // Windows marca como modificadas migraciones que nadie tocó.
        checksum: createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex'),
      };
    });
}

async function main() {
  cargarEnv();

  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL. Ponela en .env.local o en el entorno.');
    process.exit(1);
  }

  const soloEstado = process.argv.includes('--estado');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query(TABLA_CONTROL);

    const { rows: aplicadas } = await pool.query(
      'select nombre, checksum from _migraciones',
    );
    const yaAplicadas = new Map(aplicadas.map((r) => [r.nombre, r.checksum]));

    const migraciones = listarMigraciones();
    const pendientes = [];

    for (const m of migraciones) {
      const checksumPrevio = yaAplicadas.get(m.nombre);

      if (checksumPrevio === undefined) {
        pendientes.push(m);
        console.log(`  pendiente  ${m.nombre}`);
        continue;
      }

      // Una migración ya aplicada que cambió de contenido significa que la
      // base y el repo divergieron. Corregirla en el lugar dejaría a cada
      // entorno con un esquema distinto: se corta acá y se pide una nueva.
      if (checksumPrevio !== m.checksum) {
        console.error(`\n  ${m.nombre} ya fue aplicada pero su contenido cambió.`);
        console.error('  No se edita una migración aplicada: creá una nueva.\n');
        process.exit(1);
      }

      console.log(`  aplicada   ${m.nombre}`);
    }

    if (pendientes.length === 0) {
      console.log('\nSin migraciones pendientes.');
      return;
    }

    if (soloEstado) {
      console.log(`\n${pendientes.length} pendiente(s). Corré sin --estado para aplicar.`);
      return;
    }

    for (const m of pendientes) {
      const cliente = await pool.connect();
      try {
        // Cada migración en su propia transacción: si la 002 falla, la 001
        // queda aplicada y el reintento arranca donde se cortó.
        await cliente.query('begin');
        await cliente.query(m.sql);
        await cliente.query(
          'insert into _migraciones (nombre, checksum) values ($1, $2)',
          [m.nombre, m.checksum],
        );
        await cliente.query('commit');
        console.log(`  ✓ aplicada  ${m.nombre}`);
      } catch (error) {
        await cliente.query('rollback').catch(() => {});
        console.error(`\n  ✗ falló ${m.nombre}: ${error.message}\n`);
        throw error;
      } finally {
        cliente.release();
      }
    }

    console.log(`\n${pendientes.length} migración(es) aplicada(s).`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
