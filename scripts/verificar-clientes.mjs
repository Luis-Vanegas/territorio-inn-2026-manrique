#!/usr/bin/env node
/**
 * Comprueba que ninguna consulta de lib/db/clientes.repo.ts ni de
 * lib/db/cuenta.repo.ts (panel del negocio: categorías, semanas de vistas y contactos, comparación con la categoría) olvide
 * filtrar por el dueño del negocio.
 *
 *   node scripts/verificar-clientes.mjs
 *
 * Es el único filtro entre un aliado y los clientes de otro: los ids llegan
 * del navegador y se pueden inventar. Lectura estática del archivo, sin base.
 */

import { readFileSync } from 'node:fs';

const ARCHIVOS = ['clientes', 'cuenta'].map((n) => `lib/db/${n}.repo.ts`);

const problemas = [];
let total = 0;
for (const archivo of ARCHIVOS) {
  const fuente = readFileSync(new URL(`../${archivo}`, import.meta.url), 'utf8');
  const consultas = [...fuente.matchAll(/sql`([\s\S]*?)`/g)].map((m) => m[1]);
  total += consultas.length;
  if (consultas.length === 0) problemas.push(`${archivo}: no se encontró ninguna consulta: ¿cambió el archivo?`);
  consultas.forEach((q, i) => {
    if (!/p\.usuario_id\s*=\s*\$\{usuarioId\}/.test(q)) {
      const primera = q.trim().split(/\r?\n/)[0];
      problemas.push(`${archivo}, consulta ${i + 1} sin «p.usuario_id = \${usuarioId}»: ${primera}`);
    }
  });
}

if (problemas.length > 0) {
  console.error(`✗ clientes: ${problemas.length} problema(s)\n  - ${problemas.join('\n  - ')}`);
  process.exit(1);
}
console.log(`✓ clientes y cuenta: las ${total} consultas filtran por el dueño del negocio`);
