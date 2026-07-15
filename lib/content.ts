// Todo el contenido editorial vive acá para no tocar los componentes al momento de llenar textos reales.

export interface Kpi {
  valor: string;
  etiqueta: string;
  contexto: string;
}

export interface ModuloFuturo {
  numero: string;
  slug: string;
  nombre: string;
  descripcion: string;
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
    "Territorio INN 2026 propone una primera capa: una landing pública que explica el problema y siembra la base de un sistema de datos abierto sobre empleo, informalidad y unidades productivas en Manrique.",
  ],
  cita:
    "“Acá el trabajo existe, lo que no existe es el dato que lo cuente.”",
};

export const comuna = {
  titulo: "La Comuna 3 — Manrique",
  kpis: [
    {
      // TODO: reemplazar con dato real de MEData (tasa de desempleo, Comuna 3)
      valor: "—%",
      etiqueta: "Tasa de desempleo",
      contexto: "Dato pendiente de fuente oficial MEData.",
    },
    {
      // TODO: reemplazar con dato real de MEData (informalidad laboral, Comuna 3)
      valor: "—%",
      etiqueta: "Informalidad laboral",
      contexto: "Dato pendiente de fuente oficial MEData.",
    },
    {
      // TODO: reemplazar con dato real de MEData (unidades productivas activas, Comuna 3)
      valor: "—",
      etiqueta: "Unidades productivas activas",
      contexto: "Dato pendiente de fuente oficial MEData.",
    },
  ] satisfies Kpi[],
};

export const enfoque = {
  titulo: "El enfoque",
  nota: "[ Próximamente ]",
  modulos: [
    {
      numero: "01",
      slug: "empleo",
      nombre: "Empleo",
      descripcion: "Mapeo de oferta laboral y oficios activos en el territorio.",
    },
    {
      numero: "02",
      slug: "inventario-predictivo",
      nombre: "Inventario predictivo",
      descripcion: "Seguimiento de unidades productivas y su comportamiento en el tiempo.",
    },
    {
      numero: "03",
      slug: "portafolios",
      nombre: "Portafolios",
      descripcion: "Vitrina digital para negocios y oficios locales.",
    },
  ] satisfies ModuloFuturo[],
};

export interface LogoInstitucional {
  src: string;
  alt: string;
}

export const footer = {
  repo: "https://github.com/PLACEHOLDER/territorio-inn-2026",
  licencia: "MIT",
  logos: [
    { src: "/logos/itm.svg", alt: "ITM" },
    { src: "/logos/alcaldia.svg", alt: "Alcaldía de Medellín" },
    { src: "/logos/pp-comuna3.svg", alt: "Presupuesto Participativo Comuna 3" },
  ] satisfies LogoInstitucional[],
};
