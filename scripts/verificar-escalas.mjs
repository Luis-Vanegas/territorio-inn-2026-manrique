#!/usr/bin/env node
/**
 * Self-check de las escalas de color de Firmamento (lib/escalaSecuencial.ts): el
 * mapa de barrios y la matriz de confusión.
 *
 *   node --experimental-strip-types scripts/verificar-escalas.mjs
 *
 * Sin base de datos. Falla si, en cualquiera de las dos escalas:
 *  - el número que va sobre una celda no llega a 4,5:1 contra su relleno;
 *  - el relleno no se aclara de una clase a la siguiente (deja de ser secuencial)
 *    o dos clases vecinas casi no se distinguen;
 *  - las clases dejan huecos o se pisan, o el clasificador cae en otra clase en
 *    los bordes.
 */

import assert from 'node:assert/strict';
import {
  CLASES_BARRIO,
  CLASES_PROPORCION,
  claseDeBarrio,
  claseDeProporcion,
  contraste,
} from '../lib/escalaSecuencial.ts';

function revisar(nombre, clases, clasificar) {
  for (const c of clases) {
    const r = contraste(c.relleno, c.texto);
    assert.ok(r >= 4.5, `${nombre} «${c.etiqueta}»: texto ${c.texto} sobre ${c.relleno} da ${r.toFixed(2)}:1 (mínimo 4,5)`);
  }

  // Secuencial: cada relleno es más claro que el anterior. Se mide contra `noche`
  // (la más oscura): la razón crece cuanto más claro es el tono.
  const contraNoche = clases.map((c) => contraste(c.relleno, '#0B1026'));
  for (let i = 1; i < clases.length; i++) {
    assert.ok(contraNoche[i] > contraNoche[i - 1], `${nombre} «${clases[i].etiqueta}» no es más claro que la clase anterior`);
    assert.ok(
      contraste(clases[i].relleno, clases[i - 1].relleno) >= 1.2,
      `${nombre} «${clases[i - 1].etiqueta}» y «${clases[i].etiqueta}» casi no se distinguen`,
    );
  }

  // Sin huecos ni solapes: cada clase empieza donde termina la anterior.
  for (let i = 1; i < clases.length; i++) {
    assert.equal(clases[i].desde, clases[i - 1].hasta + 1, `${nombre}: hueco o solape antes de «${clases[i].etiqueta}»`);
  }
  assert.equal(clases.at(-1).hasta, null, `${nombre}: la última clase no tiene tope`);
  for (const c of clases) {
    assert.equal(clasificar(c.desde), c, `${nombre}: clasificar(${c.desde})`);
    if (c.hasta !== null) assert.equal(clasificar(c.hasta), c, `${nombre}: clasificar(${c.hasta})`);
  }

  return clases.map((c) => `${c.etiqueta} ${contraste(c.relleno, c.texto).toFixed(1)}:1`).join(' · ');
}

const barrios = revisar('barrios', CLASES_BARRIO, claseDeBarrio);
assert.equal(claseDeBarrio(178).etiqueta, '50 o más');

const matriz = revisar('matriz', CLASES_PROPORCION, claseDeProporcion);
assert.equal(claseDeProporcion(0).etiqueta, 'Ninguno');
assert.equal(claseDeProporcion(0.3).etiqueta, 'Hasta 5 %', 'un error raro no se pierde: 0,3 % ya se ve');
assert.equal(claseDeProporcion(100).etiqueta, 'Más de 55 %');

console.log(`barrios: ${barrios}
matriz: ${matriz}
escalas OK`);
