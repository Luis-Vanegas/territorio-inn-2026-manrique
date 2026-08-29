// Falla si aparece voseo en texto visible al usuario.
//
// AGENTS.md pide español colombiano en registro "tú". El voseo ya se coló
// tres veces —en lib/actions, en la página de Servicios y en la de
// autogestión— y las tres se "verificó a mano" que estaba limpio. Un chequeo
// que depende de que alguien se acuerde de correrlo con la lista correcta no
// es un chequeo.
//
// ── Cómo detecta ──
//
// No usa una lista de verbos: usa el patrón. El voseo acentúa la última
// sílaba donde el "tú" no lo hace — imperativo (pedí, acordá, evitá) y
// presente (podés, tenés, atendés, prestás). Así que toda palabra terminada
// en á/é/í, con una "s" opcional, es candidata. La lista de abajo es de
// PALABRAS CORRIENTES que también terminan así (además, después, aquí,
// Valdés) — se descartan esas, no se enumeran los verbos. Esa diferencia es
// la que hace que encuentre lo que nadie previó.
//
// ── Trampa que costó dos rondas ──
//
// NO usar \b después de una vocal acentuada. En JavaScript \w es solo ASCII,
// así que \b "corta" entre la tilde y la letra siguiente: /\w+[áéí]\b/ marca
// «Datá» dentro de «Datáfono» y «Medellí» dentro de «Medellín». Hay que
// exigir a mano, con un lookahead, que no siga otra letra. El mismo error en
// grep dejó pasar voseo dos veces antes de escribir esto.
//
// ── Lo que NO detecta ──
//
// El voseo con pronombre pegado —"reportalo", "contanos", "escribilo"— no
// lleva tilde. La regla existe (en "tú" esas formas SIEMPRE la llevan:
// repórtalo, cuéntanos, escríbelo), pero aplicarla sin marcar mil falsos
// positivos como "detalle" o "pasteles" pide un analizador morfológico.
// Esas van a ojo.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const RAICES = ['app', 'components', 'lib'];
const LETRA = 'A-Za-zÁÉÍÓÚÑáéíóúñ';

const PALABRA = new RegExp(
  `(?<![${LETRA}])[${LETRA}]{2,}[áéí]s?(?![${LETRA}])`,
  'g',
);

// Solo texto que la persona ve: literales de cadena y texto suelto de JSX.
const VISIBLE = /'([^'\n]{4,})'|"([^"\n]{4,})"|`([^`\n]{4,})`|>\s*([^<>{}\n]{6,})</g;

// Palabras del español corriente que terminan en vocal acentuada y NO son
// voseo. Ampliar acá cuando el chequeo marque un falso positivo, con nota.
const CORRIENTES = new Set([
  // adverbios, preposiciones y demostrativos
  'está', 'esté', 'aquí', 'allí', 'ahí', 'así', 'acá', 'allá', 'sí', 'más',
  'qué', 'porqué', 'además', 'demás', 'jamás', 'quizá', 'quizás', 'ojalá',
  'atrás', 'detrás', 'través', 'después',
  // futuros de tercera persona
  'será', 'estará', 'habrá', 'podrá', 'tendrá', 'irá', 'verá', 'dará',
  'hará', 'sabrá', 'saldrá', 'vendrá', 'pondrá', 'llegará', 'quedará',
  'pasará', 'usará', 'mostrará',
  // sustantivos y nombres propios
  'café', 'bebé', 'inglés', 'francés', 'interés', 'cortés', 'revés',
  'estrés', 'país', 'josé', 'valdés', 'inés', 'andrés', 'ay',
  // pretéritos de primera persona: la persona habla de sí misma, no se le
  // está dando una orden. Ej. la opción «Aprendí trabajando».
  'aprendí', 'sentí', 'recibí', 'salí', 'viví', 'conseguí', 'perdí',
  'seguí', 'decidí', 'entendí', 'escribí', 'abrí', 'partí', 'cumplí',
  'nací', 'trabajé', 'estudié', 'empecé',
  // «estás» se escribe igual en «tú» y en voseo: no distingue nada.
  'estás',
]);

function* archivos(dir) {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) yield* archivos(ruta);
    else if (['.ts', '.tsx'].includes(extname(ruta))) yield ruta;
  }
}

const hallazgos = [];

for (const raiz of RAICES) {
  for (const ruta of archivos(raiz)) {
    readFileSync(ruta, 'utf8').split('\n').forEach((linea, i) => {
      const limpia = linea.trim();
      // Los comentarios van en rioplatense a propósito: los escribe el
      // equipo, no los lee ningún vecino.
      if (limpia.startsWith('//') || limpia.startsWith('*') || limpia.startsWith('/*')) return;

      for (const m of linea.matchAll(VISIBLE)) {
        const texto = m.slice(1).find(Boolean) ?? '';
        for (const palabra of texto.match(PALABRA) ?? []) {
          if (CORRIENTES.has(palabra.toLowerCase())) continue;
          hallazgos.push({ ruta, linea: i + 1, palabra, texto: texto.slice(0, 72) });
        }
      }
    });
  }
}

if (hallazgos.length === 0) {
  console.log('✓ voseo: sin hallazgos en texto visible');
  process.exit(0);
}

console.error(`✗ voseo: ${hallazgos.length} posible(s) en texto visible\n`);
for (const h of hallazgos) {
  console.error(`  ${h.ruta}:${h.linea}  «${h.palabra}»`);
  console.error(`      ${h.texto}\n`);
}
console.error('Si alguna es correcta, agregala a CORRIENTES en');
console.error('scripts/verificar-voseo.mjs con un comentario que diga por qué.');
process.exit(1);
