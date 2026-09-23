/**
 * Catálogo de proveedores de modelo, en orden de preferencia.
 *
 * Sin `server-only` a propósito, y sin leer una sola variable de entorno: es
 * una tabla de datos públicos (URLs y nombres de modelo, nada secreto). Eso
 * permite que `scripts/verificar-agente.mjs` la importe con
 * `--experimental-strip-types` en vez de mantener una copia que se
 * desactualiza — el mismo patrón que `scripts/verificar-entorno.mjs` usa con
 * `lib/entorno.ts`.
 *
 * Las claves las lee `asesor.ts`, que sí es server-only.
 *
 * ── Por qué una lista y no uno solo ──
 *
 * Todos corren con plan gratuito, y un plan gratuito se agota. Cuando a Gemini
 * se le acaba el cupo diario, el vecino que pregunta no tiene por qué quedarse
 * sin respuesta: el asesor baja al siguiente de la lista y sigue andando.
 *
 * El orden importa: se prueban de arriba hacia abajo y gana el primero que
 * responda. Y cada uno que falla lento le cobra su espera entera al vecino que
 * mira la pantalla, porque el tope de `TIMEOUT_MS` es por proveedor y se suman.
 *
 * Por eso el orden se decide MIDIENDO, no por reputación. El criterio, en este
 * orden: primero el que responde siempre y rápido, después el que responde
 * rápido pero con tope de ráfaga, y al fondo los que fallan colgados — un
 * proveedor que se cuelga cuesta 10 segundos cada vez que le toca el turno.
 *
 * El orden vigente sale de medirlos en vivo el 2026-09-22 contra las claves
 * reales, no de lo que promete cada plan gratuito:
 *   1. Groq     → ~1.2 s, respondió siempre.
 *   2. Routeway → ~0.8 s, pero tope de 5 pedidos por MINUTO.
 *   3. Gemini   → 20 pedidos por DÍA, y 2 de cada 3 fallos son colgados.
 *   4. OpenRouter → sin clave hoy, sin medir.
 *   5. NVIDIA   → no respondió ni una vez en toda la jornada de pruebas.
 *
 * Antes Gemini estaba arriba con el argumento de que era «el de cupo más
 * holgado». No lo era: su nivel gratuito son 20 peticiones diarias
 * (`generate_content_free_tier_requests, limit: 20`). Si algo cambia, se vuelve
 * a medir con `npm run agente:verificar` y se reordena acá.
 *
 * ── Por qué todos hablan el mismo formato ──
 *
 * Gemini, Groq, OpenRouter, NVIDIA NIM y Routeway exponen el formato de OpenAI
 * en /chat/completions. Por eso el catálogo solo guarda una URL y un nombre de
 * modelo: el cuerpo del pedido y la lectura de la respuesta son idénticos
 * para todos. Agregar un proveedor más que hable ese formato son seis líneas
 * acá y cero en el resto del código — NVIDIA NIM (2026-09-17) y Routeway
 * (2026-09-21) fueron exactamente eso.
 *
 * ── Cómo se prende cada uno ──
 *
 * Con su variable de clave, y nada más. Poné una y funciona; poné todas
 * y rota entre todas. El modelo tiene un valor por defecto que se puede
 * pisar con su propia variable, porque los proveedores renombran modelos
 * seguido y eso no debería obligar a un despliegue.
 */

export interface Proveedor {
  id: string;
  /** Nombre para los logs y para el script de verificación. */
  nombre: string;
  url: string;
  /** Variable de entorno con la clave. Si falta, el proveedor no se usa. */
  variableClave: string;
  /** Variable opcional para pisar el modelo por defecto. */
  variableModelo: string;
  /**
   * Variable opcional para pisar la URL. Existe por dos motivos concretos: un
   * proveedor puede mover su endpoint sin avisar, y es la única forma de
   * apuntar la rotación a un servidor de prueba local para comprobar que el
   * turno pasa al siguiente cuando el primero falla.
   */
  variableUrl: string;
  /**
   * Verificado el 2026-09-15 contra la documentación oficial. Los proveedores
   * renombran y dan de baja modelos: si empieza a fallar con 404, correr
   * `npm run agente:verificar` — lista los modelos que el proveedor acepta hoy.
   */
  modeloPorDefecto: string;
  /** Para el mensaje de ayuda del verificador. */
  dondeSacarClave: string;
}

export const PROVEEDORES: Proveedor[] = [
  {
    id: 'groq',
    nombre: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    // Sin el sufijo `_KEY`, igual que `Gemi_Api` y `API_router`: ya son tres de
    // cinco los que no siguen el patrón, así que el nombre real del entorno
    // manda y este campo es el que lo dice. No renombrar «para que quede
    // prolijo» sin cambiar también el .env, o el proveedor deja de verse.
    variableClave: 'GROQ_API',
    variableModelo: 'GROQ_MODELO',
    variableUrl: 'GROQ_API_URL',
    // Groq dio de baja `llama-3.3-70b-versatile` (404 `model_not_found` el
    // 2026-09-22) y su catálogo quedó casi todo en audio, TTS y clasificadores
    // de seguridad. Para conversar solo servían tres, y los tres se probaron en
    // vivo contra la cuenta real: los tres respondieron en ~1 s y ninguno picó
    // con la pregunta trampa del verificador. Se eligió por CÓMO escriben, que
    // es lo que separa a un asesor útil de uno que nadie entiende:
    //   · openai/gpt-oss-120b → 1.2 s, castellano llano. ELEGIDO.
    //   · openai/gpt-oss-20b  → 1.0 s, pero habla de «la empresa», «beneficios
    //     fiscales» y «networking»: acá el público son micronegocios, no
    //     empresas, y esa palabra no se usa en el barrio.
    //   · qwen/qwen3.8-27b    → 0.7 s y el más preciso, pero escribió «personas
    //     jurídicas o ciertos tipos de personas naturales» — justo el lenguaje
    //     jurídico que la regla de «cómo escribes» del prompt prohíbe.
    // Otro modelo: GROQ_MODELO. `npm run agente:verificar` lista los vigentes.
    modeloPorDefecto: 'openai/gpt-oss-120b',
    dondeSacarClave: 'https://console.groq.com/keys',
  },
  {
    id: 'routeway',
    nombre: 'Routeway',
    url: 'https://api.routeway.ai/v1/chat/completions',
    // Se llama así en el entorno de este proyecto (no sigue el patrón
    // `<PROVEEDOR>_API_KEY` de los demás). Las variables distinguen mayúsculas.
    variableClave: 'API_router',
    variableModelo: 'ROUTEWAY_MODELO',
    variableUrl: 'ROUTEWAY_API_URL',
    // Segundo: es el más rápido de todos (~0.8 s), pero su tope de 5 pedidos
    // por minuto lo vuelve frágil apenas dos vecinos preguntan a la vez. Por eso
    // va detrás de Groq y no delante.
    //
    // Verificado en vivo el 2026-09-21. Su GET /v1/models (público) lista 3
    // modelos gratuitos (sufijo :free) y los tres respondieron:
    //   · deepseek-v4-flash:free → ~12 s, respuesta correcta y genérica. ELEGIDO.
    //   · muse-glimmer-30b:free  → ~3 s, pero dijo que el RUT se usa «ante el
    //     SII», que es la entidad de CHILE (acá es la DIAN). Más rápido, y por eso
    //     mismo peor para un asesor de trámites: no se usa.
    //   · minimax-m2.7:free      → dio 502 en la prueba; sin evaluar.
    //
    // Límite del plan gratuito: 5 peticiones por MINUTO por cuenta, compartidas
    // entre los tres modelos (429 «Account per-minute rate limit exceeded»). Ese
    // 429 llega rápido y hace que el asesor pase al siguiente sin castigar la
    // espera, que es lo que lo vuelve un buen segundo pese al tope tan bajo.
    //
    // Otro modelo: ROUTEWAY_MODELO. `npm run agente:verificar` lo prueba.
    modeloPorDefecto: 'deepseek-v4-flash:free',
    dondeSacarClave: 'https://routeway.ai/dashboard — pestaña "API Keys". Ojo: la clave va SOLA en la variable, sin la palabra "Bearer" adelante — el código ya le agrega ese prefijo.',
  },
  {
    id: 'gemini',
    nombre: 'Google Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    // Se llama así en el entorno de este proyecto, igual que `API_router` de
    // Routeway: no sigue el patrón `<PROVEEDOR>_API_KEY` de los demás. Las
    // variables distinguen mayúsculas, así que `GEMI_API` o `gemi_api` no
    // sirven — tiene que ser exactamente este nombre.
    variableClave: 'Gemi_Api',
    variableModelo: 'GEMINI_MODELO',
    variableUrl: 'GEMINI_API_URL',
    // Flash de propósito general: el del medio, que mejor equilibra calidad en
    // español y cupo.
    //
    // Tercero, y no primero como estaba antes. El nivel gratuito de la API son
    // 20 peticiones por DÍA —`generate_content_free_tier_requests, limit: 20`,
    // medido el 2026-09-22— y se agotan en una tarde de pruebas. Peor: ya sin
    // cupo, 2 de cada 3 intentos no devuelven el 429 sino que se cuelgan hasta
    // el timeout, así que cada turno suyo le costaba 10 s al vecino.
    //
    // OJO, cuesta plata creer lo contrario: la suscripción Google One / Gemini
    // Pro del consumidor NO da nada acá. La app de gemini.google.com y esta API
    // son productos distintos con facturación separada; el cupo de la API sale
    // de una cuenta de Google Cloud, no de esa suscripción.
    modeloPorDefecto: 'gemini-3.6-flash',
    dondeSacarClave: 'https://aistudio.google.com/apikey',
  },
  {
    id: 'openrouter',
    nombre: 'OpenRouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    variableClave: 'OPENROUTER_API_KEY',
    variableModelo: 'OPENROUTER_MODELO',
    variableUrl: 'OPENROUTER_API_URL',
    // OpenRouter enruta a decenas de modelos; los del sufijo :free no cobran.
    // Abajo porque su cupo gratuito es el más volátil, y porque hoy no hay clave
    // cargada: nunca se lo midió en vivo contra esta cuenta.
    modeloPorDefecto: 'meta-llama/llama-3.3-70b-instruct:free',
    dondeSacarClave: 'https://openrouter.ai/keys',
  },
  {
    id: 'nvidia',
    nombre: 'NVIDIA NIM',
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    variableClave: 'NVIDIA_API_KEY',
    variableModelo: 'NVIDIA_MODELO',
    variableUrl: 'NVIDIA_API_URL',
    // El catálogo público de NVIDIA (GET /v1/models) lista ~80 modelos, pero
    // la cuenta gratuita no tiene entitlement para todos — probar en vivo
    // contra la cuenta real es la única forma de saberlo: los "nvidia/*"
    // (Nemotron) devolvían 404 "Function ... Not found for account", 401 en
    // otros no tenía nada que ver con el modelo (era la clave mal armada en
    // .env, con "Bearer " de más — ver abajo). De los que sí respondieron,
    // este es el que además pasó la pregunta trampa del verificador
    // (Fondo Nacional de Tenderos inventado) sin alucinar. Verificado en vivo
    // el 2026-09-17 contra la cuenta real del cliente — si un día deja de
    // responder, correr `npm run agente:verificar` reimprime el catálogo
    // vigente de esa cuenta específica.
    modeloPorDefecto: 'google/gemma-4-31b-it',
    dondeSacarClave: 'https://build.nvidia.com — entra con una cuenta gratuita, "Get API Key" en cualquier modelo (empieza con nvapi-). Ojo: la clave va SOLA en la variable, sin la palabra "Bearer" adelante — el código ya le agrega ese prefijo.',
  },
];

export interface ProveedorListo extends Proveedor {
  clave: string;
  modelo: string;
}

/**
 * Endpoint que lista los modelos que el proveedor acepta hoy. Es el mismo
 * `/models` del formato de OpenAI, así que sale de la URL de chat quitándole
 * el sufijo. Lo usa el verificador cuando un modelo devuelve 404: ahí lo único
 * que hace falta saber es qué nombres sí existen.
 */
export function urlDeModelos(proveedor: Proveedor): string {
  return proveedor.url.replace(/\/chat\/completions$/, '/models');
}
