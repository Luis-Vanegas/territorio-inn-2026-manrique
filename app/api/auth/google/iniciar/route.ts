import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  urlDeIngreso,
  generarEstado,
  generarVerificador,
  googleConfigurado,
  COOKIE_DESTINO,
  COOKIE_ESTADO,
  COOKIE_INVITACION,
  COOKIE_VERIFICADOR,
  COOKIE_VINCULAR,
} from '@/lib/auth/google';
import { opcionesBorrado, opcionesCookie } from '@/lib/auth/cookies';
import { puertaDe, rutaInterna } from '@/lib/auth/destino';
import { tokenInvitacionValido } from '@/lib/auth/invitacion';

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Arranca el ingreso con Google: genera el `state`, lo guarda en una cookie de
 * un solo uso, y manda a la persona a Google.
 *
 * Es un route handler y no una Server Action porque el navegador tiene que
 * seguir un redirect a otro dominio — una action devuelve datos a la página que
 * la llamó, no saca al usuario del sitio.
 */

// El `state` es distinto en cada visita: nada que cachear, y una respuesta
// cacheada acá le daría a dos personas el mismo state.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // `?destino=/firmamento/negocio`: adónde volver. Solo rutas internas; lo demás
  // se descarta (open redirect) y se vuelve al panel del negocio (/firmamento/negocio).
  const destino = rutaInterna(new URL(request.url).searchParams.get('destino'));
  const puerta = puertaDe(destino);

  if (!googleConfigurado()) {
    return NextResponse.redirect(new URL(`${puerta}?error=sin_google`, request.url));
  }

  // El origen sale del request y no de una variable: el sitio corre en local,
  // en preproducción y en producción, y la URI de retorno tiene que coincidir
  // exactamente con la que Google recibió al empezar.
  const cabeceras = await headers();
  const host = cabeceras.get('x-forwarded-host') ?? cabeceras.get('host');
  const protocolo = cabeceras.get('x-forwarded-proto') ?? 'http';
  const origen = `${protocolo}://${host}`;

  const estado = generarEstado();
  const verificador = generarVerificador();
  const url = urlDeIngreso(origen, estado, verificador);

  if (!url) {
    return NextResponse.redirect(new URL(`${puerta}?error=sin_google`, request.url));
  }

  const galletas = await cookies();

  const opciones = {
    ...opcionesCookie(),
    // Diez minutos: lo que tarda alguien en elegir cuenta y autorizar. Más
    // tiempo solo alarga la ventana en que estos valores sirven para algo.
    maxAge: 600,
  };

  galletas.set(COOKIE_ESTADO, estado, opciones);

  // El verificador de PKCE vive en una cookie httpOnly: nunca lo ve el
  // JavaScript de la página ni viaja en ninguna URL. Es lo que hace que un
  // código de autorización robado no sirva para nada.
  galletas.set(COOKIE_VERIFICADOR, verificador, opciones);

  // Sin destino se borra la cookie: un intento abandonado antes no puede
  // mandar a esta persona a una puerta que no pidió.
  if (destino) galletas.set(COOKIE_DESTINO, destino, opciones);
  else galletas.set(COOKIE_DESTINO, '', opcionesBorrado());

  // Lo mismo con el negocio a vincular y la invitación: solo con forma válida, y
  // si no vienen se borran. Lo peor que logra un enlace armado por otro es
  // regalarle a quien entra un negocio o una invitación ajenos, nunca quitarle nada.
  const params = new URL(request.url).searchParams;
  const vincular = params.get('vincular');
  if (vincular && FORMATO_UUID.test(vincular)) galletas.set(COOKIE_VINCULAR, vincular, opciones);
  else galletas.set(COOKIE_VINCULAR, '', opcionesBorrado());

  const invitacion = tokenInvitacionValido(params.get('invitacion'));
  if (invitacion) galletas.set(COOKIE_INVITACION, invitacion, opciones);
  else galletas.set(COOKIE_INVITACION, '', opcionesBorrado());

  return NextResponse.redirect(url);
}
