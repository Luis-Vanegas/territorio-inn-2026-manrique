'use server';

import { headers } from 'next/headers';
import { geocodificarDireccion as geocodificar } from '@/lib/geo/geocodificar';
import { verificarLimite, registrarIntento, ipDesdeHeaders } from '@/lib/db/rateLimit';

export type ResultadoGeocodingAccion =
  | { ok: true; lat: number; lng: number }
  | { ok: false; mensaje: string };

/**
 * Llamada directo desde el cliente (no es la action de un <form>): el botón
 * "Ubicar en el mapa" la invoca a mano con la dirección que la persona ya
 * escribió, sin enviar el formulario entero.
 */
export async function geocodificarDireccionAction(
  direccion: string,
): Promise<ResultadoGeocodingAccion> {
  const ip = ipDesdeHeaders(await headers());

  const limite = await verificarLimite(ip, 'geocodificar');
  if (!limite.permitido) {
    return { ok: false, mensaje: 'Muchos intentos — espera un momento y prueba de nuevo.' };
  }
  await registrarIntento(ip, 'geocodificar');

  const texto = direccion.trim();
  if (texto.length < 5) {
    return { ok: false, mensaje: 'Escribe la dirección completa primero.' };
  }

  const resultado = await geocodificar(texto);
  if (!resultado) {
    return {
      ok: false,
      mensaje: 'No pudimos ubicar esa dirección. Marca el punto a mano en el mapa.',
    };
  }

  return { ok: true, ...resultado };
}
