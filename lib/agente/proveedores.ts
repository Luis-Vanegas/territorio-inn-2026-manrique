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
 * responda. Arriba va el de cupo más holgado, no el "mejor" — de nada sirve un
 * modelo excelente que frena a la cuarta pregunta del día.
 *
 * ── Por qué los tres hablan el mismo formato ──
 *
 * Gemini, Groq y OpenRouter exponen el formato de OpenAI en /chat/completions.
 * Por eso el catálogo solo guarda una URL y un nombre de modelo: el cuerpo del
 * pedido y la lectura de la respuesta son idénticos para los tres. Agregar un
 * cuarto proveedor que hable ese formato son seis líneas acá y cero en el resto
 * del código.
 *
 * ── Cómo se prende cada uno ──
 *
 * Con su variable de clave, y nada más. Poné una y funciona; poné las tres y
 * rota entre las tres. El modelo tiene un valor por defecto que se puede pisar
 * con su propia variable, porque los proveedores renombran modelos seguido y
 * eso no debería obligar a un despliegue.
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
    id: 'gemini',
    nombre: 'Google Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    variableClave: 'GEMINI_API_KEY',
    variableModelo: 'GEMINI_MODELO',
    variableUrl: 'GEMINI_API_URL',
    // Flash de propósito general. No el más nuevo ni el más chico: el del medio,
    // que es el que mejor equilibra calidad en español y cupo.
    modeloPorDefecto: 'gemini-3.6-flash',
    dondeSacarClave: 'https://aistudio.google.com/apikey',
  },
  {
    id: 'groq',
    nombre: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    variableClave: 'GROQ_API_KEY',
    variableModelo: 'GROQ_MODELO',
    variableUrl: 'GROQ_API_URL',
    // El 70B y no el 8B: el chico responde más rápido pero se le nota en
    // español, y acá la respuesta la lee alguien que decide un trámite.
    modeloPorDefecto: 'llama-3.3-70b-versatile',
    dondeSacarClave: 'https://console.groq.com/keys',
  },
  {
    id: 'openrouter',
    nombre: 'OpenRouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    variableClave: 'OPENROUTER_API_KEY',
    variableModelo: 'OPENROUTER_MODELO',
    variableUrl: 'OPENROUTER_API_URL',
    // OpenRouter enruta a decenas de modelos; los del sufijo :free no cobran.
    // Va último porque su cupo gratuito es el más volátil de los tres.
    modeloPorDefecto: 'meta-llama/llama-3.3-70b-instruct:free',
    dondeSacarClave: 'https://openrouter.ai/keys',
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
