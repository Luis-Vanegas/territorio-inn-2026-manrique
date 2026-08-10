#!/usr/bin/env node
/**
 * Verifica que los constraints de la base rechacen lo que tienen que rechazar.
 *
 *   node scripts/verificar-constraints.mjs
 *
 * Zod valida en el server, pero la base es la última línea de defensa: un
 * insert directo, un script de carga o una migración futura mal escrita no
 * pasan por Zod. Estos checks prueban la defensa de abajo.
 *
 * Corre dentro de una transacción que SIEMPRE se revierte: no deja datos.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
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

const COLS =
  '(nombre, categoria_id, direccion, barrio, latitud, longitud, whatsapp, ' +
  'acepto_terminos, acepto_habeas_data, version_terminos)';

/** Registro de referencia: válido en todos sus campos. Cada caso lo deforma en uno solo. */
const VALIDO = {
  nombre: 'Panadería La Esperanza',
  categoria_id: 'alimentacion',
  direccion: 'Calle 70 #45-12',
  barrio: 'Manrique Central',
  latitud: 6.273126,
  longitud: -75.545286,
  whatsapp: '3001234567',
  acepto_terminos: true,
  acepto_habeas_data: true,
  version_terminos: '2026-01-v1',
};

function insertar(cambios = {}) {
  const r = { ...VALIDO, ...cambios };
  return {
    sql: `insert into portafolios ${COLS} values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    params: [
      r.nombre, r.categoria_id, r.direccion, r.barrio, r.latitud, r.longitud,
      r.whatsapp, r.acepto_terminos, r.acepto_habeas_data, r.version_terminos,
    ],
  };
}

const CASOS = [
  {
    // La ubicación ya no se limita a Manrique (migración 006): esto tiene que
    // ACEPTARSE. Es el mismo control positivo que el caso de abajo, con una
    // coordenada real de otra ciudad — prueba justamente que el bbox viejo no
    // sigue vivo en algún lado.
    caso: 'coordenadas fuera de Manrique (Bogotá) — ahora válidas',
    debePasar: true,
    ...insertar({ latitud: 4.65, longitud: -74.05 }),
  },
  {
    caso: 'latitud fuera del rango real (91)',
    debePasar: false,
    ...insertar({ latitud: 91 }),
  },
  {
    caso: 'longitud fuera del rango real (-181)',
    debePasar: false,
    ...insertar({ longitud: -181 }),
  },
  {
    caso: 'sin ningún medio de contacto',
    debePasar: false,
    ...insertar({ whatsapp: null }),
  },
  {
    caso: 'sin aceptar habeas data',
    debePasar: false,
    ...insertar({ acepto_habeas_data: false }),
  },
  {
    caso: 'sin aceptar términos',
    debePasar: false,
    ...insertar({ acepto_terminos: false }),
  },
  {
    caso: 'categoría inexistente',
    debePasar: false,
    ...insertar({ categoria_id: 'no-existe' }),
  },
  {
    caso: 'nombre de 1 carácter',
    debePasar: false,
    ...insertar({ nombre: 'X' }),
  },
  {
    caso: 'correo sin arroba',
    debePasar: false,
    ...insertar({ whatsapp: null, correo: 'noesuncorreo' }),
    sql: `insert into portafolios (nombre, categoria_id, direccion, barrio, latitud, longitud, correo, acepto_terminos, acepto_habeas_data, version_terminos) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    params: [
      VALIDO.nombre, VALIDO.categoria_id, VALIDO.direccion, VALIDO.barrio,
      VALIDO.latitud, VALIDO.longitud, 'noesuncorreo', true, true, VALIDO.version_terminos,
    ],
  },
  {
    caso: 'rechazado sin motivo',
    debePasar: false,
    sql: `insert into portafolios (nombre, categoria_id, direccion, barrio, latitud, longitud, whatsapp, acepto_terminos, acepto_habeas_data, version_terminos, estado, moderado_en) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'rechazado',now())`,
    params: [
      VALIDO.nombre, VALIDO.categoria_id, VALIDO.direccion, VALIDO.barrio,
      VALIDO.latitud, VALIDO.longitud, VALIDO.whatsapp, true, true, VALIDO.version_terminos,
    ],
  },
  // Control positivo: sin esto, un constraint que rechaza TODO también pasaría
  // los nueve casos de arriba y el test no probaría nada.
  {
    caso: 'CONTROL — registro válido',
    debePasar: true,
    ...insertar(),
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

    for (const { caso, sql, params, debePasar } of CASOS) {
      // Savepoint por caso: un insert rechazado aborta la transacción en
      // Postgres, y sin esto el segundo caso fallaría por arrastre del primero.
      await cliente.query('savepoint sp');

      let paso;
      let detalle = '';
      try {
        await cliente.query(sql, params);
        paso = true;
        await cliente.query('rollback to savepoint sp');
      } catch (e) {
        paso = false;
        detalle = e.message.split('\n')[0];
        await cliente.query('rollback to savepoint sp');
      }

      const ok = paso === debePasar;
      if (!ok) fallos++;

      const marca = ok ? 'ok  ' : 'FALLO';
      const accion = debePasar ? 'acepta  ' : 'rechaza ';
      console.log(`  ${marca} ${accion} ${caso}`);
      if (!ok && detalle) console.log(`        → ${detalle}`);
    }
  } finally {
    // Siempre se revierte: el script no deja datos en ningún caso.
    await cliente.query('rollback').catch(() => {});
    cliente.release();
    await pool.end();
  }

  console.log(
    fallos === 0
      ? `\n${CASOS.length}/${CASOS.length} correctos.`
      : `\n${fallos} de ${CASOS.length} fallaron.`,
  );
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
