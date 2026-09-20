'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { autenticar, cerrarSesionAdmin, iniciarSesionAdmin } from '@/lib/auth/admin';
import { verificarLimite, registrarIntento, ipDesdeHeaders } from '@/lib/db/rateLimit';

export type EstadoSesion =
  | { estado: 'inicial' }
  | { estado: 'error'; mensaje: string };

export async function iniciarSesion(
  _anterior: EstadoSesion,
  formData: FormData,
): Promise<EstadoSesion> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { estado: 'error', mensaje: 'Completa los dos campos.' };
  }

  // El login es el único endpoint del sitio donde adivinar tiene premio, y los
  // moderadores usan correos institucionales que cualquiera deduce. Sin esto,
  // un diccionario corre sin techo: scrypt hace lento CADA intento, pero nada
  // impide hacer un millón.
  const ip = ipDesdeHeaders(await headers());
  const limite = await verificarLimite(ip, 'login');
  if (!limite.permitido) {
    return {
      estado: 'error',
      mensaje: `Demasiados intentos. Prueba de nuevo en ${limite.minutosRestantes} minuto${limite.minutosRestantes === 1 ? '' : 's'}.`,
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

  await iniciarSesionAdmin(email);

  redirect('/admin/aliados');
}

export async function cerrarSesion(): Promise<void> {
  await cerrarSesionAdmin();
  redirect('/admin/login');
}
