'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { autenticar, crearTokenSesion } from '@/lib/auth/admin';
import { verificarLimite, registrarIntento, ipDesdeHeaders } from '@/lib/db/rateLimit';

export type EstadoSesion =
  | { estado: 'inicial' }
  | { estado: 'error'; mensaje: string };

const DURACION_SEGUNDOS = 8 * 60 * 60;

export async function iniciarSesion(
  _anterior: EstadoSesion,
  formData: FormData,
): Promise<EstadoSesion> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { estado: 'error', mensaje: 'Completá los dos campos.' };
  }

  // El login es el único endpoint del sitio donde adivinar tiene premio, y los
  // moderadores usan correos institucionales que cualquiera deduce. Sin esto,
  // un diccionario corre sin techo: scrypt hace lento CADA intento, pero nada
  // impide hacer un millón.
  const ip = ipDesdeHeaders(headers());
  const limite = await verificarLimite(ip, 'login');
  if (!limite.permitido) {
    return {
      estado: 'error',
      mensaje: `Demasiados intentos. Probá de nuevo en ${limite.minutosRestantes} minuto${limite.minutosRestantes === 1 ? '' : 's'}.`,
    };
  }

  const ok = await autenticar(email, password);

  // Solo cuentan los intentos fallidos: un moderador que entra bien no gasta
  // cupo, así que trabajar normalmente nunca lo acerca al bloqueo.
  if (!ok) await registrarIntento(ip, 'login');

  // Mensaje único para email inexistente y password incorrecto: distinguirlos
  // convierte el formulario en un verificador de qué correos son moderadores.
  if (!ok) {
    return { estado: 'error', mensaje: 'Credenciales incorrectas.' };
  }

  cookies().set('admin_session', crearTokenSesion(email.toLowerCase()), {
    httpOnly: true,                                   // fuera del alcance de JS
    secure: process.env.NODE_ENV === 'production',    // en local no hay HTTPS
    sameSite: 'lax',                                  // corta CSRF desde otros sitios
    path: '/',
    maxAge: DURACION_SEGUNDOS,
  });

  redirect('/admin/aliados');
}

export async function cerrarSesion(): Promise<void> {
  cookies().delete('admin_session');
  redirect('/admin/login');
}
