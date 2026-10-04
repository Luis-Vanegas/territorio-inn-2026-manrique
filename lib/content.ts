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

// Arranca apagado y se prende primero en preproducción para revisarlo. Con el
// flag apagado la ruta devuelve 404 real y el menú (SiteHeader, vía
// enfoque.modulos) no la ofrece.
const EMPLEO_ACTIVO = process.env.NEXT_PUBLIC_MODULO_EMPLEO === "true";

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
    descripcion: "Negocios y oficios del barrio, en el mapa y con contacto directo.",
    estado: "activo",
  },
  // Sin flag, a diferencia de los otros tres: no depende de que haya datos en
  // la base ni de un módulo a medio hacer — es contenido del repo, y funciona
  // desde el primer deploy. Un flag acá sería una perilla que nadie va a girar.
  {
    slug: "formalizacion",
    nombre: "Formalización",
    descripcion:
      "Trámites, apoyos económicos y formación gratuita para hacer formal tu negocio.",
    estado: "activo",
  },
  // Sin flag, como Formalización: son guías del repo, no dependen de datos. La
  // página sirve una vista previa a quien no se registró y el contenido a quien sí.
  {
    slug: "marca",
    nombre: "Marca",
    descripcion:
      "Guías del equipo para tus fotos, tus redes y cómo presentar tu negocio.",
    estado: "activo",
  },
  // Mismo formato que Marca (lib/ventas.ts reusa sus componentes).
  {
    slug: "ventas",
    nombre: "Ventas",
    descripcion:
      "Guías para entender a tu cliente, conversar con él y cerrar más ventas sin presionar.",
    estado: "activo",
  },
  // El módulo Servicios se eliminó del proyecto (no apagado: borrado, con sus
  // rutas, repos, schema y tablas). Quien presta un oficio a domicilio —lava
  // carros, arregla neveras, organiza eventos— entra por Aliados como
  // cualquier otro negocio, y el buscador lo encuentra por lo que hace.
  //
  // Tener dos puertas obligaba a la persona a decidir si era "aliado" o
  // "servicio" antes de empezar, que es una pregunta sobre nuestra estructura
  // de datos y no sobre su trabajo.
  {
    slug: "empleo",
    nombre: "Empleo",
    descripcion: "Vecinos buscando trabajo, con contacto directo.",
    estado: "activo",
  },
];

export const enfoque = {
  titulo: "El enfoque",
  modulos: MODULOS_BASE.filter(
    (m) =>
      (INVENTARIO_ACTIVO || m.slug !== "inventario-predictivo") &&
      (EMPLEO_ACTIVO || m.slug !== "empleo"),
  ).map((m, indice) => ({
    ...m,
    numero: String(indice + 1).padStart(2, "0"),
  })) satisfies ModuloFuturo[],
};

// Instituciones del reto, en texto. Los «logos» anteriores eran SVG que
// dibujaban el nombre con una fuente monoespaciada: no eran logos oficiales y
// contradecían DESIGN.md. Cuando haya logos con permiso de uso, se cambia el
// texto por la imagen (ver DESIGN.md › Pie de página).
export const footer = {
  licencia: "MIT",
  instituciones: [
    "Alcaldía de Medellín",
    "Presupuesto Participativo Comuna 3",
    "ITM",
  ],
};
