#!/usr/bin/env node
/**
 * Nadie entra donde no debe. Lectura estática (sin base ni servidor) de:
 *
 *  1. Cada `page.tsx`, `layout.tsx` y `route.ts` de Firmamento con sesión
 *     (`app/(firmamento)/firmamento/{negocio,equipo,entidad}/**`) llama la guarda
 *     de SU rol (`exigirNegocio`, `exigirEquipo`, `exigirEntidad`). Un layout no
 *     alcanza (lib/auth/firmamento.ts): la guarda va en cada archivo. Lo que está
 *     fuera de esas carpetas tiene que estar en PUBLICAS, con su razón.
 *  2. Cada Server Action exportada de `lib/actions/` revalida la sesión en su
 *     propio cuerpo, o está en ACCIONES_PUBLICAS con su razón. Una action es un
 *     endpoint HTTP: se invoca sin pasar por la página.
 *  3. Los route handlers de `app/api/admin/**` llaman `verificarSesion`.
 *  4. Regresión de la confusión de cookies: `verificarSesion` exige `email` de
 *     tipo string y que el moderador siga activo en la base.
 *  5. El token de invitación: forma, entropía y que lo guardado sea su hash.
 *
 *   node --experimental-strip-types scripts/verificar-accesos.mjs
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  FORMATO_TOKEN_INVITACION,
  generarTokenInvitacion,
  hashTokenInvitacion,
  tokenInvitacionValido,
} from '../lib/auth/invitacion.ts';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const problemas = [];
const leer = (ruta) => readFileSync(join(RAIZ, ruta), 'utf8');
const rel = (abs) => relative(RAIZ, abs).split(sep).join('/');

function archivos(dir, filtro) {
  const salida = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...archivos(ruta, filtro));
    else if (filtro(nombre)) salida.push(ruta);
  }
  return salida;
}

// ── 1 · Páginas, layouts y rutas de Firmamento ─────────────────

const FIRMAMENTO = join(RAIZ, 'app', '(firmamento)', 'firmamento');
const GUARDA = { negocio: 'exigirNegocio', equipo: 'exigirEquipo', entidad: 'exigirEntidad' };

/** Sin guarda A PROPÓSITO. Agregar acá exige una razón. */
const PUBLICAS = {
  'app/(firmamento)/firmamento/layout.tsx': 'armazón común; solo lee la sesión para el encabezado',
  'app/(firmamento)/firmamento/entrar/page.tsx': 'la puerta: la abre quien no tiene sesión',
  'app/(firmamento)/firmamento/invitacion/[token]/page.tsx': 'la abre quien todavía no tiene cuenta; no da acceso, el consumo es en el retorno de Google',
};

const esEntrada = (n) => n === 'page.tsx' || n === 'layout.tsx' || n === 'route.ts';
let revisadas = 0;
for (const abs of archivos(FIRMAMENTO, esEntrada)) {
  const ruta = rel(abs);
  const rol = ruta.split('/')[3];
  const guarda = GUARDA[rol];
  revisadas++;
  if (!guarda) {
    if (!PUBLICAS[ruta]) problemas.push(`${ruta}: está fuera de negocio/equipo/entidad y no está en PUBLICAS`);
    continue;
  }
  if (!new RegExp(`\\b${guarda}\\(`).test(readFileSync(abs, 'utf8'))) {
    problemas.push(`${ruta}: no llama ${guarda}() (un layout no alcanza: la guarda va en cada página y ruta)`);
  }
}
for (const ruta of Object.keys(PUBLICAS)) {
  try {
    statSync(join(RAIZ, ruta));
  } catch {
    problemas.push(`PUBLICAS nombra ${ruta}, que ya no existe: sácala de la lista`);
  }
}

// ── 2 · Server Actions ─────────────────────────────────────────

const GUARDA_ACCION = /\b(verificarSesion|sesionActual|entidadDeSesion|exigir(?:Negocio|Equipo|Entidad))\(/;

/** archivo:función → por qué no pide sesión. */
const ACCIONES_PUBLICAS = {
  'consultarAsesor:consultarAsesor': 'token del enlace del negocio + cupo de agente',
  'geocodificarDireccion:geocodificarDireccionAction': 'botón del registro (vecino y equipo) y de las ediciones, con cupo propio',
  'gestionarEstado:actualizarPortafolio': 'token del enlace (/aliados/estado/[token]) + cupo de estado',
  'gestionarEstado:borrarPortafolio': 'token del enlace (/aliados/estado/[token]) + cupo de estado',
  'registrarCandidato:registrarCandidato': 'registro público con cupo',
  'registrarPeticion:registrarPeticion': 'buzón público con cupo',
  'sesionAdmin:iniciarSesion': 'el login mismo, con cupo de login',
  'sesionFirmamento:salirDeFirmamento': 'cerrar sesión no necesita sesión',
  'sesionUsuario:salir': 'cerrar sesión no necesita sesión',
};

let acciones = 0;
const vistas = new Set();
for (const abs of archivos(join(RAIZ, 'lib', 'actions'), (n) => n.endsWith('.ts'))) {
  const fuente = readFileSync(abs, 'utf8');
  const archivo = rel(abs).replace(/^lib\/actions\//, '').replace(/\.ts$/, '');
  // Cada función exportada hasta la siguiente declaración de primer nivel.
  for (const m of fuente.matchAll(/^export async function (\w+)[\s\S]*?(?=^export |^async function |^function |^const |(?![\s\S]))/gm)) {
    const clave = `${archivo}:${m[1]}`;
    acciones++;
    vistas.add(clave);
    if (ACCIONES_PUBLICAS[clave]) continue;
    if (!GUARDA_ACCION.test(m[0])) {
      problemas.push(`lib/actions/${archivo}.ts › ${m[1]}: no revalida la sesión en su cuerpo (ni está en ACCIONES_PUBLICAS)`);
    }
  }
}
for (const clave of Object.keys(ACCIONES_PUBLICAS)) {
  if (!vistas.has(clave)) problemas.push(`ACCIONES_PUBLICAS nombra ${clave}, que ya no existe: sácala de la lista`);
}
if (acciones < 20) problemas.push(`solo se encontraron ${acciones} actions: ¿cambió el formato de lib/actions/?`);

// ── 3 · Rutas de API del equipo ────────────────────────────────

for (const abs of archivos(join(RAIZ, 'app', 'api', 'admin'), (n) => n === 'route.ts')) {
  if (!/\bverificarSesion\(/.test(readFileSync(abs, 'utf8'))) {
    problemas.push(`${rel(abs)}: un route handler no pasa por ningún layout; tiene que llamar verificarSesion()`);
  }
}

// ── 4 · Confusión de cookies ───────────────────────────────────

const admin = leer('lib/auth/admin.ts');
const cuerpoVerificar = admin.slice(admin.indexOf('export async function verificarSesion'));
if (!/typeof email !== 'string'/.test(cuerpoVerificar)) {
  problemas.push(
    'lib/auth/admin.ts › verificarSesion: no exige `email` string. `sesion_usuario` se firma con el mismo secreto: sin eso, la cookie de un vecino abre el panel',
  );
}
if (!/moderadorActivo\(/.test(cuerpoVerificar)) {
  problemas.push('lib/auth/admin.ts › verificarSesion: no comprueba `activo` en la base; desactivar a un moderador no le quitaría la sesión');
}
if (!/typeof datos\.id !== 'string'/.test(leer('lib/auth/usuario.ts'))) {
  problemas.push('lib/auth/usuario.ts › sesionActual: no exige `id` string (la cookie del equipo pasaría por la de un vecino)');
}

// ── 5 · Token de invitación ────────────────────────────────────

try {
  const a = generarTokenInvitacion();
  const b = generarTokenInvitacion();
  assert.match(a, FORMATO_TOKEN_INVITACION, 'el token generado tiene la forma esperada');
  assert.notEqual(a, b, 'dos tokens seguidos son distintos');
  assert.equal(Buffer.from(a, 'base64url').length, 32, '256 bits de entropía');
  assert.match(hashTokenInvitacion(a), /^[0-9a-f]{64}$/, 'se guarda el sha256 en hex (el CHECK de la 035)');
  assert.notEqual(hashTokenInvitacion(a), a, 'lo guardado no es el token');
  assert.equal(tokenInvitacionValido(a), a);
  for (const malo of [null, '', 'corto', `${a}x`, `${a.slice(0, 42)}/`, '../'.repeat(15), 42]) {
    assert.equal(tokenInvitacionValido(malo), null, `rechaza ${JSON.stringify(malo)}`);
  }
} catch (e) {
  problemas.push(`lib/auth/invitacion.ts: ${e.message}`);
}

// El enlace de una invitación es un acceso: no se escribe en logs.
for (const ruta of ['lib/actions/gestionarInvitaciones.ts', 'lib/db/invitaciones.repo.ts', 'app/api/auth/google/retorno/route.ts']) {
  for (const linea of leer(ruta).split('\n')) {
    if (/console\.\w+\(.*\b(token|enlace|invitacion)\b/.test(linea)) problemas.push(`${ruta}: un log nombra el token o el enlace: ${linea.trim()}`);
  }
}

if (problemas.length) {
  console.error(`verificar-accesos: ${problemas.length} problema(s)`);
  for (const p of problemas) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`verificar-accesos: ${revisadas} páginas/rutas de Firmamento y ${acciones} Server Actions con su guarda; sesión y token de invitación en orden.`);
