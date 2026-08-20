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
 * Optimiza y sube. Devuelve null si el archivo no es una imagen procesable.
 *
 * El `file.type` viene del navegador y se puede falsificar: un .exe renombrado
 * a .jpg pasa la validación de tipo. sharp falla al decodificarlo, y ese fallo
 * es la verificación real de que el contenido es una imagen.
 */
export async function subirFoto(
  file: File,
  portafolioId: string,
  carpeta: 'portafolios' | 'servicios' = 'portafolios',
): Promise<ResultadoFoto | null> {
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

  // El id es un uuid generado por la base, así que el pathname es único sin
  // sufijo aleatorio. Predecible además permite sobrescribir al reemplazar la foto.
  const pathname = `${carpeta}/${portafolioId}.webp`;

  const blob = await put(pathname, optimizada, {
    access: 'public',
    contentType: 'image/webp',
    addRandomSuffix: false,
    // La foto es pública e inmutable por id: se cachea fuerte.
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });

  return { url: blob.url, pathname: blob.pathname };
}

export async function borrarFoto(pathname: string): Promise<void> {
  await del(pathname);
}
