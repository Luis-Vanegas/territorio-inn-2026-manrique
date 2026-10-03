#!/usr/bin/env node
/**
 * Una entidad (JAL, CEDEZO, SENA…) NUNCA lee negocios fila por fila: solo
 * agregados k = 5 (`obtenerDatosAbiertos`, que ya revisa verificar-datos-k.mjs)
 * y convocatorias. Este verificador lee lib/db/entidades.repo.ts y falla si:
 *  - una consulta nombra una tabla de negocios o de personas que no le toca;
 *  - `entidadesDeUsuario` (la que autoriza el panel) no filtra por la sesión.
 *
 *   node --experimental-strip-types scripts/verificar-entidades.mjs
 *
 * Además comprueba el panel (`app/(firmamento)/firmamento/entidad/**`): solo puede
 * importar repos de agregados, y la descarga CSV no deja salir una celda < 5.
 *
 * Lectura estática, sin base. Si una consulta nueva de entidades necesita datos
 * de negocios, va en datos.repo.ts y pasa por `suprimir()`, no acá.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ARCHIVO = 'lib/db/entidades.repo.ts';
const PROHIBIDAS = [
  'portafolios',
  'aliados_investigacion',
  'aliados_consentimiento',
  'interacciones_portafolio',
  'clientes_negocio',
  'sugerencias_categoria',
  'bitacora',
];

const fuente = readFileSync(new URL(`../${ARCHIVO}`, import.meta.url), 'utf8');
const consultas = [...fuente.matchAll(/sql`([\s\S]*?)`/g)].map((m) => m[1]);
const problemas = [];

if (consultas.length === 0) problemas.push(`${ARCHIVO}: no se encontró ninguna consulta: ¿cambió el archivo?`);

consultas.forEach((q, i) => {
  for (const tabla of PROHIBIDAS) {
    if (new RegExp(`\\b${tabla}\\b`).test(q)) {
      problemas.push(`${ARCHIVO}, consulta ${i + 1} lee «${tabla}»: ${q.trim().split(/\r?\n/)[0]}`);
    }
  }
});

const autoriza = fuente.match(/export async function entidadesDeUsuario[\s\S]*?sql`([\s\S]*?)`/);
if (!autoriza) {
  problemas.push(`${ARCHIVO}: no se encontró entidadesDeUsuario`);
} else if (!/m\.usuario_id\s*=\s*\$\{usuarioId\}/.test(autoriza[1])) {
  problemas.push(`${ARCHIVO}: entidadesDeUsuario no filtra «m.usuario_id = \${usuarioId}»`);
}

// ── El panel (app/(firmamento)/firmamento/entidad/**) ───────────────────
// Una entidad ve SOLO agregados k = 5 y convocatorias. Ninguna pantalla ni acción
// del panel puede importar un repo con datos individuales: se comprueba por lista
// PERMITIDA (lo que no está en ella falla), no por una lista de prohibidos que se
// quedaría corta cuando aparezca un repo nuevo.

const PERMITIDOS_PANEL = new Set(['datos.repo', 'convocatorias.repo', 'entidades.repo']);
// La acción de proponer además deja una fila en la bitácora (solo escribe).
const PERMITIDOS_ACCION = new Set(['convocatorias.repo', 'bitacora.repo', 'rateLimit']);

function archivosDe(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) return archivosDe(ruta);
    return /\.(ts|tsx)$/.test(e.name) ? [ruta] : [];
  });
}

/** Lo importado de `@/lib/db/…`, `lib/db/…` o `./neon`, con ruta y tipo de import. */
function importsDeBase(codigo) {
  const salida = [];
  for (const m of codigo.matchAll(/(?:import|export)\s+(type\s+)?[^;]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    const ruta = m[2] ?? m[3];
    if (/(^|\/)lib\/db\//.test(ruta) || /(^|\/)db\/neon$/.test(ruta)) {
      salida.push({ ruta, soloTipo: Boolean(m[1]) });
    }
  }
  return salida;
}

const RAIZ_PANEL = 'app/(firmamento)/firmamento/entidad';
const archivosPanel = archivosDe(fileURLToPath(new URL(`../${RAIZ_PANEL}`, import.meta.url)));
if (archivosPanel.length === 0) problemas.push(`${RAIZ_PANEL}: no se encontró ningún archivo`);

for (const archivo of archivosPanel) {
  const codigo = readFileSync(archivo, 'utf8');
  for (const { ruta } of importsDeBase(codigo)) {
    const nombre = ruta.split('/').pop();
    if (!PERMITIDOS_PANEL.has(nombre)) {
      problemas.push(`${archivo}: importa «${ruta}», un repo que el panel de entidad no puede leer (solo ${[...PERMITIDOS_PANEL].join(', ')})`);
    }
  }
  if (/\bsql\s*`/.test(codigo)) problemas.push(`${archivo}: escribe SQL directo; el panel solo lee por los repos permitidos`);
}

// datos.ts alimenta al observatorio: en la base solo puede leer los datos abiertos.
const DATOS_TS = 'app/(site)/firmamento/datos.ts';
for (const { ruta } of importsDeBase(readFileSync(new URL(`../${DATOS_TS}`, import.meta.url), 'utf8'))) {
  if (ruta.split('/').pop() !== 'datos.repo') problemas.push(`${DATOS_TS}: importa «${ruta}»; /firmamento y el observatorio solo leen datos.repo`);
}

// La acción de proponer: sin repos de negocios, y la entidad sale de la sesión, no del formulario.
const ACCION = 'lib/actions/proponerConvocatoria.ts';
const codigoAccion = readFileSync(new URL(`../${ACCION}`, import.meta.url), 'utf8');
for (const { ruta } of importsDeBase(codigoAccion)) {
  if (!PERMITIDOS_ACCION.has(ruta.split('/').pop())) problemas.push(`${ACCION}: importa «${ruta}», que no le toca`);
}
if (!/entidadDeSesion\(\)/.test(codigoAccion)) problemas.push(`${ACCION}: no resuelve la entidad con entidadDeSesion()`);
if (/formData\.get\(\s*['"]entidad/.test(codigoAccion) || /entidad_id['"]/.test(codigoAccion)) {
  problemas.push(`${ACCION}: lee la entidad del formulario; tiene que salir de la membresía de la sesión`);
}
if (/entidad/.test(readFileSync(new URL('../lib/validation/convocatoria.schema.ts', import.meta.url), 'utf8').match(/propuestaConvocatoriaSchema = z\.object\(\{[\s\S]*?\n\}\);/)?.[0] ?? '')) {
  problemas.push('lib/validation/convocatoria.schema.ts: propuestaConvocatoriaSchema tiene un campo «entidad»; la entidad no se elige en el formulario');
}

// La descarga CSV solo reordena lo que ya pasó por k = 5: una celda «<5» sigue «<5».
const { datosACsv, filasPlanas } = await import('../lib/firmamento/datosAbiertos.ts');
const demo = {
  version: 1,
  generado_en: '2026-10-02T12:00:00.000Z',
  k_minimo: 5,
  fuente: 'prueba',
  nota_privacidad: 'prueba',
  negocios_aprobados: 12,
  por_categoria: [
    { id: 'comida', nombre: 'Comida, «con coma», y "comillas"', negocios: 7 },
    { id: 'salud', nombre: 'Salud', negocios: '<5' },
  ],
  por_barrio: [{ nombre: 'El Raizal', negocios: '<5' }],
  por_formalidad: [{ id: 'rut_camara', negocios: 6 }],
  por_mayor_dolor: [{ id: 'otro', negocios: '<5' }],
};
const csv = datosACsv(demo);
const lineas = csv.replace(/^﻿/, '').trim().split('\r\n');
if (lineas[0] !== 'dimension,id,nombre,negocios') problemas.push(`CSV de datos: encabezado inesperado «${lineas[0]}»`);
const planas = filasPlanas(demo);
if (planas.length !== lineas.length - 1) problemas.push('CSV de datos: no tiene una línea por cada celda');
for (const f of planas) {
  const ok = f.negocios === '<5' || (Number.isInteger(f.negocios) && f.negocios >= 5);
  if (!ok) problemas.push(`CSV de datos: la celda ${f.dimension}/${f.id} sale como ${JSON.stringify(f.negocios)} (debe ser entero >= 5 o «<5»)`);
}
if (!csv.includes('"Comida, «con coma», y ""comillas"""')) problemas.push('CSV de datos: no escapa comas ni comillas');
if (!lineas.some((l) => l.endsWith(',<5'))) problemas.push('CSV de datos: una celda «<5» dejó de salir como «<5»');

if (problemas.length > 0) {
  console.error(`✗ entidades: ${problemas.length} problema(s)\n  - ${problemas.join('\n  - ')}`);
  process.exit(1);
}
console.log(
  `✓ entidades: las ${consultas.length} consultas no leen negocios, la membresía filtra por la sesión y ` +
    `los ${archivosPanel.length} archivos del panel solo importan repos de agregados`,
);
