// Verifica el contenido de /presencia (lib/presencia.ts) antes de que llegue a producción.
//
// Es contenido editorial escrito a mano y crece con cada guía nueva: lo que se
// rompe en silencio es una lámina que no existe (imagen rota en pantalla) o un
// título repetido (React lo usa como `key` y mezcla tarjetas). Esto lo atrapa.
//
// Uso: npm run verificar   (o: node --experimental-strip-types scripts/verificar-presencia.mjs)

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { GRUPOS, GUIAS } from '../lib/presencia.ts';

const problemas = [];
const falla = (donde, que) => problemas.push(`${donde}: ${que}`);

const repetidos = (lista) => lista.filter((x, i) => lista.indexOf(x) !== i);
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const existe = (src) => existsSync(join(RAIZ, 'public', src));

for (const dup of repetidos(GUIAS.map((g) => g.slug))) falla('guías', `slug repetido «${dup}»`);

for (const grupo of GRUPOS) {
  if (!GUIAS.some((g) => g.grupo === grupo.id)) falla(`grupo ${grupo.id}`, 'no tiene ninguna guía');
}

for (const guia of GUIAS) {
  const en = `guía ${guia.slug}`;

  if (!GRUPOS.some((g) => g.id === guia.grupo)) falla(en, `grupo desconocido «${guia.grupo}»`);
  if (guia.laminas.length === 0) falla(en, 'sin lámina original');
  for (const { src } of guia.laminas) if (!existe(src)) falla(en, `falta la lámina ${src}`);

  for (const dup of repetidos(guia.secciones.map((s) => s.kicker))) {
    falla(en, `dos secciones con el mismo encabezado «${dup}»`);
  }

  for (const seccion of guia.secciones) {
    const dentro = `${en} › ${seccion.kicker}`;

    // Lo que Secciones.tsx usa como `key`.
    const claves =
      seccion.tipo === 'checklist' || seccion.tipo === 'frases'
        ? seccion.items
        : seccion.tipo === 'comparacion'
          ? []
          : seccion.items.map((i) => i.titulo);
    for (const dup of repetidos(claves)) falla(dentro, `elemento repetido «${dup}»`);

    if (seccion.tipo !== 'comparacion' && seccion.items.length === 0) falla(dentro, 'sin elementos');

    const imagenes =
      seccion.tipo === 'tarjetas'
        ? seccion.items.map((i) => i.imagen)
        : seccion.tipo === 'comparacion'
          ? [seccion.mal.imagen, seccion.bien.imagen]
          : [];
    for (const img of imagenes.filter(Boolean)) {
      if (!existe(img.src)) falla(dentro, `falta la imagen ${img.src}`);
      if (!img.alt.trim()) falla(dentro, `imagen sin texto alternativo ${img.src}`);
    }
  }
}

if (problemas.length > 0) {
  console.error(`✗ presencia: ${problemas.length} problema(s)\n  - ${problemas.join('\n  - ')}`);
  process.exit(1);
}
console.log(`✓ presencia: ${GUIAS.length} guías, láminas e imágenes presentes, sin claves repetidas`);
