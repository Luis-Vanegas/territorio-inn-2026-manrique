/**
 * Contenido de la ruta de formalización: trámites, fondos y videos.
 *
 * ── Por qué es un archivo de datos y no una tabla ──
 *
 * Son ~15 entradas que cambian una o dos veces al año, las edita el equipo (no
 * los vecinos), y necesitan revisión antes de publicarse. Una tabla agregaría
 * un repo, una migración, un panel de administración y un riesgo de que alguien
 * publique información legal equivocada sin revisión. Un archivo en el repo
 * pasa por pull request, que es exactamente la revisión que este contenido
 * necesita. Se migra a base de datos el día que lo editen personas sin acceso
 * al repo — no antes.
 *
 * ── Sobre `verificadoEn` y por qué NO hay montos ──
 *
 * Este contenido se le muestra a una persona que va a tomar decisiones de
 * plata y de trámites con él. Las tarifas de registro mercantil, los topes de
 * los fondos y los plazos de convocatoria CAMBIAN cada año, y un dato viejo
 * acá manda a alguien a hacer una fila para nada.
 *
 * Por eso ninguna entrada trae cifras: traen el trámite, quién lo hace y el
 * link oficial donde el monto vigente está publicado. `verificadoEn` es la
 * fecha en que alguien del equipo abrió ese link y confirmó que sigue vivo.
 * La UI muestra esa fecha. Si te tienta agregar "cuesta $X", no lo hagas:
 * poné el link y que el dato salga de la fuente.
 */

export type TipoRuta = 'tramite' | 'fondo' | 'formacion';

export interface PasoFormalizacion {
  id: string;
  titulo: string;
  /** Una línea: qué resuelve. Se lee antes que nada, tiene que valer sola. */
  resumen: string;
  tipo: TipoRuta;
  /** Quién lo hace — la entidad, con el nombre que usa la gente. */
  entidad: string;
  /** Dónde está el dato vigente. Siempre dominio oficial. */
  fuente: string;
  /** Qué necesita tener a mano antes de arrancar. */
  requisitos: string[];
  /**
   * A quién le sirve. La página filtra por acá usando lo que la persona ya
   * respondió en el registro (`formalidad`), para no mostrarle trámites que ya hizo.
   */
  aplicaA: ('no_tengo' | 'en_tramite' | 'rut_camara')[];
  /** AAAA-MM-DD en que alguien del equipo confirmó el enlace. */
  verificadoEn: string;
}

/**
 * Orden deliberado: primero lo gratuito y obligatorio (RUT), después el
 * registro mercantil, y al final la plata. Quien llega sin nada necesita el
 * primer paso, no el catálogo de fondos — mostrarle el crédito antes que el
 * RUT es venderle el techo antes que los cimientos.
 */
export const PASOS: PasoFormalizacion[] = [
  {
    id: 'rut',
    titulo: 'Sacar el RUT',
    resumen:
      'Es el documento que te identifica ante la DIAN. Es gratis, se hace en línea y casi todo lo demás lo pide primero.',
    tipo: 'tramite',
    entidad: 'DIAN',
    fuente: 'https://www.dian.gov.co',
    requisitos: ['Cédula', 'Correo electrónico activo', 'Dirección del negocio'],
    aplicaA: ['no_tengo', 'en_tramite'],
    verificadoEn: '2026-09-14',
  },
  {
    id: 'registro-mercantil',
    titulo: 'Matricularte en la Cámara de Comercio',
    resumen:
      'El registro mercantil hace formal tu negocio. La tarifa depende de tus activos, y hay beneficios para negocios pequeños.',
    tipo: 'tramite',
    entidad: 'Cámara de Comercio de Medellín para Antioquia',
    fuente: 'https://www.camaramedellin.com.co',
    requisitos: ['RUT', 'Cédula', 'Nombre del negocio', 'Dirección comercial'],
    aplicaA: ['no_tengo', 'en_tramite'],
    verificadoEn: '2026-09-14',
  },
  {
    id: 'beneficios-ley-2069',
    titulo: 'Preguntar por los beneficios de tarifa',
    resumen:
      'La Ley 2069 de 2020 creó descuentos en el registro para negocios pequeños que se formalizan. Pregunta si aplicas antes de pagar.',
    tipo: 'tramite',
    entidad: 'Cámara de Comercio de Medellín para Antioquia',
    fuente: 'https://www.camaramedellin.com.co',
    requisitos: ['Saber el valor de tus activos', 'Saber cuántas personas trabajan contigo'],
    aplicaA: ['no_tengo', 'en_tramite'],
    verificadoEn: '2026-09-14',
  },
  {
    id: 'cedezo',
    titulo: 'Ir al CEDEZO de tu comuna',
    resumen:
      'Los Centros de Desarrollo Empresarial Zonal son oficinas de la Alcaldía en el barrio donde asesoran gratis a quien tiene o quiere abrir un negocio.',
    tipo: 'tramite',
    entidad: 'Alcaldía de Medellín',
    fuente: 'https://www.medellin.gov.co',
    // VERIFICAR antes de la primera jornada de registro: la dirección y el
    // horario del CEDEZO de la Comuna 3. Es el único paso de esta lista al que
    // la persona va caminando, así que mandarla a una dirección vieja es el
    // error más caro del catálogo.
    requisitos: ['Cédula', 'Saber qué vendes o qué quieres montar'],
    aplicaA: ['no_tengo', 'en_tramite', 'rut_camara'],
    verificadoEn: '2026-09-15',
  },
  {
    id: 'banco-oportunidades',
    titulo: 'Banco de las Oportunidades',
    resumen:
      'Créditos de la Alcaldía de Medellín pensados para negocios pequeños que no acceden a la banca tradicional.',
    tipo: 'fondo',
    entidad: 'Alcaldía de Medellín',
    fuente: 'https://www.medellin.gov.co',
    requisitos: ['Ser mayor de edad', 'Vivir o tener el negocio en Medellín', 'Cédula'],
    aplicaA: ['no_tengo', 'en_tramite', 'rut_camara'],
    verificadoEn: '2026-09-14',
  },
  {
    id: 'fondo-emprender',
    titulo: 'Fondo Emprender del SENA',
    resumen:
      'Capital semilla para poner en marcha un negocio. Abre por convocatorias, así que revisa las fechas.',
    tipo: 'fondo',
    entidad: 'SENA',
    fuente: 'https://www.fondoemprender.com',
    requisitos: ['Plan de negocio', 'Cumplir el perfil de la convocatoria vigente'],
    aplicaA: ['no_tengo', 'en_tramite', 'rut_camara'],
    verificadoEn: '2026-09-14',
  },
  {
    id: 'presupuesto-participativo',
    titulo: 'Presupuesto Participativo de la Comuna 3',
    resumen:
      'La comuna decide cada año en qué invertir parte del presupuesto. Fortalecer unidades productivas suele estar entre las líneas.',
    tipo: 'fondo',
    entidad: 'Comuna 3 · Manrique',
    fuente: 'https://www.medellin.gov.co',
    requisitos: ['Vivir en la Comuna 3', 'Participar en las asambleas del territorio'],
    aplicaA: ['no_tengo', 'en_tramite', 'rut_camara'],
    verificadoEn: '2026-09-14',
  },
  {
    id: 'formacion-camara',
    titulo: 'Formación gratuita para empresarios',
    resumen:
      'La Cámara de Comercio dicta talleres sin costo sobre cuentas, ventas y formalización.',
    tipo: 'formacion',
    entidad: 'Cámara de Comercio de Medellín para Antioquia',
    fuente: 'https://www.camaramedellin.com.co',
    requisitos: ['Inscribirte previamente'],
    aplicaA: ['no_tengo', 'en_tramite', 'rut_camara'],
    verificadoEn: '2026-09-14',
  },
  {
    id: 'sena-cursos',
    titulo: 'Cursos cortos del SENA',
    resumen:
      'Formación gratuita en contabilidad básica, manipulación de alimentos, ventas digitales y más.',
    tipo: 'formacion',
    entidad: 'SENA',
    fuente: 'https://www.sena.edu.co',
    requisitos: ['Cédula', 'Correo electrónico'],
    aplicaA: ['no_tengo', 'en_tramite', 'rut_camara'],
    verificadoEn: '2026-09-14',
  },
];

export interface VideoRecurso {
  id: string;
  titulo: string;
  descripcion: string;
  /**
   * URL del video o del canal oficial.
   *
   * ── Por qué no hay videos embebidos ──
   *
   * Un <iframe> de YouTube carga scripts de terceros y cookies de seguimiento
   * en una página que le promete a la persona una política de datos clara. El
   * link abre en una pestaña nueva y no le mete rastreadores a nadie. Si algún
   * día se quiere embeber, va con youtube-nocookie.com y un click-to-load —
   * no un iframe directo.
   */
  url: string;
  /** De dónde sale. Se muestra: importa quién lo dice, no solo qué dice. */
  fuente: string;
}

/**
 * ══════════════════════════════════════════════════════════════════════
 *  ACÁ SE PEGAN LOS VIDEOS DE YOUTUBE. Copiá una entrada y cambiá los
 *  cuatro campos. No hay que tocar ningún componente: la página
 *  /formalizacion los lee de esta lista.
 * ══════════════════════════════════════════════════════════════════════
 *
 *   {
 *     id: 'como-sacar-rut',                          ← único, en minúsculas
 *     titulo: 'Cómo sacar el RUT paso a paso',
 *     descripcion: 'Qué necesitas y cuánto se demora.',
 *     url: 'https://www.youtube.com/watch?v=XXXXXXX',
 *     fuente: 'DIAN',                                ← quién lo publicó
 *   },
 *
 * ── Dos reglas al elegir un video ──
 *
 * 1. Que sea de la entidad o de alguien verificable. `fuente` se muestra en la
 *    tarjeta a propósito: acá importa quién lo dice tanto como qué dice, y un
 *    tutorial de un canal cualquiera puede dar información vieja de trámites.
 * 2. Que no tenga fecha de vencimiento. Un video de una convocatoria de 2026
 *    queda desactualizado en marzo y nadie se acuerda de sacarlo.
 *
 * Arranca con canales oficiales y no con videos sueltos porque un link a un
 * video puntual se rompe el día que el canal lo baja, y queda una ficha muerta
 * en la página que la gente usa para orientarse. Los canales no se caen.
 */
export const VIDEOS: VideoRecurso[] = [
  {
    id: 'canal-camara',
    titulo: 'Cámara de Comercio de Medellín',
    descripcion:
      'Charlas y tutoriales sobre cómo registrar tu negocio, renovar la matrícula y llevar tus cuentas.',
    url: 'https://www.camaramedellin.com.co',
    fuente: 'Cámara de Comercio de Medellín para Antioquia',
  },
  {
    id: 'canal-dian',
    titulo: 'DIAN — trámites en línea',
    descripcion: 'Cómo sacar el RUT paso a paso y qué hacer después de tenerlo.',
    url: 'https://www.dian.gov.co',
    fuente: 'DIAN',
  },
  {
    id: 'canal-sena',
    titulo: 'SENA — formación para emprendedores',
    descripcion: 'Cursos cortos y gratuitos sobre administración, ventas y costos.',
    url: 'https://www.sena.edu.co',
    fuente: 'SENA',
  },
  {
    id: 'canal-alcaldia',
    titulo: 'Alcaldía de Medellín — emprendimiento',
    descripcion:
      'Programas de apoyo a negocios de la ciudad, convocatorias abiertas y cómo participar.',
    url: 'https://www.medellin.gov.co',
    fuente: 'Alcaldía de Medellín',
  },
];

/** Etiquetas de `TipoRuta` para la interfaz. En "tú", como todo el sitio. */
export const ETIQUETA_TIPO: Record<TipoRuta, string> = {
  tramite: 'Trámite',
  fondo: 'Apoyo económico',
  formacion: 'Formación',
};

/**
 * Filtra los pasos según lo que la persona respondió al registrarse.
 *
 * Sin `formalidad` (visitante anónimo en la página pública) devuelve todo: no
 * hay nada que personalizar y esconder opciones sería peor que mostrarlas.
 */
export function pasosPara(formalidad: string | null | undefined): PasoFormalizacion[] {
  if (!formalidad) return PASOS;
  const clave = formalidad as PasoFormalizacion['aplicaA'][number];
  const filtrados = PASOS.filter((p) => p.aplicaA.includes(clave));
  // 'prefiero_no_decir' no matchea ninguna lista y dejaría la página vacía.
  return filtrados.length > 0 ? filtrados : PASOS;
}
