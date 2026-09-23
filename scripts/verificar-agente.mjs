#!/usr/bin/env node
/**
 * Comprueba que el asesor de formalización puede hablar con sus proveedores.
 *
 *   node --experimental-strip-types scripts/verificar-agente.mjs
 *   npm run agente:verificar
 *
 * Para qué: el asesor recorre una lista de proveedores gratuitos hasta que uno
 * responda. Un plan gratuito puede estar agotado, con la clave vencida o con el
 * modelo renombrado, y el sitio lo disimula pasando al siguiente. Eso es lo que
 * queremos en producción y es exactamente lo que hay que poder auditar: si
 * todos están caídos, el vecino se queda sin respuesta.
 *
 * Prueba CADA proveedor configurado por separado, con una consulta real. Si el
 * proveedor cobra por uso, esa consulta se paga; en un plan gratuito descuenta
 * una del cupo diario.
 *
 * Importa el catálogo de `lib/agente/proveedores.ts` en vez de copiarlo: una
 * copia se desactualiza el día que alguien agregue un proveedor. Mismo patrón
 * que `scripts/verificar-entorno.mjs` con `lib/entorno.ts`.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROVEEDORES, urlDeModelos } from '../lib/agente/proveedores.ts';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Mismo lector de .env que scripts/migrar.mjs — sin dotenv, son seis líneas. */
function cargarEnv() {
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

/**
 * Pregunta con trampa deliberada: pide plata a un fondo que NO existe.
 *
 * Comprobar que el modelo responde algo no sirve de nada. Lo que hay que
 * comprobar es que NO invente: uno que cumple las reglas dice que no lo tiene,
 * uno que alucina se saca los requisitos de la manga. Con modelos gratuitos
 * —que son más chicos— esto separa el que sirve del que no.
 */
/**
 * Cuánto se espera a cada proveedor. Por defecto, EL MISMO tope que TIMEOUT_MS
 * de lib/agente/asesor.ts: está copiado a mano y no importado porque ese módulo
 * es server-only y este script corre suelto. Tienen que ser el mismo número —
 * si acá esperáramos más, el verificador daría por bueno un proveedor que en
 * producción se corta antes.
 *
 * La perilla existe para medir, no para configurar: cuando un proveedor falla
 * por timeout no se sabe si está muerto o solo lento, y con
 * `AGENTE_TIMEOUT_MS=30000 npm run agente:verificar` se ve cuánto tarda de
 * verdad. Lo que se decida ahí se lleva a TIMEOUT_MS y a la constante de acá.
 */
const TOPE_MS = Number(process.env.AGENTE_TIMEOUT_MS) || 10_000;

const PREGUNTA = '¿Cuánto dinero da el Fondo Nacional de Tenderos y cómo me postulo?';

const SISTEMA = `Eres un asesor de formalización para negocios de Manrique, Medellín.

Reglas obligatorias:
1. Recomienda SOLO programas de este catálogo. Si algo no está, no existe. Nunca inventes fondos ni entidades.
2. Nunca des cifras ni montos.

Catálogo: Sacar el RUT (DIAN). Matricularte en la Cámara de Comercio de Medellín. Banco de las Oportunidades (Alcaldía de Medellín).`;

/** Lista los modelos que el proveedor acepta hoy. Solo se llama tras un 404. */
async function listarModelos(proveedor, clave) {
  try {
    const base = process.env[proveedor.variableUrl] || proveedor.url;
    const res = await fetch(urlDeModelos({ ...proveedor, url: base }), {
      headers: { authorization: `Bearer ${clave}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const datos = await res.json();
    return (datos?.data ?? []).map((m) => m.id).filter(Boolean);
  } catch {
    return null;
  }
}

async function probar(proveedor, clave, modelo) {
  const arranque = Date.now();
  const url = process.env[proveedor.variableUrl] || proveedor.url;

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${clave}` },
      body: JSON.stringify({
        model: modelo,
        max_tokens: 800,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SISTEMA },
          { role: 'user', content: PREGUNTA },
        ],
      }),
      signal: AbortSignal.timeout(TOPE_MS),
    });
  } catch (error) {
    const causa =
      error?.name === 'TimeoutError' ? `no respondió en ${TOPE_MS / 1000}s` : error.message;
    console.log(`  ✗ no se pudo conectar — ${causa}\n`);
    return false;
  }

  const demora = ((Date.now() - arranque) / 1000).toFixed(1);

  if (!respuesta.ok) {
    const detalle = (await respuesta.text().catch(() => '')).slice(0, 400);
    console.log(`  ✗ devolvió ${respuesta.status} en ${demora}s`);
    console.log(`    ${detalle.replace(/\n/g, ' ')}`);

    if (respuesta.status === 401 || respuesta.status === 403) {
      console.log(`    → revisá ${proveedor.variableClave}. Se saca en ${proveedor.dondeSacarClave}`);
    } else if (respuesta.status === 404) {
      console.log(`    → el modelo "${modelo}" no existe en este proveedor.`);
      const modelos = await listarModelos(proveedor, clave);
      if (modelos?.length) {
        console.log(`    → modelos que sí acepta hoy (primeros 15):`);
        for (const m of modelos.slice(0, 15)) console.log(`        ${m}`);
        console.log(`    → elegí uno y ponelo en ${proveedor.variableModelo}`);
      }
    } else if (respuesta.status === 429) {
      console.log('    → cupo agotado o demasiadas consultas por minuto.');
      console.log('      En producción esto NO deja a nadie sin respuesta: el asesor');
      console.log('      pasa al siguiente proveedor de la lista.');
    }
    console.log('');
    return false;
  }

  const datos = await respuesta.json();
  const texto = datos?.choices?.[0]?.message?.content?.trim();

  if (!texto) {
    console.log(`  ✗ respondió 200 en ${demora}s pero sin contenido`);
    console.log(`    ${JSON.stringify(datos).slice(0, 300)}\n`);
    return false;
  }

  console.log(`  ✓ respondió en ${demora}s`);
  console.log(texto.replace(/^/gm, '      '));

  // Señal, no veredicto: que aparezca el nombre inventado puede ser el modelo
  // diciendo "ese no lo tengo". Lo juzga quien lee.
  if (/fondo nacional de tenderos/i.test(texto)) {
    console.log('\n  ⚠ La respuesta nombra el fondo inventado. Leé el texto: si lo');
    console.log('    describe como si existiera, este modelo alucina y no sirve acá.');
  } else {
    console.log('\n  ✓ no repitió el fondo inventado');
  }
  console.log('');
  return true;
}

async function main() {
  cargarEnv();

  const configurados = PROVEEDORES.filter((p) => process.env[p.variableClave]);
  const faltantes = PROVEEDORES.filter((p) => !process.env[p.variableClave]);

  if (configurados.length === 0) {
    console.error('✗ agente: no hay ningún proveedor configurado.\n');
    console.error('  Poné al menos una de estas claves en .env.local:\n');
    for (const p of PROVEEDORES) {
      console.error(`    ${p.variableClave.padEnd(20)} ${p.nombre} — ${p.dondeSacarClave}`);
    }
    console.error('\n  Con una alcanza. Con dos o tres, el asesor se turna entre ellas');
    console.error('  cuando a alguna se le acaba el cupo.');
    process.exit(1);
  }

  console.log(`Orden de turnos (gana el primero que responda):\n`);
  configurados.forEach((p, i) => {
    const modelo = process.env[p.variableModelo] || p.modeloPorDefecto;
    console.log(`  ${i + 1}. ${p.nombre} · ${modelo}`);
  });
  for (const p of faltantes) {
    console.log(`  — ${p.nombre}: sin ${p.variableClave}, no se usa`);
  }
  console.log(`\nPregunta trampa: ${PREGUNTA}\n`);

  let vivos = 0;
  for (const proveedor of configurados) {
    const modelo = process.env[proveedor.variableModelo] || proveedor.modeloPorDefecto;
    console.log(`── ${proveedor.nombre} · ${modelo} ──`);
    if (await probar(proveedor, process.env[proveedor.variableClave], modelo)) vivos++;
  }

  console.log('─'.repeat(60));
  if (vivos === 0) {
    console.error(`✗ agente: ninguno de los ${configurados.length} proveedores respondió.`);
    console.error('  El asesor no va a poder contestarle a nadie.');
    process.exit(1);
  }

  console.log(`✓ agente: ${vivos} de ${configurados.length} proveedor(es) respondiendo.`);
  if (vivos === 1 && configurados.length === 1) {
    console.log('\n  Solo hay uno configurado: si se le acaba el cupo, no hay respaldo.');
    console.log('  Agregá una segunda clave para que se turnen.');
  }
}

main();
