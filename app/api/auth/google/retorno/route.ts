import { timingSafeEqual } from 'node:crypto';

import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { perfilDesdeCodigo, COOKIE_ESTADO, COOKIE_VERIFICADOR } from '@/lib/auth/google';
import { ingresarConGoogle, vincularNegocio } from '@/lib/db/usuarios.repo';
import { iniciarSesionAdmin, registrarModeradorGoogle } from '@/lib/auth/admin';
import { opcionesBorrado } from '@/lib/auth/cookies';
import { esModeradorGoogle } from '@/lib/auth/moderadoresGoogle';
import { iniciarSesion } from '@/lib/auth/usuario';
import { verificarLimite, registrarIntento, ipDesdeHeaders } from '@/lib/db/rateLimit';

/**
 * Vuelta desde Google: valida el `state`, cambia el código por el perfil, crea
 * o actualiza la cuenta y abre la sesión.
 *
 * Todos los fallos redirigen a /entrar con un código corto en la URL.
 * Nunca se muestra el error real: los errores de OAuth traen identificadores
 * de cliente y descripciones internas que no le sirven a nadie en pantalla.
 */

export const dynamic = 'force-dynamic';

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function alError(request: Request, motivo: string) {
  return NextResponse.redirect(new URL(`/entrar?error=${motivo}`, request.url));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const codigo = url.searchParams.get('code');
  const estadoRecibido = url.searchParams.get('state');

  // La persona apretó "cancelar" en la pantalla de Google. No es un error que
  // valga la pena reportarle: se la devuelve a la página como si nada.
  if (url.searchParams.get('error')) {
    return NextResponse.redirect(new URL('/entrar', request.url));
  }

  const galletas = await cookies();
  const estadoGuardado = galletas.get(COOKIE_ESTADO)?.value;
  const verificador = galletas.get(COOKIE_VERIFICADOR)?.value;

  // De un solo uso: se borran apenas se leen, pase lo que pase después. Un
  // state o un verificador que sobreviven al intercambio se pueden reusar.
  //
  // Con `set(..., opcionesBorrado())` y no `delete()`: estas cookies son
  // `__Host-…` en producción y un borrado sin `Secure` lo rechaza el navegador,
  // que las dejaría vivas hasta que expiren (ver lib/auth/cookies.ts).
  galletas.set(COOKIE_ESTADO, '', opcionesBorrado());
  galletas.set(COOKIE_VERIFICADOR, '', opcionesBorrado());

  if (!codigo || !estadoRecibido || !estadoGuardado || !verificador) {
    return alError(request, 'estado');
  }

  // Comparación en tiempo constante: un `!==` corta en el primer byte que
  // difiere, y ese tiempo, medido muchas veces, filtra el valor esperado.
  // Los largos se comparan antes porque timingSafeEqual tira si difieren.
  const recibido = Buffer.from(estadoRecibido);
  const guardado = Buffer.from(estadoGuardado);
  if (recibido.length !== guardado.length || !timingSafeEqual(recibido, guardado)) {
    return alError(request, 'estado');
  }

  const cabeceras = await headers();

  // El intercambio con Google y el insert cuestan; el cupo de `login` frena a
  // quien martille este endpoint con códigos inventados.
  const ip = ipDesdeHeaders(cabeceras);
  const limite = await verificarLimite(ip, 'login');
  if (!limite.permitido) return alError(request, 'limite');
  await registrarIntento(ip, 'login');

  const host = cabeceras.get('x-forwarded-host') ?? cabeceras.get('host');
  const protocolo = cabeceras.get('x-forwarded-proto') ?? 'http';
  const origen = `${protocolo}://${host}`;

  const perfil = await perfilDesdeCodigo(codigo, origen, verificador);
  if (!perfil) return alError(request, 'google');

  try {
    const ingreso = await ingresarConGoogle({
      google_sub: perfil.sub,
      correo: perfil.correo,
      nombre: perfil.nombre,
      foto_url: perfil.foto,
    });

    // El correo pertenece a otra cuenta de Google. No se abre sesión: dejar
    // pasar acá sería entregarle los negocios de una persona a otra.
    if (ingreso.estado === 'correo_tomado') {
      return alError(request, 'correo_tomado');
    }

    const usuario = ingreso.usuario;
    await iniciarSesion({
      id: usuario.id,
      nombre: usuario.nombre,
      foto: usuario.foto_url,
    });

    // Moderador por Google: además de la sesión de vecino, se emite la cookie
    // de moderación — otra cookie, no un permiso dentro de esta. La lista de
    // `sub` permitidos vive en el entorno (ver lib/auth/moderadoresGoogle.ts).
    if (esModeradorGoogle(perfil.sub)) {
      await registrarModeradorGoogle(perfil.correo, usuario.nombre);
      await iniciarSesionAdmin(perfil.correo);
    }

    // Quien venía de su enlace de negocio y entra con Google queda con ese
    // negocio vinculado a su cuenta: es el puente entre las dos puertas, y
    // convierte un registro asistido en una cuenta propia sin volver a cargar
    // nada. `vincularNegocio` ignora los que ya tienen dueño.
    const token = url.searchParams.get('vincular');
    if (token && FORMATO_UUID.test(token)) {
      await vincularNegocio(token, usuario.id);
    }

    return NextResponse.redirect(new URL('/mi-cuenta', request.url));
  } catch (error) {
    console.error('[google] fallo al crear la sesión:', error);
    return alError(request, 'sesion');
  }
}
