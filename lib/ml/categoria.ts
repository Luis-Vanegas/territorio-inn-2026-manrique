/**
 * Sugeridor de categoría: infiere, en el navegador, a qué categoría pertenece un
 * negocio a partir de su NOMBRE. TF-IDF de n-gramas de caracteres + regresión
 * logística, entrenado con comercios de OpenStreetMap (`pipeline/03_clasificador.py`)
 * y exportado a `public/modelo_categoria.json`.
 *
 * Por qué en el navegador y no en una API: no cuesta nada, no hay ninguna
 * llamada que registrar y, sobre todo, lo que la persona escribe en el campo
 * NOMBRE no sale de su pantalla (Ley 1581: un nombre de negocio es dato suyo).
 * El JSON pesa ~420 KB, por eso se pide por `fetch` cuando hace falta y no entra
 * al bundle.
 *
 * Sin `server-only` y sin imports de valor: `scripts/verificar-sugeridor.mjs` lo
 * importa con `--experimental-strip-types`, que no resuelve imports sin
 * extensión. La inferencia replica a `pipeline/verificar_salidas.py` (`inferir`)
 * y se compara contra sus resultados con casos fijos.
 *
 * Regla de uso (plan del reto): con confianza >= `umbral_confianza` (0,45) se
 * sugiere UNA categoría; si no, se muestran las 3 mejores y la persona elige.
 * Nunca se elige sola: es una sugerencia.
 */

export type ModeloCategoria = {
  version: string;
  clases: string[];
  /** Nombre legible de cada clase, en el mismo orden que `clases`. */
  nombres: string[];
  vocab: string[];
  idf: number[];
  /** Una fila por clase, una columna por n-grama del vocabulario. */
  coef: number[][];
  intercepto: number[];
  umbral_confianza: number;
};

export type Sugerencia = {
  /** Id de categoría del sitio (los mismos ids que `categorias`). */
  id: string;
  nombre: string;
  /** Entre 0 y 1. */
  probabilidad: number;
};

export type ResultadoSugerencia =
  /** Confianza suficiente: se ofrece una sola, con el botón «Usar esta». */
  | { tipo: 'una'; sugerida: Sugerencia; alternativas: Sugerencia[] }
  /** Confianza baja: las 3 mejores, para que la persona elija. */
  | { tipo: 'varias'; opciones: Sugerencia[] }
  /** Sin texto útil, o ningún n-grama conocido: no se sugiere nada. */
  | { tipo: 'nada' };

export const URL_MODELO = '/modelo_categoria.json';

/** Lo mismo que hace el entrenamiento: minúsculas, sin tildes, espacios colapsados. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}

const indices = new WeakMap<ModeloCategoria, Map<string, number>>();

function indiceDe(modelo: ModeloCategoria): Map<string, number> {
  let m = indices.get(modelo);
  if (!m) {
    m = new Map(modelo.vocab.map((g, i) => [g, i]));
    indices.set(modelo, m);
  }
  return m;
}

/**
 * Probabilidad de cada clase, ordenadas de mayor a menor. Devuelve `[]` cuando el
 * texto no contiene ni un n-grama del vocabulario: sin evidencia, el modelo solo
 * devolvería su sesgo (la clase más común), y eso no es una sugerencia.
 */
export function clasificar(modelo: ModeloCategoria, texto: string): Sugerencia[] {
  const indice = indiceDe(modelo);
  const x = new Float64Array(modelo.vocab.length);
  let hayEvidencia = false;

  for (const palabra of normalizar(texto).split(' ')) {
    if (!palabra) continue;
    const w = ` ${palabra} `;
    for (let n = 2; n <= 4; n++) {
      for (let i = 0; i + n <= w.length; i++) {
        const j = indice.get(w.slice(i, i + n));
        if (j !== undefined) {
          x[j] = (x[j] ?? 0) + 1;
          hayEvidencia = true;
        }
      }
    }
  }
  if (!hayEvidencia) return [];

  let norma = 0;
  for (let j = 0; j < x.length; j++) {
    x[j] = (x[j] ?? 0) * (modelo.idf[j] ?? 0);
    norma += (x[j] ?? 0) ** 2;
  }
  norma = Math.sqrt(norma);
  if (norma > 0) for (let j = 0; j < x.length; j++) x[j] = (x[j] ?? 0) / norma;

  const z = modelo.clases.map((_, k) => {
    const fila = modelo.coef[k] ?? [];
    let suma = modelo.intercepto[k] ?? 0;
    for (let j = 0; j < x.length; j++) suma += (fila[j] ?? 0) * (x[j] ?? 0);
    return suma;
  });
  const maximo = Math.max(...z);
  const e = z.map((v) => Math.exp(v - maximo));
  const total = e.reduce((a, b) => a + b, 0);

  return modelo.clases
    .map((id, k) => ({
      id,
      nombre: modelo.nombres[k] ?? id,
      probabilidad: (e[k] ?? 0) / total,
    }))
    .sort((a, b) => b.probabilidad - a.probabilidad);
}

export function sugerirCategoria(modelo: ModeloCategoria, texto: string): ResultadoSugerencia {
  const orden = clasificar(modelo, texto);
  const primera = orden[0];
  if (!primera) return { tipo: 'nada' };

  if (primera.probabilidad >= modelo.umbral_confianza) {
    return { tipo: 'una', sugerida: primera, alternativas: orden.slice(1, 3) };
  }
  return { tipo: 'varias', opciones: orden.slice(0, 3) };
}

function esModelo(d: unknown): d is ModeloCategoria {
  const m = d as Partial<ModeloCategoria> | null;
  return (
    Array.isArray(m?.clases) &&
    Array.isArray(m?.nombres) &&
    Array.isArray(m?.vocab) &&
    Array.isArray(m?.idf) &&
    Array.isArray(m?.coef) &&
    Array.isArray(m?.intercepto) &&
    typeof m?.umbral_confianza === 'number' &&
    m.coef.length === m.clases.length &&
    m.idf.length === m.vocab.length
  );
}

let enCurso: Promise<ModeloCategoria> | null = null;

/** Una sola descarga por visita; si falla se puede reintentar. */
export function cargarModelo(): Promise<ModeloCategoria> {
  if (!enCurso) {
    enCurso = fetch(URL_MODELO)
      .then((r) => {
        if (!r.ok) throw new Error(`modelo de categoría: ${r.status}`);
        return r.json() as Promise<unknown>;
      })
      .then((d) => {
        // Un JSON válido con otra forma rompería el formulario en el render.
        if (!esModelo(d)) throw new Error('modelo de categoría: forma inesperada');
        return d;
      })
      .catch((e) => {
        enCurso = null;
        throw e;
      });
  }
  return enCurso;
}
