/**
 * Cifras con fuente que NO salen de nuestros archivos: las dio el equipo con su
 * fuente y su año, y se copian tal cual. Lo que sí sale de un archivo (OSM, el
 * modelo, los aliados) se lee de él en `datos.ts`, nunca se escribe acá.
 *
 * Regla de DESIGN.md › Firmamento: toda cifra lleva su fuente y su fecha debajo.
 * Por eso cada una trae `fuente` (quién la publica) y `fecha` (el año o corte
 * al que se refiere, no el día que la copiamos).
 */

export type CifraConFuente = {
  /** Texto final tal como se lee («2.626», «31,6 %»). */
  valor: string;
  /** Magnitud cruda para el conteo animado; sin ella la cifra sale como texto. */
  numero?: number;
  decimales?: number;
  sufijo?: string;
  etiqueta: string;
  fuente: string;
  fecha: string;
  /** Aclaración que evita una lectura equivocada (otro alcance, otro año). */
  aclaracion?: string;
};

const DAP = 'Ficha DAP Comuna 3, Alcaldía de Medellín';
const CAMARA = 'Cámara de Comercio de Medellín para Antioquia, Estructura Empresarial 2025';
const EMICRON = 'DANE (2026), boletín EMICRON 2025, 30 de julio de 2026';
// Las dos cifras de EMICRON se tomaron de la asesoría y falta contrastarlas con
// el boletín original; la nota va visible en la tarjeta, no solo en el código.
const NOTA_EMICRON =
  'Promedio de 24 ciudades, no de Manrique. Cifra tomada de la asesoría, pendiente de contrastar con el boletín original.';

export const CAMARA_EMPRESAS: CifraConFuente = {
  valor: '2.626',
  numero: 2626,
  decimales: 0,
  etiqueta: 'empresas con registro mercantil en Manrique',
  fuente: `${CAMARA}, Tabla 16`,
  fecha: '2025',
};

export const TERRITORIO: CifraConFuente[] = [
  {
    valor: '162.374',
    numero: 162374,
    decimales: 0,
    etiqueta: 'habitantes de la Comuna 3',
    fuente: `${DAP}, 2021`,
    fecha: 'población de 2019',
  },
  {
    valor: '5,10',
    numero: 5.1,
    decimales: 2,
    sufijo: ' km²',
    etiqueta: 'de área de la comuna',
    fuente: `${DAP}, 2021`,
    fecha: '2021',
  },
  {
    valor: '13,16',
    numero: 13.16,
    decimales: 2,
    sufijo: ' %',
    etiqueta: 'de desempleo en la comuna, frente a 12,2 % en la ciudad',
    fuente: `${DAP}, 2021, con datos de la GEIH`,
    fecha: '2019',
    aclaracion: 'Es un dato de 2019: hoy puede ser distinto.',
  },
];

export const INFORMALIDAD: CifraConFuente[] = [
  {
    valor: '31,6',
    numero: 31.6,
    decimales: 1,
    sufijo: ' %',
    etiqueta: 'de los micronegocios tiene RUT',
    fuente: EMICRON,
    fecha: '2025',
    aclaracion: NOTA_EMICRON,
  },
  {
    valor: '13,0',
    numero: 13,
    decimales: 1,
    sufijo: ' %',
    etiqueta: 'de los micronegocios tiene registro en Cámara de Comercio',
    fuente: EMICRON,
    fecha: '2025',
    aclaracion: NOTA_EMICRON,
  },
];

export const TEJIDO_CAMARA: CifraConFuente[] = [
  {
    valor: '2.569',
    numero: 2569,
    decimales: 0,
    etiqueta: 'son microempresas',
    fuente: `${CAMARA}, Tabla 14`,
    fecha: '2025',
  },
  {
    valor: '1.091',
    numero: 1091,
    decimales: 0,
    etiqueta: 'empresas de comercio',
    fuente: `${CAMARA}, Tabla 16`,
    fecha: '2025',
  },
  {
    valor: '309',
    numero: 309,
    decimales: 0,
    etiqueta: 'empresas de manufactura',
    fuente: `${CAMARA}, Tabla 16`,
    fecha: '2025',
  },
  {
    valor: '288',
    numero: 288,
    decimales: 0,
    etiqueta: 'empresas de alojamiento y comida',
    fuente: `${CAMARA}, Tabla 16`,
    fecha: '2025',
  },
];
