/**
 * Constelaciones de comercios de OpenStreetMap (`public/firmamento/constelaciones.json`,
 * generado por `pipeline/02_constelaciones.py`). NO son aliados de la plataforma:
 * son locales que alguien mapeó en OSM, agrupados por cercanía (HDBSCAN).
 *
 * El JSON no se importa: pesa ~43 KB y solo hace falta cuando el mapa pinta la
 * capa, así que se pide por `fetch` y queda fuera del bundle.
 */

export type EstrellaOsm = {
  osm: string;
  /** OSM puede no traer nombre (119 de 320): el mapa los dibuja, la lista y el buscador no (`comerciosConNombre`). */
  nombre: string | null;
  lat: number;
  lon: number;
  categoria: string | null;
  /** Barrio oficial donde cae el punto (pipeline, polígonos de barrios-manrique.json); null en un hueco entre polígonos. */
  barrio?: string | null;
  /** Solo las claves que OSM trae; nunca contactos ni descripción (privacidad). */
  detalle?: { direccion?: string; horario?: string; cocina?: string; web?: string };
};

export type MezclaCategoria = { categoria: string; nombre?: string | null; n: number; proporcion?: number };

export type Constelacion = {
  id: string;
  /** Descriptivo («Carrera 31 · Tienda y víveres»); en JSON viejos, «Constelación 1». */
  nombre: string | null;
  /** «C04». Opcional: el pipeline todavía no lo escribe en todos los JSON. */
  codigo?: string;
  mezcla_categorias?: MezclaCategoria[];
  tamano: number;
  centroide: { lat: number; lon: number };
  radio_m: number;
  radio_p90_m: number;
  categoria_dominante: string | null;
  estrellas: EstrellaOsm[];
  /** Árbol de expansión mínima: índices sobre `estrellas`. */
  aristas: { de: number; a: number; metros: number }[];
};

export type DatosConstelaciones = {
  fuente: string;
  licencia: string;
  fecha_corrida: string;
  /** Fecha del snapshot de OSM que respondió Overpass (la escribe el pipeline). */
  osm_base: string;
  resumen: {
    total_comercios: number;
    constelaciones: number;
    puntos_sueltos: number;
    con_nombre?: number;
    sin_nombre?: number;
    agrupados?: number;
    sueltos?: number;
  };
  constelaciones: Constelacion[];
  puntos_sueltos: EstrellaOsm[];
};

export const URL_CONSTELACIONES = '/firmamento/constelaciones.json';

let enCurso: Promise<DatosConstelaciones> | null = null;

/** Una sola descarga por visita: el interruptor puede prenderse y apagarse. */
export function cargarConstelaciones(): Promise<DatosConstelaciones> {
  if (!enCurso) {
    enCurso = fetch(URL_CONSTELACIONES)
      .then((r) => {
        if (!r.ok) throw new Error(`constelaciones: ${r.status}`);
        return r.json() as Promise<DatosConstelaciones>;
      })
      .then((d) => {
        // Un JSON válido con otra forma tumbaría el mapa de aliados en el render.
        if (!Array.isArray(d?.constelaciones) || !Array.isArray(d?.puntos_sueltos)) {
          throw new Error('constelaciones: forma inesperada');
        }
        return d;
      })
      .catch((e) => {
        enCurso = null; // permite reintentar
        throw e;
      });
  }
  return enCurso;
}

/** «6 de mayo de 2026». Las fechas del JSON vienen en UTC. */
export function fechaLarga(iso: string): string {
  // La fecha UTC del pipeline (04:40Z del 2-oct es noche del 1 en Bogotá): se
  // muestra la del día UTC para que coincida con el README y el documento.
  iso = iso.slice(0, 10);
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(new Date(iso.length === 10 ? `${iso}T12:00:00-05:00` : iso));
}
