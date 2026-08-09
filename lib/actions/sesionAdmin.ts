'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { autenticar, crearTokenSesion } from '@/lib/auth/admin';

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

  const ok = await autenticar(email, password);

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

  redirect('/admin/portafolios');
}

export async function cerrarSesion(): Promise<void> {
  cookies().delete('admin_session');
  redirect('/admin/login');
}
