import 'server-only';
import { put, del } from '@vercel/blob';
import sharp from 'sharp';
import { TIPOS_FOTO_PERMITIDOS, TAMANO_MAX_FOTO } from '@/lib/validation/portafolio.schema';

/**
 * Fotos de los portafolios en Vercel Blob.
 *
 * Migrabilidad: el resto del código solo conoce subirFoto/borrarFoto y una URL.
 * Para mover el storage a S3, R2 o Supabase Storage se reescribe este archivo
 * — la base guarda `foto_url` y `foto_blob_pathname` como texto plano, sin
 * atarse al proveedor.
 *
 * sharp necesita el runtime Node: cualquier ruta que llame acá no puede ser Edge.
 */

/** ~1200px es el ancho máximo que la vitrina llega a mostrar. Guardar más es pagar por píxeles que nadie ve. */
const LADO_MAX = 1200;
const CALIDAD_WEBP = 80;

export type ResultadoFoto = { url: string; pathname: string };

/**
 * Vercel conecta un store de Blob de dos formas posibles:
 *   - la vieja: copia un `BLOB_READ_WRITE_TOKEN` estático a las env vars.
 *   - la nueva (la que usa este proyecto): autenticación por OIDC, donde
 *     alcanza con `BLOB_STORE_ID` — el SDK toma el token de sesión de Vercel
 *     automáticamente en runtime, sin ningún secreto largo que copiar a mano.
 * Mirar solo la variable vieja hacía que esto reportara "no configurado"
 * incluso con el store ya conectado y funcionando.
 */
export function blobConfigurado(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export type ErrorFoto = 'tipo-no-permitido' | 'muy-grande' | 'corrupta';

export function validarArchivo(file: File): ErrorFoto | null {
  if (!TIPOS_FOTO_PERMITIDOS.includes(file.type as (typeof TIPOS_FOTO_PERMITIDOS)[number])) {
    return 'tipo-no-permitido';
  }
  if (file.size > TAMANO_MAX_FOTO) return 'muy-grande';
  return null;
}

/**
 * Optimiza con sharp y sube al pathname dado. Devuelve null si el archivo no
 * es una imagen procesable.
 *
 * El `file.type` viene del navegador y se puede falsificar: un .exe renombrado
 * a .jpg pasa la validación de tipo. sharp falla al decodificarlo, y ese fallo
 * es la verificación real de que el contenido es una imagen.
 *
 * Privada: `subirFoto` y `subirMenu` son los dos únicos pathnames válidos
 * hoy, y cada uno decide el suyo — no conviene que cualquier caller pase un
 * pathname arbitrario acá.
 */
async function optimizarYSubir(file: File, pathname: string): Promise<ResultadoFoto | null> {
  const buffer = Buffer.from(await file.arrayBuffer());

  let optimizada: Buffer;
  try {
    optimizada = await sharp(buffer)
      .rotate() // respeta la orientación EXIF; sin esto las fotos de celular salen acostadas
      .resize(LADO_MAX, LADO_MAX, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: CALIDAD_WEBP })
      .toBuffer();
  } catch {
    return null;
  }

  // ── Sin sufijo aleatorio, y hay que saber por qué ──
  //
  // Un pathname derivado del id significa que cualquiera que vea la ficha
  // puede armar la URL del blob. Acá está bien: tanto la foto como el
  // menú/flyer de un negocio de Aliados son públicos, se muestran en la
  // vitrina, y esa es toda su razón de existir.
  //
  // El módulo Servicios pasaba `addRandomSuffix: true` justamente porque ahí
  // la foto era reservada y el sufijo cortaba la derivación. Ese módulo se
  // eliminó (migración 028). **Si algún día se agrega otro archivo que NO
  // deba ser público, no lo subas por acá sin reponer el sufijo**: la
  // privacidad de un archivo en Blob depende de que su URL no se pueda adivinar.
  const blob = await put(pathname, optimizada, {
    access: 'public',
    contentType: 'image/webp',
    addRandomSuffix: false,
    // Público e inmutable por id: se cachea fuerte.
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });

  return { url: blob.url, pathname: blob.pathname };
}

/** El id es un uuid generado por la base, así que el pathname es único sin sufijo aleatorio — y predecible permite sobrescribir al reemplazar la foto. */
export async function subirFoto(
  file: File,
  portafolioId: string,
): Promise<ResultadoFoto | null> {
  return optimizarYSubir(file, `portafolios/${portafolioId}.webp`);
}

/** Mismo tratamiento que la foto (resize + WebP): un menú fotografiado con el celular pesa igual de mal. */
export async function subirMenu(
  file: File,
  portafolioId: string,
): Promise<ResultadoFoto | null> {
  return optimizarYSubir(file, `portafolios/${portafolioId}-menu.webp`);
}

export async function borrarFoto(pathname: string): Promise<void> {
  await del(pathname);
}
