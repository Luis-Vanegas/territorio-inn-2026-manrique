import { normalizar, type NegocioBuscable } from '../busqueda.ts';
import { distanciaMetros } from './distancia.ts';
import type {
  Constelacion,
  DatosConstelaciones,
  EstrellaOsm,
  MezclaCategoria,
} from './constelaciones';

/**
 * Comercios de OpenStreetMap vistos como lo que son: locales mapeados por
 * terceros, NO aliados. Este archivo traduce lo que trae el JSON (ids de
 * categoría, horarios y cocinas en formato OSM, en inglés) a texto para
 * vecinos, y los adapta al buscador único (`lib/busqueda.ts`).
 *
 * Los imports de valor llevan la extensión `.ts` (`allowImportingTsExtensions`):
 * `scripts/verificar-busqueda.mjs` lo carga con `--experimental-strip-types`, que
 * no resuelve imports sin extensión. Los archivos que importa solo tienen
 * `import type` hacia el resto del proyecto.
 */

export function aplanarComercios(datos: DatosConstelaciones): EstrellaOsm[] {
  return [...datos.constelaciones.flatMap((c) => c.estrellas), ...datos.puntos_sueltos];
}

/**
 * Los comercios que tienen nombre: los únicos que van a la lista «Otros
 * comercios» y al buscador (uno sin nombre no aporta nada para buscar). El mapa
 * sí dibuja a todos. Es el ÚNICO lugar donde vive esta condición.
 */
export function comerciosConNombre(comercios: EstrellaOsm[]): EstrellaOsm[] {
  return comercios.filter((e) => Boolean(e.nombre?.trim()));
}

/** Título de la ficha y del marcador: el nombre, o «Comercio sin nombre · Tienda y víveres». */
export function nombreVisible(e: EstrellaOsm): string {
  const nombre = e.nombre?.trim();
  if (nombre) return nombre;
  return e.categoria ? `Comercio sin nombre · ${nombreCategoriaOsm(e.categoria)}` : 'Comercio sin nombre';
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
    nombre: e.nombre?.trim() ?? '',
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

// ── Constelaciones: filtro por categoría, etiqueta y mezcla ───────────

function mezclaDe(estrellas: EstrellaOsm[]): MezclaCategoria[] {
  const cuenta = new Map<string, number>();
  for (const e of estrellas) {
    const id = e.categoria ?? SIN_CATEGORIA;
    cuenta.set(id, (cuenta.get(id) ?? 0) + 1);
  }
  return [...cuenta]
    .map(([categoria, n]) => ({
      categoria,
      nombre: nombreCategoriaOsm(categoria),
      n,
      proporcion: Math.round((n / estrellas.length) * 1000) / 1000,
    }))
    .sort((a, b) => b.n - a.n);
}

/**
 * Deja solo los comercios de una categoría (los mismos ids del filtro de la
 * vitrina). Las aristas se reindexan y solo sobreviven las que unen dos
 * estrellas que quedaron; el tamaño y la mezcla se recalculan. Una
 * constelación sin comercios de esa categoría desaparece. Sin categoría
 * devuelve `datos` tal cual.
 */
export function filtrarPorCategoria(
  datos: DatosConstelaciones,
  categoria?: string,
): DatosConstelaciones {
  if (!categoria) return datos;
  const coincide = (e: EstrellaOsm) => (e.categoria ?? SIN_CATEGORIA) === categoria;
  const constelaciones: Constelacion[] = [];
  for (const c of datos.constelaciones) {
    const nuevoIndice = new Map<number, number>();
    const estrellas: EstrellaOsm[] = [];
    c.estrellas.forEach((e, i) => {
      if (!coincide(e)) return;
      nuevoIndice.set(i, estrellas.length);
      estrellas.push(e);
    });
    if (estrellas.length === 0) continue;
    constelaciones.push({
      ...c,
      tamano: estrellas.length,
      categoria_dominante: categoria,
      mezcla_categorias: mezclaDe(estrellas),
      estrellas,
      aristas: c.aristas.flatMap((a) => {
        const de = nuevoIndice.get(a.de);
        const hasta = nuevoIndice.get(a.a);
        return de === undefined || hasta === undefined ? [] : [{ ...a, de, a: hasta }];
      }),
    });
  }
  const puntos_sueltos = datos.puntos_sueltos.filter(coincide);
  const agrupados = constelaciones.reduce((t, c) => t + c.tamano, 0);
  const sinNombre =
    constelaciones.reduce((t, c) => t + c.estrellas.length - comerciosConNombre(c.estrellas).length, 0) +
    (puntos_sueltos.length - comerciosConNombre(puntos_sueltos).length);
  const total = agrupados + puntos_sueltos.length;
  return {
    ...datos,
    constelaciones,
    puntos_sueltos,
    resumen: {
      ...datos.resumen,
      constelaciones: constelaciones.length,
      puntos_sueltos: puntos_sueltos.length,
      total_comercios: total,
      con_nombre: total - sinNombre,
      sin_nombre: sinNombre,
      agrupados,
      sueltos: puntos_sueltos.length,
    },
  };
}

/**
 * Conteo por categoría de TODOS los comercios (con y sin nombre: el mapa los
 * dibuja a todos). Sin categoría cuenta bajo `SIN_CATEGORIA`.
 */
export function contarPorCategoria(comercios: EstrellaOsm[]): Record<string, number> {
  const cuenta: Record<string, number> = {};
  for (const e of comercios) {
    const id = e.categoria ?? SIN_CATEGORIA;
    cuenta[id] = (cuenta[id] ?? 0) + 1;
  }
  return cuenta;
}

/**
 * Las categorías que ofrece el filtro de la vitrina: las de aliados Y las que
 * solo existen entre los comercios de OSM, con el conteo de los dos juntos.
 * Las de la base conservan su orden; las que solo trae OSM van después, de más
 * a menos comercios, y «Sin categoría» al final. Una con total 0 no se ofrece.
 */
export function unirCategorias<C extends { id: string; nombre: string }>(
  categorias: C[],
  conteosAliados: Record<string, number>,
  conteosOsm: Record<string, number>,
): { categorias: { id: string; nombre: string }[]; conteos: Record<string, number>; total: number } {
  const conteos: Record<string, number> = { ...conteosAliados };
  for (const [id, n] of Object.entries(conteosOsm)) conteos[id] = (conteos[id] ?? 0) + n;

  const conocidas = new Set(categorias.map((c) => c.id));
  const soloOsm = Object.keys(conteosOsm)
    .filter((id) => !conocidas.has(id))
    .sort((a, b) => {
      if (a === SIN_CATEGORIA || b === SIN_CATEGORIA) return a === SIN_CATEGORIA ? 1 : -1;
      return (conteos[b] ?? 0) - (conteos[a] ?? 0);
    })
    .map((id) => ({ id, nombre: nombreCategoriaOsm(id === SIN_CATEGORIA ? null : id) }));

  return {
    categorias: [...categorias, ...soloOsm].filter((c) => (conteos[c.id] ?? 0) > 0),
    conteos,
    total: Object.values(conteos).reduce((a, b) => a + b, 0),
  };
}

/** «C04 · Carrera 31 · Tienda y víveres — 13 comercios»; sin código o sin nombre usa lo que haya. */
export function etiquetaConstelacion(c: Constelacion): string {
  const nombre = [c.codigo, c.nombre].filter(Boolean).join(' · ') || c.id;
  return `${nombre} — ${c.tamano} ${c.tamano === 1 ? 'comercio' : 'comercios'}`;
}

/** «Tienda y víveres 7 · Papelería 3 · Otros 3»: las 3 mayores y el resto junto en «Otros». */
export function lineaMezcla(c: Constelacion): string {
  const mezcla = c.mezcla_categorias?.length ? c.mezcla_categorias : mezclaDe(c.estrellas);
  const orden = [...mezcla].sort((a, b) => b.n - a.n);
  const primeras = orden.slice(0, 3);
  const resto = orden.slice(3).reduce((t, m) => t + m.n, 0);
  const partes = primeras.map((m) => `${m.nombre || nombreCategoriaOsm(m.categoria)} ${m.n}`);
  if (resto > 0) partes.push(`Otros ${resto}`);
  return partes.join(' · ');
}

// ── Ficha de un aliado: a qué constelación pertenece ──────────────────

type Punto = { lat: number; lon: number };

/** Metros entre dos puntos {lat, lon}: adapta el formato a `distanciaMetros` (Haversine, `[lat, lon]`). */
function metrosEntre(a: Punto, b: Punto): number {
  return distanciaMetros([a.lat, a.lon], [b.lat, b.lon]);
}

/**
 * La constelación de OSM a la que pertenece un punto (la ubicación de un aliado):
 * la del centroide MÁS CERCANO, y solo si el punto cae dentro de su `radio_p90_m`
 * (el radio que contiene al 90 % de sus comercios). Fuera de ese radio es `null`:
 * un negocio aislado no pertenece a ninguna, y decir que sí sería inventar un
 * vecindario. Se calcula al vuelo y no se guarda (la columna `portafolios.constelacion`
 * de la 032 sigue sin escribirse): el JSON se regenera con el pipeline y un id
 * guardado quedaría apuntando a una constelación que ya no existe.
 */
export function constelacionDe(punto: Punto, constelaciones: Constelacion[]): Constelacion | null {
  let mejor: Constelacion | null = null;
  let distanciaMejor = Infinity;
  for (const c of constelaciones) {
    const d = metrosEntre(punto, c.centroide);
    if (d < distanciaMejor) {
      mejor = c;
      distanciaMejor = d;
    }
  }
  return mejor && distanciaMejor <= mejor.radio_p90_m ? mejor : null;
}

export type ComercioVecino = { comercio: EstrellaOsm; metros: number };

/** Un comercio de OSM a esta distancia o menos del aliado es, casi seguro, el propio aliado. */
export const METROS_MISMO_NEGOCIO = 25;

/**
 * «Otros negocios de tu constelación»: hasta `max` comercios CON NOMBRE de la
 * constelación del punto, del más cercano al más lejano. `total` cuenta todos los
 * que tienen nombre, para poder decir «y N más». `null` si el punto no cae en
 * ninguna constelación (la ficha no muestra la sección).
 *
 * El propio aliado puede estar mapeado en OSM: se excluye todo comercio a
 * `METROS_MISMO_NEGOCIO` m o menos del punto, o con el mismo nombre normalizado
 * que `nombreAliado`. Si no, la ficha lo listaría como «no es aliado».
 */
export function vecinosDeConstelacion(
  punto: Punto,
  datos: Pick<DatosConstelaciones, 'constelaciones'>,
  max = 5,
  nombreAliado?: string,
): { constelacion: Constelacion; comercios: ComercioVecino[]; total: number } | null {
  const constelacion = constelacionDe(punto, datos.constelaciones);
  if (!constelacion) return null;

  const claveAliado = nombreAliado ? normalizar(nombreAliado) : null;
  const conNombre = comerciosConNombre(constelacion.estrellas)
    .map((comercio) => ({ comercio, metros: metrosEntre(punto, { lat: comercio.lat, lon: comercio.lon }) }))
    .filter(
      (v) =>
        v.metros > METROS_MISMO_NEGOCIO &&
        (!claveAliado || normalizar(v.comercio.nombre ?? '') !== claveAliado),
    )
    .sort((a, b) => a.metros - b.metros);

  return { constelacion, comercios: conNombre.slice(0, max), total: conNombre.length };
}
