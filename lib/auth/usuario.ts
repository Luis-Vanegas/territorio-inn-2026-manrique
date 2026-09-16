import 'server-only';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';

/**
 * Sesión de un vecino registrado (no del administrador).
 *
 * ── Por qué una cookie aparte de `admin_session` ──
 *
 * Son dos poblaciones con dos niveles de permiso. Reusar la misma cookie
 * obligaría a poner un campo "rol" adentro, y ese campo sería lo único entre
 * un vecino y el panel de moderación. Cookies separadas: aunque alguien
 * falsifique una, no existe un camino donde eso lo convierta en moderador.
 *
 * ── Por qué el mismo mecanismo que admin.ts y no una librería ──
 *
 * Payload en base64url + HMAC-SHA256, comparado en tiempo constante. Es el
 * patrón que el proyecto ya usa y que ya fue revisado. Una librería de sesiones
 * acá agregaría una dependencia para reemplazar veinte líneas que funcionan.
 *
 * Duración larga a propósito: 30 días contra las 8 horas del admin. Un
 * moderador entra a trabajar y se va; un vecino entra cada varias semanas a
 * mirar su negocio, y hacerlo volver a autenticarse cada vez es la fricción
 * que hace que no vuelva. El daño posible también es distinto: una sesión de
 * vecino solo alcanza su propia ficha.
 */

/**
 * 14 días, no 30.
 *
 * El número sale de un balance, no de una costumbre: no hay lista de sesiones
 * activas, así que una cookie robada vale hasta que expire. Cuanto más larga,
 * más grande la ventana. Catorce días dejan volver sin re-autenticarse a quien
 * entra cada par de semanas —que es el uso real— y acotan el daño a la mitad.
 *
 * El daño posible igual está limitado por diseño: una sesión de vecino solo
 * alcanza su propia ficha, nunca el panel de moderación, que usa otra cookie.
 */
const DURACION_SESION = 14 * 24 * 60 * 60 * 1000;

/**
 * El prefijo `__Host-` hace que el navegador solo acepte la cookie por HTTPS,
 * con `path=/` y sin atributo `domain`. Un subdominio comprometido no puede
 * escribirla ni sobreescribirla. En local no hay HTTPS, así que el prefijo
 * solo se usa en producción, que es donde hay algo que proteger.
 */
const COOKIE = process.env.NODE_ENV === 'production' ? '__Host-sesion_usuario' : 'sesion_usuario';

function obtenerSecreto(): string {
  const secreto = process.env.ADMIN_SESSION_SECRET;
  if (!secreto) throw new Error('Falta ADMIN_SESSION_SECRET');
  return secreto;
}

export interface SesionUsuario {
  id: string;
  nombre: string;
  /** URL del avatar de Google. Puede faltar si la persona no tiene foto. */
  foto: string | null;
}

/**
 * En el token va lo mínimo para pintar el encabezado sin ir a la base en cada
 * carga: identificador, nombre y avatar.
 *
 * ── Por qué la foto sí y el correo no ──
 *
 * El encabezado pinta el avatar y el nombre en CADA página del sitio. Leerlos
 * de la base sería una consulta por request, para todos, y siempre la misma.
 * El correo, en cambio, no se muestra en ningún lado: se lee de la base donde
 * haga falta. Una cookie viaja en cada pedido y queda en el disco de la
 * persona — no es lugar para datos que no se usan.
 */
export function crearToken(usuario: SesionUsuario): string {
  const payload = JSON.stringify({
    id: usuario.id,
    nombre: usuario.nombre,
    foto: usuario.foto,
    exp: Date.now() + DURACION_SESION,
  });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const firma = crypto.createHmac('sha256', obtenerSecreto()).update(payloadB64).digest('hex');
  return `${payloadB64}.${firma}`;
}

export async function iniciarSesion(usuario: SesionUsuario): Promise<void> {
  (await cookies()).set(COOKIE, crearToken(usuario), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // 'lax' y no 'strict': con 'strict' la cookie no viaja cuando la persona
    // vuelve desde Google, y quedaría recién autenticada y deslogueada a la vez.
    sameSite: 'lax',
    path: '/',
    maxAge: DURACION_SESION / 1000,
  });
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/**
 * Quién está conectado, o null. Verifica la firma antes de confiar en el
 * contenido: sin eso, cualquiera edita el base64 y se pone el identificador
 * que quiera.
 */
export async function sesionActual(): Promise<SesionUsuario | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const [payloadB64, firma] = token.split('.');
  if (!payloadB64 || !firma) return null;

  // Se firma el base64url y no el JSON crudo: así la verificación no depende
  // de que el decode reproduzca byte a byte lo que se firmó.
  const esperada = crypto.createHmac('sha256', obtenerSecreto()).update(payloadB64).digest('hex');
  // timingSafeEqual tira RangeError si los largos difieren — se comparan antes.
  if (firma.length !== esperada.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) return null;

  try {
    const datos = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as {
      id?: unknown;
      nombre?: unknown;
      foto?: unknown;
      exp?: unknown;
    };

    if (typeof datos.exp !== 'number' || datos.exp < Date.now()) return null;
    // Se comprueban los tipos aunque la firma ya haya validado: el token lo
    // emitimos nosotros, pero una versión vieja del formato con la misma clave
    // sigue verificando bien y traería otros campos. `foto` es justo ese caso:
    // las sesiones emitidas antes de agregarla no la traen, y tienen que
    // seguir siendo válidas en vez de echar a todo el mundo.
    if (typeof datos.id !== 'string' || typeof datos.nombre !== 'string') return null;

    return {
      id: datos.id,
      nombre: datos.nombre,
      foto: typeof datos.foto === 'string' ? datos.foto : null,
    };
  } catch {
    return null;
  }
}
