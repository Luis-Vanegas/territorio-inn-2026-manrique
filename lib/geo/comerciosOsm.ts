import type { NegocioBuscable } from '../busqueda';
import type { DatosConstelaciones, EstrellaOsm } from './constelaciones';

/**
 * Comercios de OpenStreetMap vistos como lo que son: locales mapeados por
 * terceros, NO aliados. Este archivo traduce lo que trae el JSON (ids de
 * categoría, horarios y cocinas en formato OSM, en inglés) a texto para
 * vecinos, y los adapta al buscador único (`lib/busqueda.ts`).
 *
 * Solo `import type`: `scripts/verificar-busqueda.mjs` lo carga con
 * `--experimental-strip-types`, que no resuelve imports de valor sin extensión.
 */

export function aplanarComercios(datos: DatosConstelaciones): EstrellaOsm[] {
  return [...datos.constelaciones.flatMap((c) => c.estrellas), ...datos.puntos_sueltos];
}

/**
 * Nombre legible de cada categoría del sitio (las mismas de `categorias` en la
 * base, migraciones 001, 012 y 015). Vive acá y no se consulta a la base: el
 * JSON de OSM es estático y el navegador no habla con Postgres.
 */
const NOMBRE_CATEGORIA: Record<string, string> = {
  comidas: 'Comidas y almuerzos',
  panaderia: 'Panadería y repostería',
  tienda_viveres: 'Tienda y víveres',
  ropa_calzado: 'Ropa y calzado',
  belleza_peluqueria: 'Belleza y peluquería',
  barberia: 'Barbería',
  modisteria: 'Modistería y arreglos',
  reparacion_linea_blanca: 'Reparación de electrodomésticos',
  construccion: 'Plomería, electricidad y construcción',
  mecanica_motos: 'Mecánica y motos',
  tecnologia_celulares: 'Tecnología y celulares',
  papeleria: 'Papelería y misceláneas',
  salud_bienestar: 'Salud y bienestar',
  mascotas: 'Mascotas',
  transporte_domicilios: 'Transporte y domicilios',
  educacion_cuidado: 'Educación y cuidado infantil',
  fotografia_eventos: 'Fotografía y eventos',
  lavanderia: 'Lavandería',
  reciclaje: 'Reciclaje y compraventa',
  otros: 'Otros',
};

export const SIN_CATEGORIA = 'sin_categoria';

export function nombreCategoriaOsm(id: string | null): string {
  if (!id) return 'Sin categoría';
  return NOMBRE_CATEGORIA[id] ?? 'Otros';
}

// ── Horario ────────────────────────────────────────────────────────────

const DIAS: Record<string, number> = { Mo: 0, Tu: 1, We: 2, Th: 3, Fr: 4, Sa: 5, Su: 6 };
const NOMBRE_DIA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

/** «Mo-Fr» → «lunes a viernes»; «Sa,Su» → «sábado y domingo»; null si no se entiende. */
function diasLegibles(dias: string): string | null {
  const partes: string[] = [];
  let todos = false;
  for (const parte of dias.split(',')) {
    const m = /^(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?$/.exec(parte);
    if (!m) return null;
    const desde = DIAS[m[1]!]!;
    if (!m[2]) {
      partes.push(NOMBRE_DIA[desde]!);
      continue;
    }
    const hasta = DIAS[m[2]]!;
    if (desde === 0 && hasta === 6) todos = true;
    partes.push(`${NOMBRE_DIA[desde]} a ${NOMBRE_DIA[hasta]}`);
  }
  if (todos && partes.length === 1) return 'todos los días';
  if (partes.length === 1) return partes[0]!;
  return `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`;
}

/** «18:00» → «6:00 p. m.»; 00:00 es medianoche, 12:00 es mediodía. */
function horaLegible(hora: string): string | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hora);
  if (!m) return null;
  const h = Number(m[1]);
  if (h > 24 || Number(m[2]) > 59) return null;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const sufijo = h % 24 < 12 ? 'a. m.' : 'p. m.';
  return `${h12}:${m[2]} ${sufijo}`;
}

function horasLegibles(horas: string): string | null {
  if (horas === 'off') return 'cerrado';
  const tramos: string[] = [];
  for (const rango of horas.split(',')) {
    const m = /^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/.exec(rango);
    if (!m) return null;
    if (m[1] === '00:00' && (m[2] === '24:00' || m[2] === '00:00')) {
      tramos.push('las 24 horas');
      continue;
    }
    const desde = horaLegible(m[1]!);
    const hasta = horaLegible(m[2]!);
    if (!desde || !hasta) return null;
    tramos.push(`${desde} – ${hasta}`);
  }
  return tramos.join(' y ');
}

const mayuscula = (t: string) => t.charAt(0).toLocaleUpperCase('es') + t.slice(1);

/**
 * Horario de OSM (`opening_hours`) en español. Cubre lo que el JSON trae: días
 * sueltos, rangos y listas, uno o varios rangos de horas, `off` y `24/7`. Lo
 * demás (feriados `PH`, meses, texto libre) se devuelve tal cual: mejor el
 * dato crudo que uno mal traducido.
 */
export function horarioLegible(horario: string): string {
  const original = horario.trim();
  if (original === '24/7') return 'Abierto las 24 horas';

  const frases: string[] = [];
  for (const tramo of original.split(';')) {
    const m = /^\s*(?:([A-Za-z,-]+)\s+)?(\d{1,2}:\d{2}-\d{1,2}:\d{2}(?:,\d{1,2}:\d{2}-\d{1,2}:\d{2})*|off)\s*$/.exec(tramo);
    if (!m) return original;
    const dias = m[1] ? diasLegibles(m[1]) : 'todos los días';
    const horas = horasLegibles(m[2]!);
    if (!dias || !horas) return original;
    frases.push(`${mayuscula(dias)}, ${horas}`);
  }
  return frases.join('; ');
}

// ── Cocina ─────────────────────────────────────────────────────────────

/** Los valores de `cuisine` que aparecen en el JSON. Uno que falte no se muestra. */
const COCINA: Record<string, string> = {
  burger: 'hamburguesas',
  regional: 'comida regional',
  sandwich: 'sándwiches',
  chicken: 'pollo',
  coffee_shop: 'café',
  american: 'comida americana',
  international: 'comida internacional',
};

/** «regional;burger» → «Comida regional, hamburguesas»; '' si ninguno se conoce. */
export function cocinaLegible(cocina: string): string {
  const nombres = cocina
    .split(';')
    .map((c) => COCINA[c.trim()])
    .filter((c): c is string => Boolean(c));
  return nombres.length > 0 ? mayuscula(nombres.join(', ')) : '';
}

/** «https://www.smartfit.com.co/x» → «smartfit.com.co». Solo texto: no es un enlace del sitio. */
export function webLegible(web: string): string {
  try {
    return new URL(web).hostname.replace(/^www\./, '');
  } catch {
    return web;
  }
}

// ── Buscador ───────────────────────────────────────────────────────────

export type ComercioBuscable = NegocioBuscable & { origen: 'osm'; comercio: EstrellaOsm };

export function esComercioOsm(n: NegocioBuscable): n is ComercioBuscable {
  return n.origen === 'osm';
}

/**
 * Adapta un comercio de OSM al tipo que entiende `buscarNegocios`: la cocina
 * hace de descripción y la dirección se busca como tal. Sin categoría no se
 * indexa la frase «Sin categoría» (ver `busqueda.ts`).
 */
export function aBuscable(e: EstrellaOsm): ComercioBuscable {
  return {
    id: `osm:${e.osm}`,
    nombre: e.nombre,
    descripcion: e.detalle?.cocina ? cocinaLegible(e.detalle.cocina) : '',
    categoria_id: e.categoria ?? SIN_CATEGORIA,
    categoria_nombre: nombreCategoriaOsm(e.categoria),
    categoria_otra: null,
    barrio: '',
    productos: [],
    direccion: e.detalle?.direccion ?? null,
    origen: 'osm',
    comercio: e,
  };
}
