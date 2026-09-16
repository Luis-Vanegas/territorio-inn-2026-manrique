import 'server-only';
import crypto from 'node:crypto';

/**
 * Ingreso con Google (OAuth 2.0, flujo de authorization code).
 *
 * ── Por qué a mano y sin NextAuth ──
 *
 * Lo único que falta en este proyecto es el intercambio con Google: la sesión
 * firmada, la cookie, la expiración y la comparación en tiempo constante ya
 * están escritas y probadas en `lib/auth/admin.ts`. NextAuth traería su propio
 * modelo de sesión, su propio adaptador de base y su propia configuración para
 * duplicar eso — y dejaría el proyecto con dos sistemas de sesión conviviendo.
 *
 * Lo que sí es de acá abajo son ~60 líneas de fetch a tres endpoints que Google
 * tiene documentados y estables.
 *
 * ── Por qué Google y no correo con contraseña ──
 *
 * No hay servicio de correo en el proyecto, y sin correo saliente un registro
 * con contraseña nace roto: no se puede verificar que el correo sea de esa
 * persona, y cuando olvide la contraseña no hay forma de recuperarla. Con
 * Google no hay contraseña que guardar ni correo que enviar: si la olvida, la
 * recupera con Google. El problema deja de ser nuestro, y es gratis.
 *
 * Endpoints verificados el 2026-09-15 contra el documento de descubrimiento
 * oficial (https://accounts.google.com/.well-known/openid-configuration).
 */

const AUTORIZACION = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN = 'https://oauth2.googleapis.com/token';
const USUARIO = 'https://openidconnect.googleapis.com/v1/userinfo';

/** Lo mínimo para saber quién es: identificador, correo, nombre y foto. */
const SCOPES = 'openid email profile';

/**
 * Cookies de un solo uso mientras la persona está en Google.
 *
 * El prefijo `__Host-` no es decorativo: el navegador solo acepta una cookie
 * así si viene por HTTPS, con `path=/` y SIN atributo `domain`. Eso significa
 * que un subdominio comprometido NO puede escribirla — y escribir el `state`
 * o el verificador de otro es justamente por donde se ataca este flujo.
 *
 * En local no hay HTTPS y el navegador rechazaría el prefijo, así que se usa
 * solo en producción. La protección aplica donde hay algo que proteger.
 */
const CON_PREFIJO = process.env.NODE_ENV === 'production';
export const COOKIE_ESTADO = CON_PREFIJO ? '__Host-oauth_estado' : 'oauth_estado';
export const COOKIE_VERIFICADOR = CON_PREFIJO ? '__Host-oauth_verif' : 'oauth_verif';

export interface PerfilGoogle {
  /** Identificador estable de Google. La llave real — el correo puede cambiar. */
  sub: string;
  correo: string;
  nombre: string;
  foto: string | null;
}

/**
 * Diferida, no leída al importar: `next build` importa cada ruta para
 * inspeccionarla sin atender un request, y leer variables ahí rompe el build.
 * Mismo razonamiento que lib/db/neon.ts y lib/auth/admin.ts.
 */
function credenciales(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/** ¿Está configurado el ingreso con Google? La UI no ofrece lo que no funciona. */
export function googleConfigurado(): boolean {
  return credenciales() !== null;
}

/**
 * La URI de retorno tiene que coincidir EXACTAMENTE con la registrada en la
 * consola de Google, carácter por carácter — un `www` de más o una barra final
 * y Google rechaza con redirect_uri_mismatch.
 *
 * Se arma desde el origen real del request y no desde una variable fija porque
 * el sitio corre en tres lugares (local, preproducción de Vercel, producción) y
 * cada uno tiene su origen. Los tres se registran en la consola de Google.
 */
export function uriRetorno(origen: string): string {
  return `${origen}/api/auth/google/retorno`;
}

/**
 * `state` contra CSRF: se genera al azar, viaja a Google y vuelve. Si el que
 * vuelve no coincide con el de la cookie, el callback lo disparó otro sitio y
 * no la persona — se descarta.
 */
export function generarEstado(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * PKCE (RFC 7636): protege el código de autorización.
 *
 * ── Qué ataque corta, en concreto ──
 *
 * El código vuelve de Google dentro de la URL del navegador. Esa URL pasa por
 * el historial, por los logs de cualquier proxy en el medio, y por la
 * cabecera Referer. Sin PKCE, quien consiga ese código —y el identificador de
 * cliente, que es público— puede cambiarlo por una sesión que no es suya.
 *
 * Con PKCE, el código solo sirve acompañado de un verificador secreto que
 * nunca sale de nuestro servidor. Interceptar el código deja de alcanzar.
 *
 * Google lo documenta como obligatorio para apps nativas y recomendado para
 * las de servidor. Acá suma sobre el `client_secret`: son dos secretos
 * distintos, y el verificador cambia en cada intento.
 *
 * 32 bytes en base64url dan 43 caracteres, justo el mínimo que exige el RFC.
 */
export function generarVerificador(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/** El desafío es el SHA-256 del verificador, en base64url sin relleno. */
function desafioDesde(verificador: string): string {
  return crypto.createHash('sha256').update(verificador).digest('base64url');
}

export function urlDeIngreso(
  origen: string,
  estado: string,
  verificador: string,
): string | null {
  const cred = credenciales();
  if (!cred) return null;

  const parametros = new URLSearchParams({
    client_id: cred.clientId,
    redirect_uri: uriRetorno(origen),
    response_type: 'code',
    scope: SCOPES,
    state: estado,
    // Viaja el hash, nunca el verificador: lo que llega a Google por la URL no
    // sirve para nada sin el original, que se queda de este lado.
    code_challenge: desafioDesde(verificador),
    code_challenge_method: 'S256',
    // Sin refresh token: la sesión se renueva volviendo a entrar, y un refresh
    // token es una credencial de larga vida que habría que guardar y rotar
    // para no usarla nunca. No se pide lo que no se va a usar.
    access_type: 'online',
    // Que la persona elija la cuenta en vez de entrar con la primera que Google
    // tenga abierta. En un barrio donde se comparte el celular, eso importa.
    prompt: 'select_account',
  });

  return `${AUTORIZACION}?${parametros}`;
}

/**
 * Cambia el código por el perfil. Devuelve null ante cualquier fallo: el
 * detalle va al log del servidor, nunca a la pantalla — los errores de OAuth
 * traen identificadores de cliente y descripciones internas.
 */
export async function perfilDesdeCodigo(
  codigo: string,
  origen: string,
  verificador: string,
): Promise<PerfilGoogle | null> {
  const cred = credenciales();
  if (!cred) return null;

  try {
    const respuestaToken = await fetch(TOKEN, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cred.clientId,
        client_secret: cred.clientSecret,
        code: codigo,
        grant_type: 'authorization_code',
        redirect_uri: uriRetorno(origen),
        // La otra mitad de PKCE. Google recalcula el SHA-256 y lo compara con
        // el desafío que recibió al empezar: si no coinciden, rechaza el
        // intercambio aunque el código sea válido.
        code_verifier: verificador,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!respuestaToken.ok) {
      const detalle = await respuestaToken.text().catch(() => '');
      console.error(`[google] token ${respuestaToken.status}:`, detalle.slice(0, 300));
      return null;
    }

    const { access_token } = (await respuestaToken.json()) as { access_token?: string };
    if (!access_token) {
      console.error('[google] la respuesta del token no traía access_token');
      return null;
    }

    // Se pide el perfil al endpoint en vez de decodificar el id_token. Son dos
    // líneas más y una llamada extra, pero evita tener que justificar por qué
    // un JWT se lee sin verificar la firma — acá sería seguro, y aun así es
    // la clase de atajo que en una revisión cuesta más explicar que cambiar.
    const respuestaPerfil = await fetch(USUARIO, {
      headers: { authorization: `Bearer ${access_token}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!respuestaPerfil.ok) {
      console.error(`[google] userinfo ${respuestaPerfil.status}`);
      return null;
    }

    const datos = (await respuestaPerfil.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };

    if (!datos.sub || !datos.email) {
      console.error('[google] userinfo sin sub o sin email');
      return null;
    }

    // Un correo sin verificar no identifica a nadie: cualquiera puede poner el
    // de otro al crear una cuenta. Google marca cuáles confirmó de verdad.
    if (datos.email_verified === false) {
      console.error('[google] correo sin verificar, se rechaza el ingreso');
      return null;
    }

    return {
      sub: datos.sub,
      correo: datos.email.toLowerCase().trim(),
      // Google no siempre manda `name` según los permisos que dé la persona.
      // La parte del correo antes de la arroba es un nombre razonable de
      // reserva, y la persona lo puede corregir después.
      nombre: datos.name?.trim() || datos.email.split('@')[0] || 'Vecino',
      foto: datos.picture ?? null,
    };
  } catch (error) {
    console.error('[google] fallo el intercambio:', error);
    return null;
  }
}
