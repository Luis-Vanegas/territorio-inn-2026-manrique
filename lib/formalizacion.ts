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
    id: 'banco-distrital',
    titulo: 'Banco Distrital de Medellín',
    resumen:
      'Créditos de la Alcaldía pensados para negocios pequeños que no acceden a la banca tradicional. Antes se llamaba Banco de las Oportunidades — mismo programa, nombre nuevo.',
    tipo: 'fondo',
    entidad: 'Alcaldía de Medellín',
    fuente: 'https://www.medellin.gov.co',
    requisitos: ['Ser mayor de edad', 'Vivir o tener el negocio en Medellín', 'Cédula'],
    aplicaA: ['no_tengo', 'en_tramite', 'rut_camara'],
    // Renombrado: era "Banco de las Oportunidades", pasó por "Banco de los
    // Pobres" antes que eso. Verificado contra medellin.gov.co — el nombre
    // viejo sigue circulando en boca de la gente, por eso se menciona en el
    // resumen en vez de solo cambiarlo en silencio.
    verificadoEn: '2026-09-16',
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
    id: 'bancoldex',
    titulo: 'Línea de crédito con Bancóldex',
    resumen:
      'El banco de desarrollo empresarial del Gobierno no presta directo: respalda líneas de crédito para negocios pequeños a través de bancos aliados.',
    tipo: 'fondo',
    entidad: 'Bancóldex',
    fuente: 'https://www.bancoldex.com',
    requisitos: ['Cédula', 'RUT', 'Ir a un banco aliado de Bancóldex'],
    aplicaA: ['no_tengo', 'en_tramite', 'rut_camara'],
    verificadoEn: '2026-09-17',
  },
  {
    id: 'innpulsa',
    titulo: 'Convocatorias de iNNpulsa Colombia',
    resumen:
      'La agencia del Gobierno para el emprendimiento abre convocatorias todo el año con recursos no reembolsables para unidades productivas.',
    tipo: 'fondo',
    entidad: 'iNNpulsa Colombia',
    fuente: 'https://www.innpulsacolombia.com',
    requisitos: ['Revisar qué convocatorias están abiertas', 'Cumplir el perfil de la convocatoria vigente'],
    aplicaA: ['no_tengo', 'en_tramite', 'rut_camara'],
    verificadoEn: '2026-09-17',
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
   * URL del video en YouTube, siempre con `?v=ID` — de ahí `idDeYoutube` saca
   * el id para el embed. Sirve doble: reproducir en la página (VideoEmbebido)
   * y el link «Ver en YouTube ↗» para quien prefiere la app o el sitio real.
   *
   * ── Por qué se embebe con click-to-load y no con un <iframe> directo ──
   *
   * Un <iframe> de YouTube montado apenas carga la página pide scripts y
   * cookies de terceros a quien solo estaba mirando la sección, sin haber
   * pedido ver nada todavía — mal encaje con una página que promete una
   * política de datos clara. `youtube-nocookie.com` ya reduce el rastreo del
   * lado de YouTube, y el click-to-load (VideoEmbebido.tsx) hace que el
   * <iframe> ni siquiera exista en el DOM hasta que la persona toca play: la
   * miniatura que se ve antes es una imagen estática (i.ytimg.com), no el embed.
   */
  url: string;
  /** De dónde sale. Se muestra: importa quién lo dice, no solo qué dice. */
  fuente: string;
  /** Agrupa el video con los pasos del mismo tipo — mismos tres módulos que ya usa la lista de trámites, no una categoría nueva. */
  tipo: TipoRuta;
  /** AAAA-MM-DD en que alguien del equipo confirmó que el video sigue publicado y en el canal oficial. */
  verificadoEn: string;
}

/**
 * ══════════════════════════════════════════════════════════════════════
 *  ACÁ SE PEGAN LOS VIDEOS DE YOUTUBE. Copiá una entrada y cambiá los
 *  seis campos. No hay que tocar ningún componente: la página
 *  /formalizacion los lee de esta lista y los agrupa por `tipo`.
 * ══════════════════════════════════════════════════════════════════════
 *
 *   {
 *     id: 'como-sacar-rut',                          ← único, en minúsculas
 *     titulo: 'Cómo sacar el RUT paso a paso',
 *     descripcion: 'Qué necesitas y cuánto se demora.',
 *     url: 'https://www.youtube.com/watch?v=XXXXXXX',
 *     fuente: 'DIAN',                                ← quién lo publicó
 *     tipo: 'tramite',                                ← 'tramite' | 'fondo' | 'formacion'
 *     verificadoEn: '2026-09-16',                     ← hoy, si lo revisaste vos
 *   },
 *
 * ── Tres reglas al elegir un video ──
 *
 * 1. Que sea del canal oficial verificado de la entidad, no de un canal de
 *    terceros con el nombre parecido. Esto costó dos intentos fallidos reales
 *    al armar esta lista: un "SENA" con 49 suscriptores que no era el SENA, y
 *    un video de "Medellín Confía" que sonaba oficial y no lo era. Antes de
 *    pegar un link, entrá al canal y mirá el número de suscriptores y la
 *    descripción — no confíes en que el título del video diga la entidad.
 * 2. Que no tenga fecha de vencimiento. Un video de una convocatoria de 2026
 *    queda desactualizado en marzo y nadie se acuerda de sacarlo.
 * 3. Que el video siga publicado. Uno de los primeros candidatos para esta
 *    lista ya no existía: "Video no disponible porque se cerró la cuenta de
 *    YouTube asociada a él" — motivo de más para no confiar en un resultado
 *    de búsqueda sin abrirlo.
 *
 * `fuente` se muestra en la tarjeta a propósito: acá importa quién lo dice
 * tanto como qué dice.
 */
export const VIDEOS: VideoRecurso[] = [
  {
    id: 'como-sacar-rut',
    titulo: 'Paso a paso para la inscripción virtual en el RUT',
    descripcion:
      'Cómo inscribirte por internet, sin pedir cita y sin salir de tu casa.',
    url: 'https://www.youtube.com/watch?v=RVbImixXiEg',
    fuente: 'DIAN',
    tipo: 'tramite',
    verificadoEn: '2026-09-16',
  },
  {
    id: 'como-registrar-matricula',
    titulo: 'Cómo ingresar y registrarte en el aplicativo virtual de matrícula',
    descripcion: 'El primer paso para crear tu empresa por el aplicativo virtual de la Cámara.',
    url: 'https://www.youtube.com/watch?v=rkMw3wzjwWU',
    fuente: 'Cámara de Comercio de Medellín para Antioquia',
    tipo: 'tramite',
    verificadoEn: '2026-09-16',
  },
  {
    id: 'centro-emprendimiento-cercano',
    titulo: 'Busca el Centro de Emprendimiento más cercano',
    descripcion: 'Dónde queda el CEDEZO de tu comuna y qué asesoría te dan ahí.',
    url: 'https://www.youtube.com/watch?v=J6WKP9VZywU',
    fuente: 'Alcaldía de Medellín',
    tipo: 'tramite',
    verificadoEn: '2026-09-16',
  },
  {
    id: 'banco-distrital-requisitos',
    titulo: 'Acceder a un crédito con el Banco Distrital',
    descripcion: 'Qué piden para el crédito que antes se conocía como Banco de las Oportunidades.',
    url: 'https://www.youtube.com/watch?v=ygO5LC_ocEE',
    fuente: 'Alcaldía de Medellín',
    tipo: 'fondo',
    verificadoEn: '2026-09-16',
  },
  {
    id: 'requisitos-estudiar-sena',
    titulo: 'Requisitos para estudiar en el SENA',
    descripcion: 'Qué piden para inscribirte a un curso corto y virtual, sin costo.',
    url: 'https://www.youtube.com/watch?v=oRpwVDaJc8I',
    fuente: 'SENA',
    tipo: 'formacion',
    verificadoEn: '2026-09-16',
  },
];

/**
 * Saca el id de un link de YouTube para armar el embed y la miniatura.
 * Cubre `watch?v=ID` (el formato que usa todo `VIDEOS` hoy) y `youtu.be/ID`,
 * por si algún día se pega un link corto. `null` si no matchea — VideoEmbebido
 * cae al link de siempre en vez de romper la página por un id mal pegado.
 */
export function idDeYoutube(url: string): string | null {
  const watch = /[?&]v=([\w-]{6,})/.exec(url);
  if (watch) return watch[1]!;
  const corto = /youtu\.be\/([\w-]{6,})/.exec(url);
  return corto ? corto[1]! : null;
}

/** Etiquetas de `TipoRuta` para la interfaz. En "tú", como todo el sitio. */
export const ETIQUETA_TIPO: Record<TipoRuta, string> = {
  tramite: 'Trámite',
  fondo: 'Apoyo económico',
  formacion: 'Formación',
};

/** Orden en que se muestran los tipos: lo primero que necesita quien no tiene nada. */
export const ORDEN_TIPOS: TipoRuta[] = ['tramite', 'fondo', 'formacion'];

export const INTRO_TIPO: Record<TipoRuta, string> = {
  tramite: 'Lo que tienes que hacer para que tu negocio sea formal.',
  fondo: 'Dónde pedir plata o apoyo para crecer.',
  formacion: 'Dónde aprender, sin pagar nada.',
};

/**
 * Etiquetas humanas de la respuesta a "¿Tienes RUT o Cámara de Comercio?" del
 * registro. Vive acá y no en el formulario porque /formalizacion también la
 * necesita, para explicarle a la persona por qué ve menos pasos que el total
 * — mostrar una lista filtrada sin decir según qué se filtró es confuso.
 */
export const ETIQUETA_FORMALIDAD: Record<string, string> = {
  rut_camara: 'Tengo RUT o Cámara de Comercio',
  en_tramite: 'Estoy en trámite',
  no_tengo: 'No tengo',
  prefiero_no_decir: 'Prefiero no decir',
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
