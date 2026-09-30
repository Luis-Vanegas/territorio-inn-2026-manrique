// Solo tipos: Node los borra al correr verificar-marca con --experimental-strip-types,
// que no resuelve un import de valor sin extensión.
import type { Coleccion, Lamina, Nota } from './marca';

/**
 * Guías de ventas: mismo formato que las de marca (ver lib/marca.ts) y los
 * mismos componentes. Sale de las láminas del equipo en public/ventas/laminas.
 *
 * Primero conocer al cliente, después venderle: por eso ese es el orden de
 * los grupos y de las guías.
 */

const regla = (texto: string): Nota => ({ etiqueta: 'Regla práctica', texto });

const laminas = (slug: string, cantidad: number, ancho: number, alto: number): Lamina[] =>
  Array.from({ length: cantidad }, (_, i) => ({ src: `/ventas/laminas/${slug}-${i + 1}.jpg`, ancho, alto }));

export const VENTAS: Coleccion = {
  nombre: 'Ventas',
  bajada:
    'Guías del equipo de Constelaciones para entender a tu cliente, conversar con él y cerrar más ventas, sin presionar a nadie. Ideas simples que puedes usar desde hoy.',
  grupos: [
    {
      id: 'cliente',
      titulo: 'Conoce a tu cliente',
      intro: 'Antes de venderle a alguien, entiende quién es y qué necesita.',
    },
    {
      id: 'vender',
      titulo: 'Vende mejor',
      intro: 'Cómo preparar tu oferta, conversar y cerrar sin perder oportunidades.',
    },
    {
      id: 'organizar',
      titulo: 'Organiza tus ventas',
      intro: 'Anota, sigue y mide para que no se te pierda ningún cliente.',
    },
  ],
  guias: [
    {
      slug: 'identifica-a-tu-cliente',
      titulo: 'Identifica a tu cliente',
      bajada: 'Una guía práctica para entender mejor a quién ayudas y cómo conectar con esa persona.',
      resumen: 'Qué observar de tu cliente y un perfil que llenas en pocos minutos.',
      grupo: 'cliente',
      laminas: laminas('identifica-a-tu-cliente', 1, 900, 1600),
      secciones: [
        {
          tipo: 'tarjetas',
          kicker: '01 · Empieza por una persona',
          titulo: 'No le vendas a todo el mundo.',
          bajada:
            'Piensa en una persona real, no en «todo tipo de cliente». Entre más claro tengas a quién ayudas, más fácil será comunicar, vender y construir confianza.',
          items: [
            { titulo: '¿Quién es?', texto: 'Edad, ocupación o tipo de cliente.' },
            { titulo: '¿Qué necesita?', texto: 'Qué problema quiere resolver.' },
            { titulo: '¿Qué valora?', texto: 'Precio, rapidez, calidad, confianza, cercanía…' },
            { titulo: '¿Qué le frena?', texto: 'Dudas, presupuesto, tiempo o desconfianza.' },
          ],
        },
        {
          tipo: 'tarjetas',
          kicker: '02 · Lo que debes observar',
          titulo: 'Mira más allá de la edad.',
          bajada: 'Conoce su contexto, sus motivaciones y los canales por los que te encuentra.',
          items: [
            { titulo: 'Contexto', texto: '¿Cuándo compra? ¿Dónde te descubre?' },
            { titulo: 'Motivación', texto: '¿Qué resultado desea lograr?' },
            { titulo: 'Barreras', texto: '¿Qué le hace decir «todavía no»?' },
            {
              titulo: 'Canal',
              texto: '¿Te encuentra por WhatsApp, Instagram, Facebook o por una recomendación?',
            },
          ],
          nota: regla('si entiendes qué necesita, qué le preocupa y qué espera de ti, ya puedes comunicarte mejor.'),
        },
        {
          tipo: 'frases',
          kicker: '03 · Crea tu perfil de cliente',
          titulo: 'Llénalo en pocos minutos.',
          bajada:
            'Usa estas preguntas como guía para definir a tu cliente ideal. Complétalas en una hoja o en las notas del celular.',
          items: [
            'Mi cliente ideal es…',
            'Generalmente busca…',
            'Antes de comprar, duda por…',
            'Me encuentra principalmente en…',
            'Me elige cuando valora…',
            'Yo le ayudo a…',
          ],
        },
        {
          tipo: 'checklist',
          kicker: '04 · Chequeo rápido',
          titulo: 'Vas por buen camino si…',
          items: [
            'Puedo describir claramente a mi cliente.',
            'Sé qué problema quiere resolver.',
            'Entiendo por qué me compraría.',
            'Sé qué le genera desconfianza.',
            'Sé dónde lo puedo encontrar.',
            'Mi mensaje está pensado para esa persona.',
          ],
          cierre:
            'Tu cliente ideal no tiene que ser perfecto. Tiene que ser lo suficientemente claro para ayudarte a vender, comunicar y crecer mejor.',
        },
      ],
    },
    {
      slug: 'vende-mejor',
      titulo: 'Vende mejor',
      bajada:
        'Ideas simples para vender con más claridad, ordenar tus conversaciones y convertir más oportunidades en clientes.',
      resumen: 'Tu oferta en una frase, un guion de seis pasos y qué responder cuando te dicen «lo voy a pensar».',
      grupo: 'vender',
      laminas: laminas('vende-mejor', 5, 1055, 1493),
      secciones: [
        {
          tipo: 'tarjetas',
          kicker: 'En tres pasos',
          titulo: 'Vender mejor no es hablar más.',
          numeradas: true,
          items: [
            {
              titulo: 'Prepárate',
              texto: 'Ten claro qué vendes, para quién y por qué vale la pena comprarte.',
            },
            {
              titulo: 'Conversa',
              texto:
                'Haz preguntas, escucha y explica tu oferta de manera simple, sin dar demasiada información.',
            },
            {
              titulo: 'Cierra',
              texto:
                'Resuelve dudas, propón el siguiente paso y haz seguimiento sin presionar al cliente.',
            },
          ],
          nota: regla('vender mejor no es hablar más. Es hacer que tu cliente entienda, confíe y decida.'),
        },
        {
          tipo: 'tarjetas',
          kicker: '01 · Antes de vender',
          titulo: 'Ten clara tu oferta.',
          bajada:
            'Antes de escribirle a un cliente o responder un mensaje, asegúrate de poder explicar estas cuatro cosas.',
          numeradas: true,
          items: [
            {
              titulo: 'Qué ofreces',
              texto: 'Producto o servicio. Dilo con palabras simples y sin tecnicismos.',
            },
            {
              titulo: 'Qué problema resuelve',
              texto: 'Qué necesidad cubre, qué mejora o qué le facilita al cliente.',
            },
            {
              titulo: 'Para quién es',
              texto: 'Familias, negocios, vecinos, estudiantes o un tipo de cliente específico.',
            },
            {
              titulo: 'Qué quieres que haga',
              texto: 'Escribirte, pedir precio, agendar, comprar o volver a comprar.',
            },
          ],
        },
        {
          tipo: 'plantillas',
          kicker: 'Fórmula rápida',
          titulo: 'Tu oferta en una frase.',
          items: [
            {
              titulo: 'Solo cambia lo que está entre corchetes',
              texto:
                'Ayudo a [TIPO DE CLIENTE] que necesita [PROBLEMA] ofreciéndole [SOLUCIÓN]. Me eligen porque [DIFERENCIAL].',
            },
          ],
        },
        {
          tipo: 'tarjetas',
          kicker: '02 · Conversa para vender',
          titulo: 'Un guion simple funciona mejor.',
          bajada: 'No necesitas aprenderte un discurso. Solo sigue este orden cuando hables con un cliente.',
          numeradas: true,
          items: [
            { titulo: 'Saluda', texto: 'Preséntate y agradece el mensaje.' },
            {
              titulo: 'Pregunta',
              texto: 'Averigua qué necesita, para cuándo lo quiere y qué le importa más.',
            },
            {
              titulo: 'Recomienda',
              texto: 'Sugiere lo más adecuado en lugar de mandar todo el catálogo.',
            },
            { titulo: 'Explica', texto: 'Cuenta precio, qué incluye, tiempos y cómo comprar.' },
            {
              titulo: 'Cierra',
              texto: 'Propón un paso concreto: «Si quieres, te lo separo» o «¿Te envío los datos para el pago?».',
            },
            {
              titulo: 'Haz seguimiento',
              texto: 'Si no decide de una vez, vuelve a escribir con respeto.',
            },
          ],
          nota: {
            etiqueta: 'Tip',
            texto: 'preguntar primero te ayuda a vender mejor que explicar todo desde el inicio.',
          },
        },
        {
          tipo: 'tarjetas',
          kicker: '03 · Objeciones y seguimiento',
          titulo: 'No pierdas la oportunidad tan rápido.',
          bajada: 'Muchas ventas no se caen por el precio: se caen por no saber qué responder.',
          items: [
            {
              titulo: '«Lo voy a pensar»',
              texto: 'Pregunta con respeto si hay alguna duda puntual que puedas aclarar.',
            },
            {
              titulo: '«Está muy caro»',
              texto: 'Responde reforzando el valor: qué incluye, qué lo hace diferente o qué problema resuelve.',
            },
            {
              titulo: '«Después te escribo»',
              texto: 'Ofrece dejar la información lista y acuerda un momento para volver a hablar.',
            },
            {
              titulo: '«Estoy comparando»',
              texto: 'Destaca tu diferencial y ayuda a que la persona compare mejor.',
            },
          ],
        },
        {
          tipo: 'plantillas',
          kicker: 'Seguimiento simple',
          titulo: 'Escribe corto y amable.',
          items: [
            {
              titulo: 'Cómo hacerlo',
              pasos: [
                'Espera un tiempo razonable.',
                'Escribe corto y amable.',
                'Recuerda el beneficio o la información pendiente.',
                'Cierra con una pregunta concreta.',
              ],
            },
            {
              titulo: 'Mensaje de seguimiento',
              texto:
                'Hola, [NOMBRE]. Te escribo por si todavía te interesa [PRODUCTO O SERVICIO]. Si quieres, te ayudo a resolver cualquier duda o te comparto nuevamente la información.',
            },
          ],
        },
        {
          tipo: 'checklist',
          kicker: '04 · Chequeo rápido',
          titulo: 'Antes de seguir, revisa esto.',
          bajada: 'Si marcas la mayoría, ya vas por buen camino.',
          items: [
            'Se entiende qué vendo.',
            'Mi cliente entiende cómo comprar.',
            'Tengo una respuesta clara para el precio.',
            'Cierro con un siguiente paso.',
            'No mando demasiada información de una vez.',
            'Hago seguimiento con respeto.',
            'Mi atención se siente confiable.',
            'Pido la venta con claridad.',
          ],
          cierre: 'Vender mejor no significa presionar. Significa orientar mejor a tu cliente.',
        },
        {
          tipo: 'checklist',
          kicker: 'Acción de esta semana',
          titulo: 'Elige una y hazla.',
          items: [
            'Elige un producto o servicio principal.',
            'Escribe tu oferta en una frase.',
            'Ajusta un mensaje de seguimiento.',
            'Prueba una mejor forma de cerrar la conversación.',
          ],
        },
      ],
    },
    {
      slug: 'crm-y-embudo',
      titulo: 'Organiza, CRM y embudo',
      bajada: 'Qué es un CRM, cómo funciona un embudo de ventas y cómo usarlos en tu negocio, sin enredos.',
      resumen: 'Una lista con intención, el camino de tu cliente hasta comprar y una rutina de cinco pasos.',
      grupo: 'organizar',
      laminas: laminas('crm-y-embudo', 4, 941, 1672),
      secciones: [
        {
          tipo: 'tarjetas',
          kicker: '01 · Empieza por entenderlo',
          titulo: 'Vender mejor también es organizar mejor.',
          items: [
            {
              titulo: 'Organiza',
              texto: 'Ordena tus clientes, pedidos, seguimientos y tareas para no perder oportunidades.',
            },
            {
              titulo: 'CRM',
              texto: 'Un sistema simple para registrar quién te escribió, qué necesita y cuál es el siguiente paso.',
            },
            {
              titulo: 'Embudo',
              texto: 'La ruta que siguen tus clientes desde que preguntan hasta que compran y vuelven.',
            },
          ],
          nota: regla('no necesitas un software complejo; necesitas claridad y constancia.'),
        },
        {
          tipo: 'tarjetas',
          kicker: '02 · Organiza tus contactos',
          titulo: 'Un CRM es una lista con intención.',
          bajada: 'Te ayuda a registrar quién te escribió, qué necesita, en qué etapa va y qué debes hacer después.',
          items: [
            { titulo: 'Nombre', texto: 'Quién es la persona o el negocio.' },
            { titulo: 'Contacto', texto: 'WhatsApp, Instagram, teléfono o correo.' },
            { titulo: 'Qué busca', texto: 'Qué producto, servicio o ayuda necesita.' },
            { titulo: 'Etapa', texto: 'Si solo preguntó, si está comparando o si ya compró.' },
            { titulo: 'Siguiente paso', texto: 'Qué vas a hacer después: responder, cotizar, hacer seguimiento o cerrar.' },
          ],
          nota: regla('si lo anotas, puedes hacer seguimiento; si no lo anotas, lo puedes perder.'),
        },
        {
          tipo: 'tarjetas',
          kicker: 'Ejemplo en un CRM',
          titulo: 'Así se ve en la práctica.',
          bajada: 'Puedes empezar en una libreta, en Excel o en Google Sheets.',
          items: [
            {
              titulo: 'Ana',
              texto: 'Busca una torta personalizada. Etapa: cotización enviada. Siguiente paso: escribirle mañana.',
            },
            {
              titulo: 'Tienda Sol',
              texto: 'Busca pedidos al por mayor. Etapa: en conversación. Siguiente paso: enviarle el catálogo.',
            },
            {
              titulo: 'Carlos',
              texto: 'Buscaba una camiseta estampada. Etapa: compró. Siguiente paso: pedirle una recomendación.',
            },
          ],
        },
        {
          tipo: 'tarjetas',
          kicker: '03 · De interés a compra',
          titulo: 'No todas las personas que preguntan compran de inmediato.',
          bajada:
            'Por eso necesitas ver tu proceso como una ruta con etapas. Así sabes dónde se te quedan los clientes y qué mejorar.',
          numeradas: true,
          items: [
            { titulo: 'Te descubren', texto: 'Ven tu negocio o alguien se los recomienda.' },
            { titulo: 'Preguntan', texto: 'Piden información, precio o detalles.' },
            { titulo: 'Evalúan', texto: 'Comparan, dudan o piden tiempo.' },
            { titulo: 'Compran', texto: 'Toman la decisión y cierran contigo.' },
            { titulo: 'Vuelven o recomiendan', texto: 'Si la experiencia fue buena, regresan o te recomiendan.' },
          ],
          nota: regla('el embudo no es para complicarte; es para entender en qué parte debes actuar.'),
        },
        {
          tipo: 'tarjetas',
          kicker: 'Un ejemplo con números',
          titulo: 'Mira dónde se te enfrían los clientes.',
          bajada: 'Ahí está tu oportunidad de mejora.',
          items: [
            { titulo: '20', texto: 'preguntan.' },
            { titulo: '10', texto: 'siguen interesados.' },
            { titulo: '5', texto: 'comparan.' },
            { titulo: '2', texto: 'compran.' },
            { titulo: '1', texto: 'vuelve o te recomienda.' },
          ],
        },
        {
          tipo: 'tarjetas',
          kicker: '04 · Paso a paso',
          titulo: 'Organiza tu proceso en 5 pasos.',
          bajada: 'Empieza fácil, sin software complejo.',
          numeradas: true,
          items: [
            { titulo: 'Haz una lista', texto: 'Anota a todas las personas que preguntan por tu negocio.' },
            { titulo: 'Crea columnas simples', texto: 'Nombre, contacto, qué busca, etapa y siguiente paso.' },
            { titulo: 'Clasifica por etapa', texto: 'Separa quién preguntó, quién está dudando y quién ya compró.' },
            { titulo: 'Revisa cada semana', texto: 'Mira con quién debes retomar el contacto o cerrar.' },
            { titulo: 'Toma acción', texto: 'Haz seguimiento, envía información o pide una recomendación.' },
          ],
        },
        {
          tipo: 'checklist',
          kicker: 'Rutina recomendada',
          titulo: 'Poco, pero constante.',
          bajada: 'Puedes llevarlo en un cuaderno, en Excel, en Google Sheets o en herramientas como Trello o Notion.',
          items: [
            'Cada día: anota los contactos nuevos.',
            'Cada semana: revisa los pendientes.',
            'Cada mes: mira cuántos compraron.',
          ],
          cierre: 'No se trata de usar una herramienta perfecta. Se trata de no dejar perder tus oportunidades.',
        },
      ],
    },
  ],
};
