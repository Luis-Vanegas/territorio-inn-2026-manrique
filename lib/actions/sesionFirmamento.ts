'use server';

import { redirect } from 'next/navigation';

import { cerrarSesionAdmin } from '@/lib/auth/admin';
import { cerrarSesion } from '@/lib/auth/usuario';

/**
 * «Salir» del menú de usuario de Firmamento: cierra la sesión del rol y vuelve a
 * la puerta de Firmamento. Server Action y no un GET, por la misma razón que
 * `salir` de sesionUsuario.ts (un GET que desloguea se dispara desde una imagen).
 *
 * El equipo cierra solo la cookie de moderación; negocio y entidad cierran la de
 * vecino. Quien entró como moderador por Google tiene las dos y, si quiere
 * cerrar ambas, usa «Cerrar sesión» del sitio (`salir`).
 */
export async function salirDeFirmamento(formData: FormData): Promise<void> {
  if (formData.get('rol') === 'equipo') await cerrarSesionAdmin();
  else await cerrarSesion();

  redirect('/firmamento/entrar');
}
