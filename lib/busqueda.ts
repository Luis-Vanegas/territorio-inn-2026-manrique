import type { Portafolio } from '@/lib/db/portafolios.repo';

/**
 * Buscador de negocios por puntaje, sin machine learning.
 *
 * Lo usan el buscador de la portada y el de /aliados, los dos en el cliente:
 * la lista de aprobados ya viene completa (cacheada, ver lib/db/cache.ts) y a
 * escala de barrio no hay volumen que justifique ir al servidor por cada
 * letra.
 *
 * Cómo decide:
 *   1. Normaliza: sin tildes ni mayúsculas, y singular = plural.
 *   2. Tira las palabras vacías ("busco una arepería en Manrique").
 *   3. Cada palabra suma según DÓNDE aparece (PESOS): en el nombre vale más
 *      que en la descripción. Por prefijo: "arep" ya encuentra "arepas".
 *   4. Sinónimos del barrio (SINONIMOS) cuentan a mitad de peso.
 *   5. Busca también en la dirección («calle 71A», «cra 30») y en los comercios
 *      de OpenStreetMap (`origen: 'osm'`, ver lib/geo/comerciosOsm.ts): una sola
 *      función para los dos. Ante empate, los aliados van primero.
 *   6. Primero exige TODAS las palabras. Si nadie las tiene, devuelve los que
 *      tienen alguna y lo marca como `parcial`: nunca pantalla vacía si hay
 *      algo parecido.
 *
 * ponytail: todo en memoria y sin tolerancia a errores de tipeo ("arpea").
 * Si pasa de unos cientos de negocios, o si se ven muchas búsquedas sin
 * resultado por tipeo, se pasa a Postgres con pg_trgm (ver el comentario de
 * portafolios.repo.ts sobre coincidencia difusa).
 */

export type NegocioBuscable = Pick<
  Portafolio,
  'id' | 'nombre' | 'descripcion' | 'categoria_id' | 'categoria_nombre' | 'categoria_otra' | 'barrio' | 'productos'
> & {
  direccion?: string | null;
  /** Ausente = aliado. `'osm'` = comercio mapeado en OpenStreetMap, no es aliado. */
  origen?: 'aliado' | 'osm';
};

const PESOS = { nombre: 10, categoria: 6, productos: 5, descripcion: 3, barrio: 3, direccion: 4 } as const;
type Campo = keyof typeof PESOS;

/** Un sinónimo pesa la mitad: la palabra exacta que escribió la persona manda. */
const FACTOR_SINONIMO = 0.5;

const VACIAS = new Set(
  'a al algo alguien busco buscar como con cual de del donde el en es esta hay la las lo los me mi necesito para por que quiero se su un una uno unos unas y ya'.split(' '),
);

/**
 * Grupos de palabras que en el barrio se usan para lo mismo. Cada grupo apunta
 * a una categoría real (lib/db/migrations): si se agrega una categoría, se
 * suma su grupo acá. Las búsquedas que no encuentran nada son la mejor fuente
 * para ampliar esta lista.
 */
const SINONIMOS: string[][] = [
  ['comida', 'comidas', 'almuerzo', 'corrientazo', 'restaurante', 'arepa', 'empanada', 'pollo', 'hamburguesa', 'perro', 'desayuno', 'fritos'],
  ['pan', 'panaderia', 'reposteria', 'torta', 'pastel', 'postre', 'ponque'],
  ['tienda', 'viveres', 'granero', 'mercado', 'abarrotes', 'legumbres', 'fruver'],
  ['bebida', 'jugo', 'cafe', 'licor', 'alimentacion'],
  ['barberia', 'barbero', 'peluqueria', 'peluquero', 'corte', 'pelo', 'cabello', 'barba'],
  ['belleza', 'unas', 'manicure', 'pedicure', 'maquillaje', 'cejas', 'pestanas', 'estetica'],
  ['ropa', 'moda', 'calzado', 'zapato', 'tenis', 'accesorio', 'bolso'],
  ['modisteria', 'modista', 'costura', 'arreglo', 'confeccion', 'dobladillo'],
  ['celular', 'tecnologia', 'computador', 'portatil', 'pantalla', 'cargador'],
  ['electrodomestico', 'nevera', 'lavadora', 'estufa', 'licuadora', 'linea'],
  ['moto', 'mecanica', 'taller', 'carro', 'llanta', 'montallanta'],
  ['plomeria', 'plomero', 'electricista', 'electricidad', 'construccion', 'obra', 'pintura', 'albanil', 'cerrajero'],
  ['domicilio', 'transporte', 'mensajeria', 'acarreo', 'trasteo', 'mandado'],
  ['mascota', 'perro', 'gato', 'veterinaria', 'concentrado'],
  ['papeleria', 'fotocopia', 'impresion', 'miscelanea', 'utiles'],
  ['lavanderia', 'lavado', 'planchado'],
  ['fotografia', 'foto', 'evento', 'fiesta', 'decoracion', 'recreacion'],
  ['salud', 'drogueria', 'farmacia', 'masaje', 'terapia', 'bienestar'],
  ['educacion', 'clase', 'tarea', 'guarderia', 'nino', 'curso', 'arte'],
  ['reciclaje', 'chatarreria', 'compraventa'],
  ['hogar', 'decoracion', 'mueble', 'cortina', 'colchon'],
  // Cómo se escribe una dirección en el barrio.
  ['calle', 'cl'],
  ['carrera', 'cra', 'kr', 'cr'],
  ['circular', 'cir'],
  ['diagonal', 'dg', 'diag'],
  ['transversal', 'tv', 'trans'],
];

/** Minúsculas, sin tildes (la ñ pasa a n), y solo letras y números. */
export function normalizar(texto: string): string {
  return texto
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Singular a lo bruto: "arepas" → "arepa", "celulares" → "celular". Se aplica
 * igual a lo que se busca y a lo que se indexa, así que un error de la regla
 * se cancela solo en la comparación.
 */
function raiz(palabra: string): string {
  if (palabra.length > 5 && palabra.endsWith('es') && !/[aeiou]/.test(palabra.at(-3) ?? '')) {
    return palabra.slice(0, -2);
  }
  if (palabra.length > 3 && palabra.endsWith('s')) return palabra.slice(0, -1);
  return palabra;
}

function palabras(texto: string): string[] {
  return normalizar(texto).split(' ').filter(Boolean).map(raiz);
}

const GRUPOS = SINONIMOS.map((grupo) => grupo.map(raiz));

/** Las palabras de la consulta que importan, ya normalizadas. */
export function terminosDe(consulta: string): string[] {
  return [...new Set(palabras(consulta).filter((p) => !VACIAS.has(p) && p.length > 1))];
}

/**
 * Coincide si alguna palabra del campo empieza con el término. Con dos letras
 * se exige la palabra entera: "de" por prefijo coincidiría con medio catálogo.
 */
function coincide(indice: string[], termino: string): boolean {
  return indice.some((p) => (termino.length > 2 ? p.startsWith(termino) : p === termino));
}

type Indice = Record<Campo, string[]>;

function indexar(n: NegocioBuscable): Indice {
  return {
    nombre: palabras(n.nombre),
    // «Sin categoría» (comercios de OSM) no es una palabra que alguien busque.
    categoria: n.categoria_id === 'sin_categoria' ? [] : palabras(`${n.categoria_nombre} ${n.categoria_otra ?? ''}`),
    productos: palabras(n.productos.map((p) => p.nombre).join(' ')),
    descripcion: palabras(n.descripcion ?? ''),
    barrio: palabras(n.barrio ?? ''),
    direccion: palabras(n.direccion ?? ''),
  };
}

/** Puntaje de UN término contra un negocio: el mejor campo donde aparece. */
function puntajeTermino(indice: Indice, termino: string): number {
  const campos = Object.keys(PESOS) as Campo[];
  const directo = Math.max(0, ...campos.map((c) => (coincide(indice[c], termino) ? PESOS[c] : 0)));
  if (directo > 0) return directo;

  // El término tiene que ser el comienzo del sinónimo ("pelu" → peluqueria), no
  // al revés: si no, "pantalla" traería panaderías por empezar con "pan".
  const hermanos = GRUPOS.filter((g) => g.some((s) => s.startsWith(termino))).flat();
  const porSinonimo = Math.max(
    0,
    ...campos.map((c) => (hermanos.some((s) => coincide(indice[c], s)) ? PESOS[c] : 0)),
  );
  return porSinonimo * FACTOR_SINONIMO;
}

export type ResultadoBusqueda<T> = {
  resultados: T[];
  /** true si ningún negocio tenía todas las palabras y se muestran los que tienen alguna. */
  parcial: boolean;
};

export function buscarNegocios<T extends NegocioBuscable>(negocios: T[], consulta: string): ResultadoBusqueda<T> {
  const terminos = terminosDe(consulta);
  if (terminos.length === 0) return { resultados: negocios, parcial: false };

  const nombreConsulta = normalizar(consulta);
  const puntuados = negocios.map((negocio, orden) => {
    const indice = indexar(negocio);
    const porTermino = terminos.map((t) => puntajeTermino(indice, t));
    let total = porTermino.reduce((a, b) => a + b, 0);
    // Escribir el nombre (o su comienzo) es la señal más clara de a quién se busca.
    if (normalizar(negocio.nombre).startsWith(nombreConsulta)) total += PESOS.nombre;
    const osm = negocio.origen === 'osm' ? 1 : 0;
    return { negocio, orden, total, osm, todos: porTermino.every((p) => p > 0) };
  });

  // Empate: primero los aliados y, dentro de cada grupo, el orden que traía la
  // lista (los más recientes primero).
  const ordenar = (lista: typeof puntuados) =>
    lista.sort((a, b) => b.total - a.total || a.osm - b.osm || a.orden - b.orden).map((p) => p.negocio);

  const completos = puntuados.filter((p) => p.todos);
  if (completos.length > 0) return { resultados: ordenar(completos), parcial: false };

  return { resultados: ordenar(puntuados.filter((p) => p.total > 0)), parcial: true };
}

/**
 * "También te puede interesar": negocios de las mismas categorías que los
 * mejores resultados, que no salieron en la búsqueda. Sale de lo que la
 * persona buscó, no de una popularidad inventada.
 */
export function relacionados<T extends NegocioBuscable>(negocios: T[], resultados: T[], maximo = 4): T[] {
  const categorias = new Set(resultados.slice(0, 3).map((r) => r.categoria_id));
  const vistos = new Set(resultados.map((r) => r.id));
  return negocios.filter((n) => categorias.has(n.categoria_id) && !vistos.has(n.id)).slice(0, maximo);
}

/**
 * Las categorías con más negocios, para sugerir búsquedas («Prueba con:»):
 * sugerir algo que no existe en el barrio sería invitar a una búsqueda vacía.
 */
export function sugerenciasDeCategorias(
  negocios: Pick<NegocioBuscable, 'categoria_id' | 'categoria_nombre'>[],
  maximo = 3,
): string[] {
  const porCategoria = new Map<string, number>();
  for (const n of negocios) {
    if (n.categoria_id === 'otros') continue;
    porCategoria.set(n.categoria_nombre, (porCategoria.get(n.categoria_nombre) ?? 0) + 1);
  }
  return [...porCategoria.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maximo)
    .map(([nombre]) => nombre.split(' y ')[0]!);
}
