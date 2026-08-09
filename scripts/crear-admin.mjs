#!/usr/bin/env node
/**
 * Alta de un moderador del panel.
 *
 *   npm run db:admin -- --email ana@itm.edu.co --nombre "Ana Restrepo"
 *
 * El password se pide por consola con el eco apagado y nunca se pasa como
 * argumento: los argumentos quedan en el historial del shell y en la lista de
 * procesos, donde cualquiera del equipo los puede leer.
 *
 * Si el email ya existe, actualiza el password (sirve para resetear).
 */

import { readFileSync } from 'node:fs';
import { scryptSync, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
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

function leerArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 2) {
    const clave = argv[i]?.replace(/^--/, '');
    if (clave) args[clave] = argv[i + 1];
  }
  return args;
}

/** Debe coincidir con hashPassword() de lib/auth/admin.ts. */
function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/** Prompt sin eco: el password no queda visible en pantalla ni en el scrollback. */
function pedirPassword(mensaje) {
  return new Promise((resolveP, reject) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const alEscribir = (char) => {
      // Se reescribe la línea sin los caracteres tipeados.
      if (!['\n', '\r', ''].includes(char.toString())) {
        process.stdout.write(`\x1b[2K\x1b[200D${mensaje}`);
      }
    };
    process.stdin.on('data', alEscribir);

    rl.question(mensaje, (valor) => {
      process.stdin.removeListener('data', alEscribir);
      rl.close();
      process.stdout.write('\n');
      resolveP(valor);
    });
    rl.on('SIGINT', () => { rl.close(); reject(new Error('Cancelado')); });
  });
}

async function main() {
  cargarEnv();

  const { email, nombre } = leerArgs(process.argv);

  if (!email || !nombre) {
    console.error('Uso: npm run db:admin -- --email <correo> --nombre "<nombre>"');
    process.exit(1);
  }
  if (!email.includes('@')) {
    console.error('El email no parece válido.');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL.');
    process.exit(1);
  }

  const password = await pedirPassword(`Password para ${email}: `);
  const confirmacion = await pedirPassword('Repetir password: ');

  if (password !== confirmacion) {
    console.error('Los passwords no coinciden.');
    process.exit(1);
  }
  // 12 caracteres para una cuenta que modera contenido público y se comparte
  // por WhatsApp entre tres personas. No es paranoia, es proporcional.
  if (password.length < 12) {
    console.error('Mínimo 12 caracteres.');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const hash = hashPassword(password);

  const filas = await sql`
    insert into admins (email, nombre, password_hash)
    values (${email.toLowerCase().trim()}, ${nombre}, ${hash})
    on conflict (email) do update
      set password_hash = excluded.password_hash,
          nombre        = excluded.nombre,
          activo        = true
    returning email, (xmax = 0) as fue_creado
  `;

  const fila = filas[0];
  console.log(fila.fue_creado
    ? `Moderador creado: ${fila.email}`
    : `Password actualizado: ${fila.email}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
