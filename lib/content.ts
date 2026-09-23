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
// flag apagado la ruta devuelve 404 real, así que el Hero tampoco puede
// ofrecer ese camino — el mismo flag alimenta el Hero y el menú (SiteHeader,
// vía enfoque.modulos). Si lo apagás, apagá los dos lugares desde acá: son dos
// consumidores del mismo valor.
const EMPLEO_ACTIVO = process.env.NEXT_PUBLIC_MODULO_EMPLEO === "true";

export const hero = {
  etiqueta: "MEDELLÍN · 2026",
  // v3 (2026-09-23, texto entregado por el cliente). El titular deja de ser una
  // pregunta y pasa a decir qué ES esto: antes el Hero preguntaba qué venías a
  // buscar, ahora se presenta. El subtítulo cuenta las dos mitades del proyecto
  // —acompañar negocios y construir datos— que antes solo se leían bajando
  // hasta RetoSection.
  //
  // Se escribe en caja normal y no en mayúsculas como vino en el pedido: las
  // mayúsculas son presentación, no contenido, y el titular ya pesa por su
  // cuerpo de display. Si se lo quiere en versalitas de verdad, va una clase
  // `uppercase` en el h1 de components/Hero.tsx y el texto queda legible en el
  // resto de lugares donde se reusa.
  titular: "La red social de emprendimientos y negocios de la Comuna 3, Manrique.",
  subtitulo:
    "Identificamos, visibilizamos y acompañamos a quienes hacen parte del tejido productivo de Manrique, mientras construimos datos que nos permiten entender sus necesidades y diseñar soluciones.",
  // v2 (2026-09-17, pedido del cliente): el Hero baja de 4 caminos a uno solo
  // — "busco negocio", "busco a quién contratar" y "estoy buscando trabajo"
  // se sacan de acá. No es que esos caminos dejen de existir: siguen a un
  // clic en el menú (ALIADOS y EMPLEO en SiteHeader). Lo que se decidió es
  // que el Hero, que es lo primero que ve cualquiera, empuje una sola acción
  // — registrar el negocio — en vez de ofrecer cuatro puertas a la vez.
  ctas: [
    { tipo: "ofrecer" as const, etiqueta: "Tengo un negocio u oficio", href: "/aliados/registro" },
  ] satisfies { tipo: "buscar" | "ofrecer"; etiqueta: string; href: string }[],
  // Los cuatro caminos se agrupaban solo por color, y el color era el único
  // portador del significado "buscar" vs "ofrecer" — falla WCAG 1.4.1: quien
  // no distingue los dos tonos ve cuatro botones sueltos sin relación. El
  // encabezado de cada grupo pone esa lógica en texto; el color pasa a ser
  // refuerzo. Orden a propósito: buscar primero, que es lo que hace la
  // mayoría de quien llega.
  gruposCta: [
    { tipo: "buscar" as const, titulo: "Estoy buscando" },
    { tipo: "ofrecer" as const, titulo: "Tengo algo para ofrecer" },
  ],
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

export interface LogoInstitucional {
  src: string;
  alt: string;
}

export const footer = {
  licencia: "MIT",
  logos: [
    { src: "/logos/alcaldia.svg", alt: "Alcaldía de Medellín" },
    { src: "/logos/pp-comuna3.svg", alt: "Presupuesto Participativo Comuna 3" },
  ] satisfies LogoInstitucional[],
};
