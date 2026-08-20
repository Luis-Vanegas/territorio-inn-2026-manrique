// Todo el contenido editorial vive acá para no tocar los componentes al momento de llenar textos reales.

export interface Kpi {
  /** Texto final, ya formateado — se usa como valor accesible (aria-label) y como fallback sin JS. */
  valor: string;
  /** Magnitud cruda: la anima NumeroAnimado contando desde 0. */
  numero: number;
  decimales: number;
  sufijo?: string;
  etiqueta: string;
  contexto: string;
}

export interface ModuloFuturo {
  numero: string;
  slug: string;
  nombre: string;
  descripcion: string;
  /** "activo": el módulo funciona de verdad. "proximamente": todavía es un stub. */
  estado: "activo" | "proximamente";
}

export const hero = {
  etiqueta: "COMUNA 3 · MEDELLÍN · 2026",
  titular: "Manrique trabaja. Faltan los datos que lo cuenten.",
  subtitulo:
    "Una propuesta de datos abiertos para entender y fortalecer el empleo en Manrique.",
};

export const reto = {
  titulo: "El reto",
  parrafos: [
    "El Reto #2 — Empleo y Desarrollo Económico — parte de una pregunta simple: ¿cómo se ve, con datos reales, la economía de un territorio que históricamente se ha leído solo desde afuera? Manrique concentra unidades productivas informales, oficios heredados y un tejido económico que rara vez aparece en los indicadores oficiales.",
    "El Plan de Ordenamiento Territorial (POT) de Medellín identifica la reactivación económica de las comunas nororientales como un eje de equidad territorial. Sin información local, actualizada y accesible, esa reactivación se diseña a ciegas.",
    "Constelaciones propone una primera capa: una landing pública que explica el problema y siembra la base de un sistema de datos abierto sobre empleo, informalidad y unidades productivas en Manrique.",
  ],
  cita:
    "“Acá el trabajo existe, lo que no existe es el dato que lo cuente.”",
};

// El módulo de inventario predictivo todavía no tiene datos reales detrás — se
// muestra solo si el flag está prendido. Mientras está apagado, Aliados se
// renumera automáticamente por posición en vez de tener el número escrito a
// mano, para que no quede desincronizado del listado real.
const INVENTARIO_ACTIVO = process.env.NEXT_PUBLIC_MODULO_INVENTARIO === "true";

const MODULOS_BASE: Omit<ModuloFuturo, "numero">[] = [
  {
    slug: "inventario-predictivo",
    nombre: "Inventario predictivo",
    descripcion: "Seguimiento de unidades productivas y su comportamiento en el tiempo.",
    estado: "proximamente",
  },
  {
    slug: "aliados",
    nombre: "Aliados",
    descripcion: "Negocios y oficios de Manrique, en el mapa y con contacto directo.",
    estado: "activo",
  },
];

export const enfoque = {
  titulo: "El enfoque",
  modulos: MODULOS_BASE.filter(
    (m) => INVENTARIO_ACTIVO || m.slug !== "inventario-predictivo",
  ).map((m, indice) => ({
    ...m,
    numero: String(indice + 1).padStart(2, "0"),
  })) satisfies ModuloFuturo[],
};

export interface LogoInstitucional {
  src: string;
  alt: string;
}

export const footer = {
  // Sin NEXT_PUBLIC_REPO_URL el link no se muestra — no todos los despliegues
  // de este código quieren apuntar al repo público de referencia.
  repo: process.env.NEXT_PUBLIC_REPO_URL,
  licencia: "MIT",
  logos: [
    { src: "/logos/alcaldia.svg", alt: "Alcaldía de Medellín" },
    { src: "/logos/pp-comuna3.svg", alt: "Presupuesto Participativo Comuna 3" },
  ] satisfies LogoInstitucional[],
};
