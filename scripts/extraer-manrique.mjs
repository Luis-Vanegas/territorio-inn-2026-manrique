#!/usr/bin/env node
/**
 * Extrae el polígono de la Comuna 3 (Manrique) desde el GeoJSON de comunas de
 * Medellín y lo deja listo para consumo en el navegador.
 *
 *   node scripts/extraer-manrique.mjs [--input <ruta>] [--tolerancia <grados>]
 *
 * Fuente: dataset "Límite Comuna Corregimiento" de Geomedellin (MapaGIS).
 * Se espera el FeatureCollection completo de las 22 comunas/corregimientos.
 *
 * Por qué existe este script y no un archivo pegado a mano:
 *  - El fuente pesa ~6 MB y no se versiona; el recorte sí (~40 KB).
 *  - Si mañana se actualiza el límite oficial, se re-corre y listo.
 *  - Deja trazabilidad de qué transformaciones sufrió el polígono.
 *
 * Salida: lib/geo/manrique.json
 * Ojo con la extensión: .json, NO .geojson. El loader de webpack en Next 14
 * solo resuelve .json de fábrica; un .geojson falla el import sin config extra.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const ENTRADA_DEFECTO = 'C:/Users/LENOVO/Videos/Proy_sociales/comunas.geojson';
const SALIDA = resolve(RAIZ, 'lib/geo/manrique.json');

/** El dataset nombra las comunas como "03 - Manrique". */
const NOMBRE_COMUNA = '03 - Manrique';

/**
 * Tolerancia de simplificación en grados decimales.
 * 0.00002° ≈ 2.2 m en el ecuador. A escala de barrio es imperceptible y
 * recorta el polígono a una fracción del tamaño original.
 */
const TOLERANCIA_DEFECTO = 0.00002;

// ─── args ────────────────────────────────────────────────────

function leerArgs(argv) {
  const args = { input: ENTRADA_DEFECTO, tolerancia: TOLERANCIA_DEFECTO };
  for (let i = 2; i < argv.length; i += 2) {
    const clave = argv[i]?.replace(/^--/, '');
    const valor = argv[i + 1];
    if (clave === 'input') args.input = valor;
    else if (clave === 'tolerancia') args.tolerancia = Number(valor);
  }
  return args;
}

// ─── simplificación ──────────────────────────────────────────

/** Distancia perpendicular al segmento ab, en grados. */
function distanciaPerpendicular(p, a, b) {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;

  const dx = bx - ax;
  const dy = by - ay;

  // Segmento degenerado: la "perpendicular" es la distancia al punto.
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);

  return Math.abs(dy * px - dx * py + bx * ay - by * ax) / Math.hypot(dx, dy);
}

/**
 * Douglas-Peucker iterativo (no recursivo): un anillo de límite municipal puede
 * traer miles de vértices y la versión recursiva desborda la pila.
 */
function douglasPeucker(puntos, tolerancia) {
  if (puntos.length <= 2) return puntos;

  const conservar = new Uint8Array(puntos.length);
  conservar[0] = 1;
  conservar[puntos.length - 1] = 1;

  const pila = [[0, puntos.length - 1]];

  while (pila.length > 0) {
    const [inicio, fin] = pila.pop();
    let maxDist = 0;
    let indice = -1;

    for (let i = inicio + 1; i < fin; i++) {
      const d = distanciaPerpendicular(puntos[i], puntos[inicio], puntos[fin]);
      if (d > maxDist) {
        maxDist = d;
        indice = i;
      }
    }

    if (indice !== -1 && maxDist > tolerancia) {
      conservar[indice] = 1;
      pila.push([inicio, indice], [indice, fin]);
    }
  }

  return puntos.filter((_, i) => conservar[i]);
}

/**
 * Simplifica un anillo cerrado manteniendo el cierre.
 * Un anillo con menos de 4 puntos deja de ser un polígono válido: se devuelve
 * intacto antes que producir geometría rota.
 */
function simplificarAnillo(anillo, tolerancia) {
  if (anillo.length <= 4) return anillo;

  const simplificado = douglasPeucker(anillo, tolerancia);
  if (simplificado.length < 4) return anillo;

  // Re-cerrar por si el último vértice se perdió en la simplificación.
  const primero = simplificado[0];
  const ultimo = simplificado[simplificado.length - 1];
  if (primero[0] !== ultimo[0] || primero[1] !== ultimo[1]) {
    simplificado.push([...primero]);
  }

  return simplificado;
}

function simplificarGeometria(geometria, tolerancia) {
  if (geometria.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: geometria.coordinates.map((a) => simplificarAnillo(a, tolerancia)),
    };
  }
  if (geometria.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geometria.coordinates.map((poly) =>
        poly.map((a) => simplificarAnillo(a, tolerancia)),
      ),
    };
  }
  throw new Error(`Geometría no soportada: ${geometria.type}`);
}

// ─── utilidades geométricas ──────────────────────────────────

function* recorrerCoordenadas(geometria) {
  const anillos =
    geometria.type === 'Polygon'
      ? geometria.coordinates
      : geometria.coordinates.flat();
  for (const anillo of anillos) yield* anillo;
}

function calcularBbox(geometria) {
  let minLng = Infinity, minLat = Infinity;
  let maxLng = -Infinity, maxLat = -Infinity;

  for (const [lng, lat] of recorrerCoordenadas(geometria)) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }

  return [minLng, minLat, maxLng, maxLat];
}

function contarVertices(geometria) {
  let n = 0;
  for (const _ of recorrerCoordenadas(geometria)) n++;
  return n;
}

/**
 * Centroide por área (fórmula del polígono), no promedio de vértices.
 * El promedio de vértices se corre hacia donde el contorno tiene más detalle;
 * en un límite urbano irregular eso deja el centro visiblemente descolocado.
 */
function centroidePorArea(geometria) {
  const anillo =
    geometria.type === 'Polygon'
      ? geometria.coordinates[0]
      : geometria.coordinates
          .map((p) => p[0])
          .reduce((a, b) => (a.length > b.length ? a : b));

  let areaDoble = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < anillo.length - 1; i++) {
    const [x0, y0] = anillo[i];
    const [x1, y1] = anillo[i + 1];
    const cruz = x0 * y1 - x1 * y0;
    areaDoble += cruz;
    cx += (x0 + x1) * cruz;
    cy += (y0 + y1) * cruz;
  }

  // Área nula (anillo degenerado): se cae al bbox antes que devolver NaN.
  if (areaDoble === 0) {
    const [minLng, minLat, maxLng, maxLat] = calcularBbox(geometria);
    return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
  }

  const factor = 1 / (3 * areaDoble);
  return [cx * factor, cy * factor];
}

// ─── normalización ───────────────────────────────────────────

/**
 * El dataset de origen envuelve un Feature dentro de `geometry`:
 *   { type:'Feature', geometry:{ type:'Feature', geometry:{ type:'Polygon' }}}
 * Eso no es GeoJSON válido y Leaflet/Turf lo rechazan. Se desanida hasta
 * encontrar la geometría real.
 */
function desanidarGeometria(nodo) {
  let actual = nodo;
  let saltos = 0;

  while (actual && actual.type === 'Feature') {
    actual = actual.geometry;
    if (++saltos > 10) throw new Error('Anidamiento de Feature demasiado profundo');
  }

  if (!actual?.type || !actual.coordinates) {
    throw new Error('No se encontró una geometría válida');
  }

  return actual;
}

// ─── main ────────────────────────────────────────────────────

function main() {
  const { input, tolerancia } = leerArgs(process.argv);

  console.log(`Leyendo   ${input}`);
  const fuente = JSON.parse(readFileSync(input, 'utf8'));

  const feature = fuente.features?.find((f) => f.properties?.nombre === NOMBRE_COMUNA);
  if (!feature) {
    const disponibles = fuente.features?.map((f) => f.properties?.nombre).join(', ');
    throw new Error(`No se encontró "${NOMBRE_COMUNA}". Disponibles: ${disponibles}`);
  }

  const original = desanidarGeometria(feature);
  const verticesAntes = contarVertices(original);

  const simplificada = simplificarGeometria(original, tolerancia);
  const verticesDespues = contarVertices(simplificada);

  const bbox = calcularBbox(simplificada);
  const [lngCentro, latCentro] = centroidePorArea(simplificada);

  const salida = {
    type: 'FeatureCollection',
    // Metadatos del recorte: quien lea el archivo sabe de dónde salió
    // y con qué parámetros, sin tener que abrir el script.
    metadata: {
      fuente: 'Geomedellin — Límite Comuna Corregimiento',
      comuna: NOMBRE_COMUNA,
      generadoPor: 'scripts/extraer-manrique.mjs',
      generadoEn: new Date().toISOString(),
      toleranciaSimplificacion: tolerancia,
      verticesOriginales: verticesAntes,
      verticesFinales: verticesDespues,
      // [lng, lat] en orden GeoJSON. Leaflet los quiere invertidos.
      centro: [lngCentro, latCentro],
      crs: 'EPSG:4326',
    },
    bbox,
    features: [
      {
        type: 'Feature',
        properties: { id: feature.properties.id, nombre: NOMBRE_COMUNA },
        geometry: simplificada,
      },
    ],
  };

  mkdirSync(dirname(SALIDA), { recursive: true });
  writeFileSync(SALIDA, JSON.stringify(salida), 'utf8');

  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  const pesoAntes = JSON.stringify(original).length;
  const pesoDespues = JSON.stringify(salida).length;

  console.log(`Comuna    ${NOMBRE_COMUNA} (id ${feature.properties.id})`);
  console.log(`Vértices  ${verticesAntes} → ${verticesDespues}`);
  console.log(`Peso      ${kb(pesoAntes)} → ${kb(pesoDespues)}`);
  console.log(`Centro    ${latCentro.toFixed(6)}, ${lngCentro.toFixed(6)}  (lat, lng)`);
  console.log(`Bbox      SO ${bbox[1].toFixed(6)}, ${bbox[0].toFixed(6)}`);
  console.log(`          NE ${bbox[3].toFixed(6)}, ${bbox[2].toFixed(6)}`);
  console.log(`Escrito   ${SALIDA}`);
}

main();
