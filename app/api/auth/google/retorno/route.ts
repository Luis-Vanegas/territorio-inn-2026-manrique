import { timingSafeEqual } from 'node:crypto';

import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  perfilDesdeCodigo,
  COOKIE_DESTINO,
  COOKIE_ESTADO,
  COOKIE_INVITACION,
  COOKIE_VERIFICADOR,
  COOKIE_VINCULAR,
} from '@/lib/auth/google';
import { ingresarConGoogle, vincularNegocio } from '@/lib/db/usuarios.repo';
import { consumirInvitacion } from '@/lib/db/invitaciones.repo';
import { accesoModeradorGoogle, iniciarSesionAdmin } from '@/lib/auth/admin';
import { opcionesBorrado } from '@/lib/auth/cookies';
import { puertaDe, rutaInterna } from '@/lib/auth/destino';
import { tokenInvitacionValido } from '@/lib/auth/invitacion';
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

function alError(request: Request, motivo: string, puerta = '/entrar') {
  return NextResponse.redirect(new URL(`${puerta}?error=${motivo}`, request.url));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const codigo = url.searchParams.get('code');
  const estadoRecibido = url.searchParams.get('state');

  const galletas = await cookies();

  // Adónde iba. Se revalida acá aunque ya se validó al guardarla: la cookie
  // es del navegador y llega como entrada, no como algo propio.
  const destino = rutaInterna(galletas.get(COOKIE_DESTINO)?.value);
  const puerta = puertaDe(destino);
  galletas.set(COOKIE_DESTINO, '', opcionesBorrado());

  // Negocio a vincular e invitación (ver lib/auth/google.ts): de un solo uso y
  // revalidados igual que el destino, porque la cookie llega como entrada.
  const vincularCrudo = galletas.get(COOKIE_VINCULAR)?.value;
  const vincular = vincularCrudo && FORMATO_UUID.test(vincularCrudo) ? vincularCrudo : null;
  const invitacion = tokenInvitacionValido(galletas.get(COOKIE_INVITACION)?.value);
  galletas.set(COOKIE_VINCULAR, '', opcionesBorrado());
  galletas.set(COOKIE_INVITACION, '', opcionesBorrado());

  // La persona apretó "cancelar" en la pantalla de Google. No es un error que
  // valga la pena reportarle: se la devuelve a su puerta como si nada.
  if (url.searchParams.get('error')) {
    return NextResponse.redirect(new URL(puerta, request.url));
  }

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
    return alError(request, 'estado', puerta);
  }

  // Comparación en tiempo constante: un `!==` corta en el primer byte que
  // difiere, y ese tiempo, medido muchas veces, filtra el valor esperado.
  // Los largos se comparan antes porque timingSafeEqual tira si difieren.
  const recibido = Buffer.from(estadoRecibido);
  const guardado = Buffer.from(estadoGuardado);
  if (recibido.length !== guardado.length || !timingSafeEqual(recibido, guardado)) {
    return alError(request, 'estado', puerta);
  }

  const cabeceras = await headers();

  // El intercambio con Google y el insert cuestan; el cupo de `login` frena a
  // quien martille este endpoint con códigos inventados.
  const ip = ipDesdeHeaders(cabeceras);
  const limite = await verificarLimite(ip, 'login');
  if (!limite.permitido) return alError(request, 'limite', puerta);
  await registrarIntento(ip, 'login');

  const host = cabeceras.get('x-forwarded-host') ?? cabeceras.get('host');
  const protocolo = cabeceras.get('x-forwarded-proto') ?? 'http';
  const origen = `${protocolo}://${host}`;

  const perfil = await perfilDesdeCodigo(codigo, origen, verificador);
  if (!perfil) return alError(request, 'google', puerta);

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
      return alError(request, 'correo_tomado', puerta);
    }

    const usuario = ingreso.usuario;
    await iniciarSesion({
      id: usuario.id,
      nombre: usuario.nombre,
      foto: usuario.foto_url,
    });

    const cuenta = { sub: perfil.sub, correo: perfil.correo, nombre: usuario.nombre };

    // Invitación (migración 035): se consume ahora, ya con la cuenta creada, en
    // una sola sentencia. Su resultado manda el destino: a eso vino la persona.
    let destinoFinal = destino ?? '/firmamento/negocio';
    if (invitacion) {
      const limiteInv = await verificarLimite(ip, 'invitacion');
      const consumo = limiteInv.permitido
        ? await consumirInvitacion(invitacion, { usuarioId: usuario.id, ...cuenta })
        : null;
      if (!consumo) {
        // Solo los fallidos gastan cupo, como el login con contraseña.
        if (limiteInv.permitido) await registrarIntento(ip, 'invitacion');
        destinoFinal = '/firmamento/entrar?error=invitacion';
      } else {
        destinoFinal = consumo.tipo === 'moderador' ? '/firmamento/equipo' : '/firmamento/entidad';
      }
    }

    // Moderador por Google: además de la sesión de vecino, se emite la cookie
    // de moderación — otra cookie, no un permiso dentro de esta. Lo decide
    // `admins.google_sub` (invitación) o ADMIN_GOOGLE_SUBS (respaldo); ver
    // `accesoModeradorGoogle` en lib/auth/admin.ts. Va DESPUÉS de la invitación:
    // la de moderador es la que crea la fila que esto lee.
    const emailModerador = await accesoModeradorGoogle(cuenta);
    if (emailModerador) await iniciarSesionAdmin(emailModerador);

    // Quien venía de su enlace de negocio (/aliados/estado/<token>) y entra con
    // Google queda con ese negocio vinculado a su cuenta: es el puente entre las
    // dos puertas. `vincularNegocio` ignora los que ya tienen dueño.
    if (vincular) await vincularNegocio(vincular, usuario.id);

    return NextResponse.redirect(new URL(destinoFinal, request.url));
  } catch (error) {
    console.error('[google] fallo al crear la sesión:', error);
    return alError(request, 'sesion', puerta);
  }
}
