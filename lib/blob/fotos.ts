import 'server-only';
import { put, del } from '@vercel/blob';
import sharp from 'sharp';
import { TIPOS_FOTO_PERMITIDOS, TAMANO_MAX_FOTO } from '@/lib/validation/portafolio.schema';
import { esFormatoPermitido } from '@/lib/blob/formatoImagen';

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

export type ArchivoValidado = { ok: true; archivo: File | null } | { ok: false; mensaje: string };

/**
 * Saca un archivo opcional del formulario y lo valida. `registrarPortafolio`
 * y `actualizarPortafolio` repetían este mismo bloque una vez por foto y otra
 * por menú — cuatro copias del mismo if/if.
 */
export function extraerArchivoValidado(
  formData: FormData,
  campo: 'foto' | 'menu',
  etiqueta: string,
): ArchivoValidado {
  const valor = formData.get(campo);
  const archivo = valor instanceof File && valor.size > 0 ? valor : null;
  if (!archivo) return { ok: true, archivo: null };

  const problema = validarArchivo(archivo);
  if (problema === 'tipo-no-permitido') return { ok: false, mensaje: 'Solo se aceptan JPG, PNG o WebP' };
  if (problema === 'muy-grande') return { ok: false, mensaje: `${etiqueta} no puede pesar más de 5 MB` };
  return { ok: true, archivo };
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

  // La firma se mira ANTES de sharp: si no es JPEG, PNG ni WebP no se decodifica
  // nada, así un AVIF/HEIC disfrazado nunca llega a libheif (ver formatoImagen.ts).
  if (!esFormatoPermitido(buffer)) return null;

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

  // ── Con sufijo aleatorio, y hay que saber por qué cambió ──
  //
  // Antes esto subía a un pathname fijo derivado del id
  // (`portafolios/<id>.webp`) sin sufijo, a propósito: la foto y el
  // menú/flyer de un negocio de Aliados son públicos, se muestran en la
  // vitrina, y que la URL se pueda derivar no filtraba nada.
  //
  // Pero @vercel/blob 2.7.0 tira error si el pathname ya existe y no se pasa
  // `allowOverwrite` — así que reemplazar la foto de una ficha que ya tenía
  // una fallaba siempre. Y aun con `allowOverwrite`, un pathname fijo +
  // `cacheControlMaxAge` de un año significa que la vitrina puede seguir
  // sirviendo la foto vieja desde caché aunque el blob ya se haya
  // sobrescrito — la URL no cambió, así que nada invalida el caché.
  //
  // `addRandomSuffix: true` resuelve las dos cosas a la vez: cada subida es
  // un blob nuevo con una URL nueva (no hay caché viejo que invalidar) y no
  // hace falta `allowOverwrite`. El pathname deja de ser derivable del id,
  // pero eso nunca fue el mecanismo de privacidad de este archivo — sigue
  // siendo público a propósito, ver arriba — así que no se pierde nada.
  // El blob anterior queda huérfano si nadie lo borra: por eso
  // `adjuntarFoto`/`adjuntarMenu` (lib/db/portafolios.repo.ts) devuelven el
  // pathname previo, y quien las llama (lib/actions/gestionarEstado.ts,
  // lib/actions/editarPortafolioModerador.ts) lo borra con `borrarFoto` una
  // vez que la URL nueva ya quedó guardada.
  const blob = await put(pathname, optimizada, {
    access: 'public',
    contentType: 'image/webp',
    addRandomSuffix: true,
    // Público e inmutable por URL (el sufijo cambia en cada reemplazo): se cachea fuerte.
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });

  return { url: blob.url, pathname: blob.pathname };
}

/** El pathname base se deriva del id (`addRandomSuffix` en `optimizarYSubir` le suma el sufijo que lo hace único en cada reemplazo). */
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
