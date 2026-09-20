'use server';

import { redirect } from 'next/navigation';

import { cerrarSesionAdmin } from '@/lib/auth/admin';
import { cerrarSesion } from '@/lib/auth/usuario';

/**
 * Cierra la sesión del vecino y lo devuelve al inicio.
 *
 * Server Action y no un route handler con GET: un GET que desloguea se puede
 * disparar desde una imagen en cualquier página (`<img src=".../salir">`) y
 * dejar a la persona afuera sin que haya tocado nada. Una action va por POST y
 * Next le pone su propia protección.
 */
export async function salir(): Promise<void> {
  await cerrarSesion();
  // Quien entró como moderador por Google tiene las dos cookies: «Cerrar
  // sesión» tiene que cerrar las dos, no dejar el panel abierto 8 horas más.
  await cerrarSesionAdmin();
  redirect('/');
}
