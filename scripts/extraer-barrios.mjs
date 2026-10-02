#!/usr/bin/env node
/**
 * Extrae los 15 barrios de la Comuna 3 (Manrique) desde el GeoJSON de barrios de
 * Medellín (329 polígonos) y los deja listos para el navegador y el pipeline.
 *
 *   node --experimental-strip-types scripts/extraer-barrios.mjs [--input <ruta>]
 *
 * Fuente: pendiente de confirmar por el equipo (probablemente GeoMedellín,
 * «Barrio Vereda»). No se inventa acá: queda así en `metadata.fuente` hasta que
 * alguien la confirme; cuando se sepa, se cambia FUENTE y se re-corre.
 *
 * Salida: lib/geo/barrios-manrique.json (.json y no .geojson, por lo mismo que
 * manrique.json: ver extraer-manrique.mjs).
 *
 * Mismo criterio de `--input` que extraer-manrique.mjs: se valida por extensión
 * (el script no puede leer más que un GeoJSON) y la salida es fija.
 *
 * Sin simplificar: el recorte de los 15 barrios tiene ~1000 vértices con 5
 * decimales (~1 m) y pesa unos 30 KB. Simplificar acá sería ahorrar bytes a
 * cambio de mover fronteras que deciden en qué barrio cae un negocio.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// El ray casting vive una sola vez (lib/geo/puntoEnPoligono.ts): por eso este script
// corre con --experimental-strip-types, igual que los verificadores.
import { dentroDeAnillos } from '../lib/geo/puntoEnPoligono.ts';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const ENTRADA_DEFECTO = 'C:/Users/LENOVO/Downloads/barrios.geojson';
const SALIDA = resolve(RAIZ, 'lib/geo/barrios-manrique.json');
const POLIGONO_COMUNA = resolve(RAIZ, 'lib/geo/manrique.json');

const FUENTE = 'fuente pendiente de confirmar por el equipo';
const COMUNA_ID = 3;

/**
 * ÚNICA tabla de equivalencias: grafía del GeoJSON → grafía de
 * `BARRIOS_COMUNA_3` (lib/geo/constantes.ts), que es la que ve el vecino y la que
 * se guarda en `portafolios.barrio`. Si el dataset cambia una grafía o trae un
 * barrio nuevo, el script aborta en vez de adivinar.
 */
const EQUIVALENCIAS = {
  'La Salle': 'La Salle',
  'Las Granjas': 'Las Granjas',
  'Campo Valdés No.2': 'Campo Valdés No. 2',
  'Santa Inés': 'Santa Inés',
  'El Raizal': 'El Raizal',
  'El Pomar': 'El Pomar',
  'Manrique Central No. 2': 'Manrique Central No. 2',
  'Manrique Oriental': 'Manrique Oriental',
  'Versalles No. 1': 'Versalles No. 1',
  'Versalles No. 2': 'Versalles No. 2',
  'La Cruz': 'La Cruz',
  Oriente: 'Oriente',
  'María Cano-Carambolas': 'María Cano - Carambolas',
  'San José de la Cima No. 1': 'San José de la Cima No. 1',
  'San José de la Cima No. 2': 'San José de la Cima No. 2',
};

function rutaGeojson(valor) {
  const ruta = resolve(valor);
  if (!/\.(geo)?json$/i.test(ruta)) {
    throw new Error(`--input tiene que ser un archivo .geojson o .json. Se recibió: ${valor}`);
  }
  if (!existsSync(ruta)) throw new Error(`No existe el archivo: ${ruta}`);
  return ruta;
}

function leerArgs(argv) {
  const args = { input: ENTRADA_DEFECTO };
  for (let i = 2; i < argv.length; i += 2) {
    if (argv[i]?.replace(/^--/, '') === 'input') args.input = argv[i + 1];
  }
  args.input = rutaGeojson(args.input);
  return args;
}

// ─── geometría ───────────────────────────────────────────────

const anillosDe = (g) => (g.type === 'Polygon' ? g.coordinates : g.coordinates.flat());

function contarVertices(g) {
  return anillosDe(g).reduce((n, a) => n + a.length, 0);
}

function bboxDe(geometrias) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const g of geometrias) {
    for (const a of anillosDe(g)) {
      for (const [x, y] of a) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return [minX, minY, maxX, maxY];
}

/**
 * Cobertura por muestreo en malla (~10 m): el polígono de la comuna contra la
 * unión de los barrios. Sin turf: @turf/union no está instalado y esto alcanza
 * para decir cuánto falta o sobra con ~±0,1 % de error.
 */
function cobertura(comuna, barrios) {
  const paso = 0.0001; // ~11 m
  const anillosComuna = anillosDe(comuna);
  const anillosBarrios = barrios.map(anillosDe);
  const [x0, y0, x1, y1] = bboxDe([comuna, ...barrios]);
  let enComuna = 0, enComunaYBarrio = 0, enBarrios = 0, enBarriosFuera = 0, solapados = 0;
  for (let y = y0; y <= y1; y += paso) {
    for (let x = x0; x <= x1; x += paso) {
      const c = dentroDeAnillos(anillosComuna, y, x);
      const n = anillosBarrios.filter((a) => dentroDeAnillos(a, y, x)).length;
      if (n > 1) solapados++;
      if (c) enComuna++;
      if (n > 0) enBarrios++;
      if (c && n > 0) enComunaYBarrio++;
      if (!c && n > 0) enBarriosFuera++;
    }
  }
  return {
    celdasComuna: enComuna,
    comunaCubiertaPct: (100 * enComunaYBarrio) / enComuna,
    comunaSinBarrioPct: (100 * (enComuna - enComunaYBarrio)) / enComuna,
    barriosFueraDeComunaPct: (100 * enBarriosFuera) / enBarrios,
    solapePct: (100 * solapados) / enBarrios,
  };
}

// ─── main ────────────────────────────────────────────────────

function main() {
  const { input } = leerArgs(process.argv);
  console.log(`Leyendo   ${input}`);
  const fuente = JSON.parse(readFileSync(input, 'utf8'));
  if (!Array.isArray(fuente.features)) throw new Error('El archivo no es un FeatureCollection');

  const delaComuna = fuente.features.filter((f) => f.properties?.comuna_id === COMUNA_ID);
  const nombresFuente = delaComuna.map((f) => f.properties.nombre);
  const sinEquivalencia = nombresFuente.filter((n) => !(n in EQUIVALENCIAS));
  const sinUsar = Object.keys(EQUIVALENCIAS).filter((n) => !nombresFuente.includes(n));
  if (delaComuna.length !== 15 || sinEquivalencia.length || sinUsar.length) {
    throw new Error(
      `Se esperaban 15 barrios con comuna_id ${COMUNA_ID}; hay ${delaComuna.length}. ` +
        `Sin equivalencia: [${sinEquivalencia}]. Sin barrio en el archivo: [${sinUsar}]`,
    );
  }

  const features = delaComuna
    .map((f) => {
      const codigo = String(f.properties.codigo);
      if (!/^3(0[1-9]|1[0-5])$/.test(codigo)) throw new Error(`Código fuera de 301–315: ${codigo}`);
      return {
        type: 'Feature',
        properties: { codigo, nombre: EQUIVALENCIAS[f.properties.nombre] },
        geometry: f.geometry,
      };
    })
    .sort((a, b) => a.properties.codigo.localeCompare(b.properties.codigo));

  const geometrias = features.map((f) => f.geometry);
  const vertices = geometrias.reduce((n, g) => n + contarVertices(g), 0);

  const comuna = JSON.parse(readFileSync(POLIGONO_COMUNA, 'utf8')).features[0].geometry;
  const cob = cobertura(comuna, geometrias);

  const salida = {
    type: 'FeatureCollection',
    metadata: {
      fuente: FUENTE,
      archivoFuente: basename(input),
      comuna: 'Comuna 3 — Manrique',
      generadoPor: 'scripts/extraer-barrios.mjs',
      generadoEn: new Date().toISOString(),
      simplificado: false,
      verticesOriginales: vertices,
      verticesFinales: vertices,
      barrios: features.length,
      crs: 'EPSG:4326',
    },
    bbox: bboxDe(geometrias),
    features,
  };

  mkdirSync(dirname(SALIDA), { recursive: true });
  writeFileSync(SALIDA, JSON.stringify(salida), 'utf8');

  console.log(`Barrios   ${features.length}  (${features.map((f) => f.properties.codigo).join(' ')})`);
  console.log(`Vértices  ${vertices}`);
  console.log(`Peso      ${(JSON.stringify(salida).length / 1024).toFixed(1)} KB`);
  console.log(`Cobertura de la comuna por los barrios  ${cob.comunaCubiertaPct.toFixed(2)} %`);
  console.log(`Comuna sin barrio                       ${cob.comunaSinBarrioPct.toFixed(2)} %`);
  console.log(`Barrios fuera del polígono de la comuna ${cob.barriosFueraDeComunaPct.toFixed(2)} %`);
  console.log(`Solape entre barrios                    ${cob.solapePct.toFixed(2)} %  (muestreo ~11 m, ${cob.celdasComuna} celdas)`);
  console.log(`Escrito   ${SALIDA}`);
}

main();
