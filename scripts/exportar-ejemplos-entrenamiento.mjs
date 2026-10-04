#!/usr/bin/env node
/**
 * Exporta los ejemplos propios del sitio para reentrenar el sugeridor de categoría
 * (`pipeline/03_clasificador.py` los suma si el archivo existe).
 *
 *   node scripts/exportar-ejemplos-entrenamiento.mjs
 *
 * Salida: `pipeline/datos/ejemplos_constelaciones.json` (en `.gitignore`: son datos
 * de la base, no van al repo).
 *
 * Qué entra: fichas `aprobado` con categoría distinta de «Otros». Aprobada = un
 * moderador la miró; «Otros» se excluye porque no es una categoría, es la ausencia
 * de una (y el sugeridor nunca la propone). Por cada ficha: nombre, descripción y
 * categoría final (la de DESPUÉS de las correcciones, que es la verdad que importa),
 * más una marca de si el equipo decidió sobre ella en la moderación.
 *
 * Qué NO entra, nunca: contactos, direcciones, coordenadas, ids (de ficha o de
 * usuario), tokens, `campos_extra`. Por eso el SELECT nombra sus columnas una a
 * una: un `select *` acá filtraría datos personales el día que alguien agregue
 * una columna. Solo lectura; no escribe en la base.
 *
 * DATABASE_URL: la del entorno le gana a .env.local (y .env.local puede apuntar a
 * PRODUCCIÓN). Para una rama de Neon, pásala inline.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'pipeline', 'datos', 'ejemplos_constelaciones.json');

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

const sql = neon(process.env.DATABASE_URL);

// `decision_equipo`: la más reciente del equipo sobre esa ficha (usada, corregida,
// mantenida) o null si nadie la revisó con el sugeridor.
const filas = await sql`
  select
    p.nombre,
    coalesce(p.descripcion, '') as descripcion,
    p.categoria_id as categoria,
    (
      select s.decision_equipo
      from sugerencias_categoria s
      where s.portafolio_id = p.id and s.origen = 'moderacion'
      order by s.creado_en desc, s.id desc
      limit 1
    ) as decision_equipo
  from portafolios p
  where p.estado = 'aprobado' and p.categoria_id <> 'otros'
  order by p.categoria_id, p.nombre
`;

const ejemplos = filas.map((f) => ({
  nombre: String(f.nombre).trim(),
  descripcion: String(f.descripcion).trim(),
  categoria: f.categoria,
  decision_equipo: f.decision_equipo ?? null,
}));

const porCategoria = {};
for (const e of ejemplos) porCategoria[e.categoria] = (porCategoria[e.categoria] ?? 0) + 1;

mkdirSync(dirname(DESTINO), { recursive: true });
writeFileSync(
  DESTINO,
  JSON.stringify(
    {
      fuente: 'Base de Constelaciones · Manrique: portafolios aprobados con categoría distinta de «otros»',
      fecha_corrida: new Date().toISOString(),
      n: ejemplos.length,
      con_decision_equipo: ejemplos.filter((e) => e.decision_equipo !== null).length,
      por_categoria: porCategoria,
      ejemplos,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

console.log(`${ejemplos.length} ejemplos -> pipeline/datos/ejemplos_constelaciones.json`);
for (const [c, n] of Object.entries(porCategoria)) console.log(`  ${c}: ${n}`);
console.log(`con decisión del equipo: ${ejemplos.filter((e) => e.decision_equipo !== null).length}`);
