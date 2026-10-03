#!/usr/bin/env node
/**
 * Una entidad (JAL, CEDEZO, SENA…) NUNCA lee negocios fila por fila: solo
 * agregados k = 5 (`obtenerDatosAbiertos`, que ya revisa verificar-datos-k.mjs)
 * y convocatorias. Este verificador lee lib/db/entidades.repo.ts y falla si:
 *  - una consulta nombra una tabla de negocios o de personas que no le toca;
 *  - `entidadesDeUsuario` (la que autoriza el panel) no filtra por la sesión.
 *
 *   node scripts/verificar-entidades.mjs
 *
 * Lectura estática, sin base. Si una consulta nueva de entidades necesita datos
 * de negocios, va en datos.repo.ts y pasa por `suprimir()`, no acá.
 */

import { readFileSync } from 'node:fs';

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

if (problemas.length > 0) {
  console.error(`✗ entidades: ${problemas.length} problema(s)\n  - ${problemas.join('\n  - ')}`);
  process.exit(1);
}
console.log(`✓ entidades: las ${consultas.length} consultas no leen negocios y la membresía filtra por la sesión`);
