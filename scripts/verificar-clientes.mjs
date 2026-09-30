#!/usr/bin/env node
/**
 * Comprueba que ninguna consulta de lib/db/clientes.repo.ts olvide filtrar
 * por el dueño del negocio.
 *
 *   node scripts/verificar-clientes.mjs
 *
 * Es el único filtro entre un aliado y los clientes de otro: los ids llegan
 * del navegador y se pueden inventar. Lectura estática del archivo, sin base.
 */

import { readFileSync } from 'node:fs';

const fuente = readFileSync(new URL('../lib/db/clientes.repo.ts', import.meta.url), 'utf8');
const consultas = [...fuente.matchAll(/sql`([\s\S]*?)`/g)].map((m) => m[1]);

const problemas = [];
if (consultas.length === 0) problemas.push('no se encontró ninguna consulta: ¿cambió el archivo?');
consultas.forEach((q, i) => {
  if (!/p\.usuario_id\s*=\s*\$\{usuarioId\}/.test(q)) {
    problemas.push(`consulta ${i + 1} sin «p.usuario_id = \${usuarioId}»:\n${q.trim().split('\n')[0]}`);
  }
});

if (problemas.length > 0) {
  console.error(`✗ clientes: ${problemas.length} problema(s)\n  - ${problemas.join('\n  - ')}`);
  process.exit(1);
}
console.log(`✓ clientes: las ${consultas.length} consultas filtran por el dueño del negocio`);
