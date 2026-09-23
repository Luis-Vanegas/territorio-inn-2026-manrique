/**
 * Guías de marca: el regalo del equipo a los negocios registrados.
 *
 * Es contenido editorial, no lógica: cada guía es una lista de secciones
 * tipadas y `components/marca/Secciones.tsx` sabe pintar cada
 * tipo. Agregar una guía nueva es agregar datos acá, no componentes.
 *
 * ── Por qué las tres guías de canal repiten forma ──
 *
 * Instagram, Facebook y WhatsApp comparten estructura a propósito (perfil →
 * qué publicar → chequeo): así quien ya leyó una sabe dónde mirar en la
 * siguiente. Por eso son datos y no páginas escritas a mano.
 *
 * Los textos salen de las láminas que hizo el equipo. Voz de "tú", sin voseo.
 */

export type Imagen = { src: string; alt: string; ancho: number; alto: number };

/** Una lámina original del equipo: la versión en imagen de la guía, para compararla con la de la página. */
export type Lamina = { src: string; ancho: number; alto: number };

export type Nota = { etiqueta: string; texto: string };

export type Tarjeta = { titulo: string; texto: string; imagen?: Imagen };

export type Seccion =
  | {
      tipo: 'tarjetas';
      kicker: string;
      titulo: string;
      bajada?: string;
      items: Tarjeta[];
      /** Números 1..n en cada tarjeta. Las que no son un orden (p. ej. tipos de contenido) no los llevan. */
      numeradas?: boolean;
      nota?: Nota;
    }
  | {
      tipo: 'checklist';
      kicker: string;
      titulo: string;
      bajada?: string;
      items: string[];
      nota?: Nota;
      cierre?: string;
    }
  | {
      tipo: 'plantillas';
      kicker: string;
      titulo: string;
      bajada?: string;
      /** Los `[CORCHETES]` del texto se resaltan: son lo que la persona cambia. */
      items: { titulo: string; texto?: string; pasos?: string[] }[];
      nota?: Nota;
    }
  | {
      tipo: 'comparacion';
      kicker: string;
      titulo: string;
      bajada?: string;
      mal: { etiqueta: string; texto?: string; imagen?: Imagen };
      bien: { etiqueta: string; texto?: string; imagen?: Imagen };
      senales?: string[];
      nota?: Nota;
    }
  | {
      tipo: 'frases';
      kicker: string;
      titulo: string;
      bajada?: string;
      /** Frases a medias para que la persona las complete en una hoja. */
      items: string[];
    };

export type GrupoGuia = 'producto' | 'canales' | 'publicar' | 'presentarte';

/** Redes reconocibles por su ícono — ver components/iconos/IconoContacto.tsx. */
export type RedSocial = 'instagram' | 'facebook' | 'whatsapp' | 'tiktok' | 'youtube';

export type Guia = {
  slug: string;
  titulo: string;
  /** Una línea: lo que se lleva quien la lee. */
  bajada: string;
  /** Texto de la tarjeta del índice. */
  resumen: string;
  grupo: GrupoGuia;
  /** Si la guía es sobre un canal puntual, su ícono — en la tarjeta del índice y en el header de la guía. */
  red?: RedSocial;
  laminas: Lamina[];
  secciones: Seccion[];
};

/** Lo que se dice de todo el módulo, tanto en la puerta sin sesión como en el índice. */
export const MARCA_BAJADA =
  'Un regalo del equipo de Constelaciones: guías sencillas para que tus fotos, tus redes y tu forma de presentarte trabajen a favor de tu negocio. No necesitas ser experto en diseño ni en tecnología.';

export const GRUPOS: { id: GrupoGuia; titulo: string; intro: string }[] = [
  {
    id: 'producto',
    titulo: 'Prepara tu producto',
    intro: 'Lo primero: que lo que vendes se vea bien.',
  },
  {
    id: 'canales',
    titulo: 'Ordena tus canales',
    intro: 'Que tu perfil explique quién eres, qué ofreces y cómo escribirte.',
  },
  {
    id: 'publicar',
    titulo: 'Qué publicar',
    intro: 'Ideas simples y un ritmo que sí puedes sostener.',
  },
  {
    id: 'presentarte',
    titulo: 'Preséntate',
    intro: 'Cuenta tu negocio en un minuto, a un cliente o a un aliado.',
  },
];

const CIERRE_CANAL = (canal: string, cola: string) =>
  `Tu ${canal} no tiene que ser perfecto. Tiene que ser ${cola} para tu cliente.`;

const regla = (texto: string): Nota => ({ etiqueta: 'Regla práctica', texto });

/** `/marca/laminas/<slug>-1.jpg` … `-<n>.jpg`. Un script (`npm run verificar`) comprueba que existan. */
const laminasDe = (slug: string, cantidad: number, ancho: number, alto: number): Lamina[] =>
  Array.from({ length: cantidad }, (_, i) => ({
    src: `/marca/laminas/${slug}-${i + 1}.jpg`,
    ancho,
    alto,
  }));

// Lo que Instagram, Facebook y WhatsApp dicen idéntico, dicho una sola vez.
const QUE_PUBLICAR = {
  kicker: '02 · Qué publicar',
  titulo: 'No necesitas publicar de todo.',
  bajada: 'Empieza con contenidos simples que ayuden a mostrar tu negocio.',
};

const CHEQUEO_CANAL = {
  kicker: '03 · Chequeo rápido',
  titulo: 'Antes de seguir, revisa esto.',
};

const FOTO_PERFIL_LOGO: Tarjeta = {
  titulo: 'Foto de perfil',
  texto:
    'Usa tu logo o una imagen clara de tu negocio. Debe verse bien en tamaño pequeño y ser fácil de reconocer.',
};

export const GUIAS: Guia[] = [
  {
    slug: 'fotos-con-el-celular',
    titulo: 'Toma buenas fotos de tu producto con el celular',
    bajada: 'Tips rápidos para que tu producto se vea más claro, atractivo y profesional.',
    resumen: 'Luz, fondo y tres tomas que puedes repetir con cada producto.',
    grupo: 'producto',
    laminas: laminasDe('fotos-con-el-celular', 5, 1130, 2007),
    secciones: [
      {
        tipo: 'tarjetas',
        kicker: '01 · La luz',
        titulo: 'La luz lo cambia todo.',
        bajada: 'Con buena luz, tu producto se ve más limpio, claro y atractivo.',
        numeradas: false,
        items: [
          { titulo: 'Luz natural', texto: 'Usa luz natural cerca de una ventana.' },
          { titulo: 'Sin flash', texto: 'Evita el flash directo.' },
          {
            titulo: 'Sombra suave',
            texto: 'Si la sombra es muy fuerte, usa una cartulina blanca para suavizarla.',
          },
        ],
        nota: {
          etiqueta: 'Tip rápido',
          texto: 'si la foto se ve oscura, muévete tú o mueve el producto.',
        },
      },
      {
        tipo: 'comparacion',
        kicker: '02 · Fondo y orden',
        titulo: 'Menos cosas = mejor foto.',
        bajada:
          'Tu producto debe ser el protagonista. Usa un fondo limpio y simple, quita los objetos que distraigan, limpia el lente y acomoda bien el producto.',
        mal: {
          etiqueta: 'Así no',
          imagen: {
            src: '/marca/foto-mal.jpg',
            alt: 'Vela sobre un escritorio con cuaderno, taza, plantas y libros alrededor que le quitan protagonismo.',
            ancho: 836,
            alto: 1050,
          },
        },
        bien: {
          etiqueta: 'Así sí',
          imagen: {
            src: '/marca/foto-bien.jpg',
            alt: 'La misma vela sobre una base simple, con fondo limpio y sin objetos que distraigan.',
            ancho: 841,
            alto: 1050,
          },
        },
        nota: regla('si algo no ayuda a mostrar el producto, mejor quítalo.'),
      },
      {
        tipo: 'tarjetas',
        kicker: '03 · Toma 3 fotos',
        titulo: 'Con esto ya tienes contenido.',
        bajada: 'Haz estas 3 tomas cada vez que fotografíes tu producto.',
        numeradas: true,
        items: [
          {
            titulo: 'Foto general',
            texto: 'Muestra el producto completo.',
            imagen: {
              src: '/marca/toma-general.jpg',
              alt: 'Celular encuadrando la vela completa sobre su base.',
              ancho: 462,
              alto: 572,
            },
          },
          {
            titulo: 'Foto detalle',
            texto: 'Resalta textura, acabado o ingredientes.',
            imagen: {
              src: '/marca/toma-detalle.jpg',
              alt: 'Celular acercándose a la etiqueta y la llama de la vela.',
              ancho: 462,
              alto: 558,
            },
          },
          {
            titulo: 'Foto en uso',
            texto: 'Deja ver cómo se usa o para quién es.',
            imagen: {
              src: '/marca/toma-uso.jpg',
              alt: 'Celular fotografiando la vela sostenida en una mano.',
              ancho: 462,
              alto: 550,
            },
          },
        ],
        nota: {
          etiqueta: 'Con estas 3 fotos',
          texto: 'puedes armar una publicación, historia o catálogo.',
        },
      },
      {
        tipo: 'checklist',
        kicker: '04 · Antes de publicar',
        titulo: 'Haz este chequeo rápido.',
        bajada: 'No busques perfección. Busca claridad y confianza.',
        items: [
          '¿Se entiende qué vendo?',
          '¿La foto está bien iluminada?',
          '¿El fondo se ve limpio?',
          '¿Tengo al menos una foto de detalle?',
          '¿La imagen invita a escribir o comprar?',
        ],
        nota: { etiqueta: 'Reto express', texto: 'hoy toma 3 fotos de un producto y compáralas.' },
        cierre: 'Una buena foto no solo se ve bonita: también ayuda a vender mejor.',
      },
    ],
  },
  {
    slug: 'instagram',
    titulo: 'Tu negocio en Instagram',
    bajada: 'Haz que tu perfil se vea claro, confiable y fácil de entender.',
    resumen: 'Los seis puntos del perfil que un cliente nuevo mira primero.',
    grupo: 'canales',
    red: 'instagram',
    laminas: laminasDe('instagram', 1, 1055, 1491),
    secciones: [
      {
        tipo: 'tarjetas',
        kicker: '01 · Empieza por tu perfil',
        titulo: 'Tu Instagram también habla por tu negocio.',
        bajada:
          'Antes de publicar, asegúrate de que tu perfil explique quién eres, qué ofreces y cómo contactarte. Si alguien entra a tu cuenta, debería entender tu negocio en pocos segundos.',
        numeradas: true,
        items: [
          FOTO_PERFIL_LOGO,
          {
            titulo: 'Nombre + usuario',
            texto:
              'Haz que sea fácil encontrarte. Si puedes, incluye el nombre de tu negocio y evita usuarios confusos o difíciles de escribir.',
          },
          {
            titulo: 'Bio clara',
            texto:
              'Explica qué haces, para quién y qué te hace especial. Usa frases simples. Ejemplo: «Detalles personalizados para celebraciones especiales en Manrique».',
          },
          {
            titulo: 'Información clave',
            texto:
              'Incluye ciudad o barrio, horario si aplica, y una forma de contacto. Si vendes por WhatsApp, deja el enlace o indícalo claramente.',
          },
          {
            titulo: 'Historias destacadas',
            texto:
              'Organiza tu negocio con portadas simples. Puedes tener: Productos, Precios, Pedidos, Testimonios y Cómo comprar.',
          },
          {
            titulo: 'Primer vistazo',
            texto:
              'Cuando alguien vea tu perfil, debe sentir orden y confianza. Usa fotos limpias, textos legibles y una imagen coherente con tu marca.',
          },
        ],
        nota: regla(
          'si una persona entiende qué vendes, para quién es y cómo comprarte en menos de 10 segundos, vas por buen camino.',
        ),
      },
      {
        tipo: 'tarjetas',
        ...QUE_PUBLICAR,
        items: [
          {
            titulo: 'Producto o servicio',
            texto: 'Muestra lo que vendes con fotos claras y una explicación corta.',
          },
          {
            titulo: 'Detrás del negocio',
            texto: 'Comparte quién está detrás, cómo trabajas o cómo preparas tus pedidos.',
          },
          {
            titulo: 'Testimonios',
            texto: 'Publica experiencias reales de clientes para generar confianza.',
          },
          {
            titulo: 'Información útil',
            texto:
              'Responde dudas comunes: precios, tiempos, proceso de compra o cuidados del producto.',
          },
        ],
      },
      {
        tipo: 'checklist',
        ...CHEQUEO_CANAL,
        items: [
          'Mi foto de perfil se reconoce.',
          'Mi bio explica claramente qué hago.',
          'Mi perfil dice cómo contactarme.',
          'Mis historias destacadas están organizadas.',
          'Mis publicaciones se ven coherentes.',
          'Un cliente nuevo puede entender mi negocio rápido.',
        ],
        cierre: CIERRE_CANAL('Instagram', 'claro, coherente y útil'),
      },
    ],
  },
  {
    slug: 'facebook',
    titulo: 'Tu negocio en Facebook',
    bajada: 'Haz que tu página se vea clara, confiable y fácil de consultar.',
    resumen: 'Foto, portada, botón de contacto y la información que da confianza.',
    grupo: 'canales',
    red: 'facebook',
    laminas: laminasDe('facebook', 1, 1055, 1491),
    secciones: [
      {
        tipo: 'tarjetas',
        kicker: '01 · Ordena tu página',
        titulo: 'Tu Facebook también representa tu negocio.',
        bajada:
          'Antes de publicar, asegúrate de que tu página explique quién eres, qué ofreces y cómo contactarte. Si alguien entra, debería entender tu negocio en pocos segundos.',
        numeradas: true,
        items: [
          {
            titulo: 'Foto de perfil',
            texto:
              'Usa tu logo o una imagen clara de tu negocio. Debe verse bien y ayudarte a ser reconocido.',
          },
          {
            titulo: 'Portada',
            texto: 'Aprovecha la portada para mostrar qué haces, qué vendes o qué experiencia ofreces.',
          },
          {
            titulo: 'Descripción clara',
            texto: 'Explica qué haces, para quién y qué te diferencia. Usa frases simples y concretas.',
          },
          {
            titulo: 'Botón de contacto',
            texto: 'Activa un botón útil: WhatsApp, llamar, enviar mensaje o visitar tu enlace.',
          },
          {
            titulo: 'Información clave',
            texto: 'Incluye horario, ubicación, medios de contacto y datos que ayuden a confiar.',
          },
          {
            titulo: 'Primer vistazo',
            texto:
              'Tus publicaciones visibles deben transmitir orden, confianza y coherencia con tu marca.',
          },
        ],
        nota: regla(
          'si una persona entiende qué ofreces, cómo escribirte y por qué confiar en ti al entrar a tu página, vas por buen camino.',
        ),
      },
      {
        tipo: 'tarjetas',
        ...QUE_PUBLICAR,
        items: [
          {
            titulo: 'Producto o servicio',
            texto: 'Muestra lo que vendes con fotos claras, ejemplos o explicaciones sencillas.',
          },
          {
            titulo: 'Testimonios',
            texto: 'Comparte experiencias reales de clientes para generar confianza.',
          },
          {
            titulo: 'Promociones o novedades',
            texto: 'Cuenta lanzamientos, descuentos o novedades de forma clara y útil.',
          },
          {
            titulo: 'Información útil',
            texto: 'Responde dudas comunes: precios, tiempos, proceso de compra o recomendaciones.',
          },
        ],
      },
      {
        tipo: 'checklist',
        ...CHEQUEO_CANAL,
        items: [
          'Mi página explica claramente qué hago.',
          'Mi foto y portada se ven coherentes.',
          'Mi página dice cómo contactarme.',
          'Mis publicaciones ayudan a entender mi negocio.',
          'La información está actualizada.',
          'Un cliente nuevo puede confiar rápido.',
        ],
        cierre: CIERRE_CANAL('Facebook', 'claro, coherente y útil'),
      },
    ],
  },
  {
    slug: 'whatsapp',
    titulo: 'Tu negocio en WhatsApp',
    bajada: 'Haz que tu atención se vea clara, ágil y confiable.',
    resumen: 'El perfil, los mensajes rápidos y cómo atender para que compren.',
    grupo: 'canales',
    red: 'whatsapp',
    laminas: laminasDe('whatsapp', 1, 1055, 1491),
    secciones: [
      {
        tipo: 'tarjetas',
        kicker: '01 · Empieza por tu perfil',
        titulo: 'Tu WhatsApp también habla por tu negocio.',
        bajada:
          'Antes de responder mensajes, asegúrate de que tu perfil explique quién eres, qué ofreces y cómo comprarte. Si alguien te escribe, debería sentir confianza desde el primer vistazo.',
        numeradas: true,
        items: [
          FOTO_PERFIL_LOGO,
          {
            titulo: 'Nombre del negocio',
            texto:
              'Haz que el nombre se entienda fácilmente. Evita abreviaturas confusas y procura que coincida con tu marca.',
          },
          {
            titulo: 'Descripción breve',
            texto:
              'Explica qué haces y para quién. Ejemplo: «Postres caseros por encargo en Manrique».',
          },
          {
            titulo: 'Información clave',
            texto:
              'Incluye horarios, zona de entrega y la forma de pago si aplica. Entre más claro, menos dudas.',
          },
          {
            titulo: 'Catálogo o lista',
            texto:
              'Si puedes, organiza tus productos o servicios con nombre, foto y precio para facilitar la compra.',
          },
          {
            titulo: 'Mensajes rápidos',
            texto:
              'Ten respuestas listas para saludar, enviar precios, explicar el proceso y hacer seguimiento.',
          },
        ],
        nota: regla(
          'si una persona entiende qué vendes, cuánto cuesta o cómo pedirlo en pocos mensajes, vas por buen camino.',
        ),
      },
      {
        tipo: 'tarjetas',
        kicker: '02 · Cómo atender mejor',
        titulo: 'No se trata solo de responder.',
        bajada: 'También se trata de responder bien, con orden y amabilidad.',
        items: [
          {
            titulo: 'Saluda con claridad',
            texto: 'Preséntate, agradece el mensaje y guía a la persona en la conversación.',
          },
          {
            titulo: 'Explica fácil',
            texto:
              'Comparte precios, tiempos y pasos de compra con mensajes cortos y fáciles de entender.',
          },
          {
            titulo: 'Envía confianza',
            texto:
              'Usa fotos claras, información precisa y un tono amable para que comprar sea más fácil.',
          },
          {
            titulo: 'Haz seguimiento',
            texto:
              'Si la persona no responde, puedes escribir de nuevo con respeto y sin presionar.',
          },
        ],
      },
      {
        tipo: 'checklist',
        ...CHEQUEO_CANAL,
        items: [
          'Mi foto de perfil se reconoce.',
          'Mi descripción dice claramente qué hago.',
          'Mis clientes entienden cómo comprar.',
          'Tengo respuestas rápidas listas.',
          'Mis precios o servicios se explican fácil.',
          'Mi atención se siente ordenada y confiable.',
        ],
        cierre: CIERRE_CANAL('WhatsApp', 'claro, útil y fácil de responder'),
      },
    ],
  },
  {
    slug: 'crea-contenido',
    titulo: 'Crea contenido sin complicarte',
    bajada: 'Ideas simples para mostrar tu negocio, conectar con tus clientes y publicar con más claridad.',
    resumen: 'Qué publicar, un plan de cuatro semanas y plantillas para no empezar de cero.',
    grupo: 'publicar',
    laminas: laminasDe('crea-contenido', 6, 1440, 810),
    secciones: [
      {
        tipo: 'tarjetas',
        kicker: '01 · Antes de publicar',
        titulo: 'No publiques por publicar.',
        bajada:
          'Antes de diseñar algo, pregúntate qué debe entender tu cliente. Cada contenido debería ayudar a que una persona entienda mejor tu negocio, confíe más en lo que haces o sepa qué paso dar después.',
        numeradas: true,
        items: [
          {
            titulo: 'Qué vendo',
            texto: 'Muestra con claridad tu producto o servicio. No supongas que todos lo entienden.',
          },
          {
            titulo: 'Para quién es',
            texto:
              'Piensa en quién necesita eso que haces: familias, vecinos, estudiantes, negocios o personas con una necesidad específica.',
          },
          {
            titulo: 'Qué quiero que haga',
            texto:
              'Tu contenido puede invitar a escribirte, pedir información, visitar tu perfil o hacer una compra.',
          },
          {
            titulo: 'Qué quiero que recuerde',
            texto:
              'Elige una idea principal: tu calidad, tu cercanía, tu rapidez o lo que te hace diferente.',
          },
        ],
        nota: regla('si un contenido informa, conecta o genera confianza, ya está cumpliendo su función.'),
      },
      {
        tipo: 'tarjetas',
        kicker: '02 · Qué publicar',
        titulo: 'Con 4 tipos de contenido ya puedes empezar.',
        bajada:
          'No necesitas publicar de todo. Empieza con contenidos simples que ayuden a mostrar tu negocio.',
        items: [
          {
            titulo: 'Producto o servicio',
            texto:
              'Muestra lo que vendes con fotos claras, videos sencillos o una explicación breve.',
          },
          {
            titulo: 'Detrás del negocio',
            texto:
              'Comparte cómo trabajas, cómo preparas tus pedidos o quién está detrás de la marca.',
          },
          {
            titulo: 'Información útil',
            texto:
              'Responde dudas comunes: precios, horarios, pedidos, entregas, cuidados o formas de pago.',
          },
          {
            titulo: 'Prueba social',
            texto: 'Publica testimonios, recomendaciones, resultados o experiencias de clientes.',
          },
        ],
        nota: {
          etiqueta: 'Dónde usarlas',
          texto: 'publicaciones, historias, estados o reels cortos.',
        },
      },
      {
        tipo: 'tarjetas',
        kicker: '03 · Una semana simple',
        titulo: 'Así puedes organizarte sin enredarte.',
        bajada: 'Si puedes hacer 4 contenidos al mes, esta estructura te ayuda a empezar.',
        numeradas: true,
        items: [
          {
            titulo: 'Semana 1 · Muestra lo que ofreces',
            texto:
              'Publica un producto, servicio o trabajo tuyo. La idea es que entiendan qué vendes.',
          },
          {
            titulo: 'Semana 2 · Resuelve una duda',
            texto: 'Explica un precio, un proceso, una recomendación o una pregunta frecuente.',
          },
          {
            titulo: 'Semana 3 · Muestra cómo trabajas',
            texto: 'Comparte el proceso, el detrás de cámaras o quién está detrás del negocio.',
          },
          {
            titulo: 'Semana 4 · Genera confianza',
            texto:
              'Comparte un testimonio, una experiencia, una promoción o una invitación a pedir.',
          },
        ],
        nota: {
          etiqueta: 'Tip',
          texto: 'si no puedes hacer 4, empieza con 2: uno para mostrar y otro para generar confianza.',
        },
      },
      {
        tipo: 'plantillas',
        kicker: '04 · Hazlo fácil',
        titulo: 'No empieces desde cero.',
        bajada: 'Usa plantillas simples para crear contenido sin complicarte.',
        items: [
          {
            titulo: 'Post de producto',
            texto:
              'Este es [producto o servicio]. Sirve para [beneficio]. Ideal para [tipo de cliente]. Si quieres pedirlo, escríbenos por [canal].',
          },
          {
            titulo: 'Historia o estado',
            texto:
              'Hoy estamos trabajando en [pedido / servicio]. Si quieres información, precios o hacer un pedido, escríbenos.',
          },
          {
            titulo: 'Reel o video corto',
            pasos: [
              'Muestra el producto o proceso.',
              'Explica en una frase qué hace o para quién es.',
              'Cierra con: «Escríbenos para más información».',
            ],
          },
        ],
        nota: {
          etiqueta: 'No necesitas frases perfectas',
          texto: 'necesitas textos claros y fáciles de adaptar.',
        },
      },
      {
        tipo: 'checklist',
        kicker: '05 · Revísalo',
        titulo: 'Antes de publicar, haz este chequeo.',
        bajada: 'No tiene que quedar perfecto. Tiene que quedar claro, útil y coherente.',
        items: [
          'Se entiende qué vendo.',
          'La foto o video se ve claro.',
          'El texto es corto y fácil de leer.',
          'Dice cómo contactarme.',
          'Se siente coherente con mi marca.',
          'Tiene una llamada a la acción.',
          'Aporta algo útil o genera confianza.',
          'Lo publicaría con tranquilidad.',
        ],
        cierre: 'Contenido útil > contenido perfecto. Empieza simple y mejora con la práctica.',
      },
    ],
  },
  {
    slug: 'tu-pitch',
    titulo: 'Tu pitch',
    bajada: 'Aprende a presentar tu negocio de forma clara, breve y convincente.',
    resumen: 'Seis pasos y una plantilla para contar tu negocio en menos de un minuto.',
    grupo: 'presentarte',
    laminas: laminasDe('tu-pitch', 1, 1055, 1491),
    secciones: [
      {
        tipo: 'tarjetas',
        kicker: '01 · Empieza por la idea',
        titulo: 'Un buen pitch no es hablar mucho.',
        bajada:
          'Es explicar tu negocio con claridad. En poco tiempo, la otra persona debería entender qué haces, para quién es, por qué importa y qué necesitas.',
        numeradas: true,
        items: [
          {
            titulo: 'Qué problema resuelves',
            texto:
              'Empieza por la necesidad real. ¿Qué le pasa a tu cliente y por qué eso importa?',
          },
          {
            titulo: 'Qué ofreces',
            texto:
              'Explica tu producto o servicio de forma simple. Evita palabras técnicas o demasiado amplias.',
          },
          {
            titulo: 'Para quién es',
            texto:
              'Di con claridad a quién ayudas: personas, negocios, vecinos, familias, estudiantes o un grupo específico.',
          },
          {
            titulo: 'Por qué elegirte',
            texto:
              'Menciona tu diferencia: calidad, cercanía, personalización, rapidez, experiencia u otro valor concreto.',
          },
        ],
        nota: regla('si alguien entiende tu negocio en menos de 1 minuto, tu pitch va por buen camino.'),
      },
      {
        tipo: 'tarjetas',
        kicker: '02 · La estructura',
        titulo: 'Así puedes armar tu pitch.',
        bajada: 'No necesitas memorizar un discurso largo. Solo organiza tu idea en este orden:',
        numeradas: true,
        items: [
          { titulo: 'Quién eres', texto: 'Presenta el nombre de tu negocio y qué haces.' },
          { titulo: 'Problema', texto: 'Explica qué necesidad o situación existe.' },
          { titulo: 'Solución', texto: 'Cuenta cómo tu negocio responde a ese problema.' },
          { titulo: 'Cliente', texto: 'Di para quién está pensado tu producto o servicio.' },
          { titulo: 'Diferencial', texto: 'Explica qué te hace distinto o valioso.' },
          {
            titulo: 'Qué buscas',
            texto: 'Cierra diciendo qué necesitas: una venta, un contacto, una alianza, apoyo o inversión.',
          },
        ],
      },
      {
        tipo: 'plantillas',
        kicker: 'Plantilla rápida',
        titulo: 'Solo cambia lo que está entre corchetes.',
        items: [
          {
            titulo: 'Tu pitch en cinco frases',
            texto:
              'Somos [NOMBRE DEL NEGOCIO]. Ayudamos a [TIPO DE CLIENTE] que necesita [PROBLEMA / NECESIDAD] ofreciéndole [SOLUCIÓN]. Nos eligen porque [DIFERENCIAL]. Hoy buscamos [LO QUE NECESITAS].',
          },
        ],
      },
      {
        tipo: 'comparacion',
        kicker: '03 · Ejemplo',
        titulo: 'Así suena un pitch claro.',
        mal: {
          etiqueta: 'Muy enredado',
          texto:
            '«Nosotros hacemos muchas cosas para diferentes personas y tenemos una idea muy bonita que puede servir mucho…»',
        },
        bien: {
          etiqueta: 'Mucho mejor',
          texto:
            '«Somos Dulce Barrio. Hacemos postres por encargo para personas que quieren celebrar momentos especiales sin complicarse. Nos eligen porque personalizamos cada pedido y entregamos con puntualidad. Hoy buscamos más clientes y alianzas para crecer en Manrique.»',
        },
        senales: ['Se entiende', 'Dice para quién es', 'Tiene una necesidad clara'],
      },
      {
        tipo: 'frases',
        kicker: '04 · Practícalo',
        titulo: 'Tu turno.',
        bajada: 'Completa estas frases en una hoja o en las notas del celular.',
        items: [
          'Mi negocio se llama…',
          'Ayudo a…',
          'Que necesitan…',
          'Les ofrezco…',
          'Me eligen porque…',
          'Hoy busco…',
        ],
      },
      {
        tipo: 'checklist',
        kicker: 'Chequéalo antes de decirlo',
        titulo: '¿Está listo tu pitch?',
        items: [
          'Puedo decirlo en menos de 1 minuto.',
          'Se entiende qué hago.',
          'Se entiende para quién es.',
          'Mi diferencia es concreta.',
          'Suena natural, no memorizado.',
          'Termino con una petición clara.',
        ],
        cierre: 'Tu pitch no tiene que sonar perfecto. Tiene que sonar claro, seguro y real.',
      },
    ],
  },
];

export function guiaPorSlug(slug: string): Guia | undefined {
  return GUIAS.find((g) => g.slug === slug);
}

/** Guía anterior y siguiente en el orden de lectura, para el pie de cada guía. */
export function vecinas(slug: string): { anterior?: Guia; siguiente?: Guia } {
  const i = GUIAS.findIndex((g) => g.slug === slug);
  return { anterior: GUIAS[i - 1], siguiente: GUIAS[i + 1] };
}
