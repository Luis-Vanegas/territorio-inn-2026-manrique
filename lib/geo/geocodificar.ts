import 'server-only';

/**
 * Geocoding con Nominatim (OpenStreetMap) — gratis, sin API key, mismo
 * espíritu que las teselas de Esri en constantes.ts. No hay otro proveedor
 * de mapas en el proyecto; no vale sumar una cuenta y una credencial nueva
 * para convertir una dirección en un punto.
 *
 * La política de uso de Nominatim exige un User-Agent que identifique la
 * app y un máximo de 1 request/segundo — por eso sale de acá (server-only)
 * y no del navegador: un fetch del cliente no puede fijar su propio
 * User-Agent.
 *
 * ponytail: el `ultimaConsulta` es un lock en memoria de una sola instancia
 * — en Vercel cada invocación puede caer en una instancia distinta y no se
 * comparte entre ellas. Con el volumen bajo de un registro de barrio no es
 * un problema real; si el tráfico creciera, esto necesita un lock
 * compartido (Postgres o Redis), no antes.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const ESPERA_MINIMA_MS = 1000;

let ultimaConsulta = 0;

export type ResultadoGeocoding = { lat: number; lng: number };

export async function geocodificarDireccion(
  direccion: string,
): Promise<ResultadoGeocoding | null> {
  const espera = ESPERA_MINIMA_MS - (Date.now() - ultimaConsulta);
  if (espera > 0) await new Promise((resolve) => setTimeout(resolve, espera));
  ultimaConsulta = Date.now();

  const url = new URL(NOMINATIM_URL);
  // Se ancla a Medellín/Colombia a propósito: una dirección corta como
  // "Calle 45 #30-12" existe en decenas de ciudades, y sin esto Nominatim
  // puede devolver un punto en otro país.
  url.searchParams.set('q', `${direccion}, Medellín, Colombia`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      headers: {
        'User-Agent': 'ComunaTresAliados/1.0 (territorio-inn, registro de negocios de Manrique)',
      },
    });
  } catch {
    return null;
  }

  if (!respuesta.ok) return null;

  const resultados = (await respuesta.json()) as { lat: string; lon: string }[];
  const primero = resultados[0];
  if (!primero) return null;

  const lat = Number(primero.lat);
  const lng = Number(primero.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}
