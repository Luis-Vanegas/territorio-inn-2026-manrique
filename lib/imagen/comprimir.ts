/**
 * Compresión de fotos EN EL NAVEGADOR, antes de subirlas.
 *
 * ── Por qué existe, si el servidor ya optimiza ──
 *
 * `lib/blob/fotos.ts` ya redimensiona a 1200px y convierte a WebP con sharp, y
 * funciona: las fotos guardadas pesan entre 10 y 40 KB. El problema es CUÁNDO lo
 * hace — después de que el archivo cruzó toda la red. Una foto de celular de 4 MB
 * viaja entera desde los datos móviles del vecino para que el servidor descarte
 * el 99% y guarde 38 KB.
 *
 * Eso cuesta dos cosas: los datos de quien se registra, y el registro entero
 * cuando el body pasa el límite de Server Actions y Next responde 413 antes de
 * que la acción llegue a correr.
 *
 * Comprimir acá deja el archivo en el mismo tamaño final, pero desde el arranque.
 *
 * Efecto secundario que conviene: el canvas descarta TODO el EXIF, incluidas las
 * coordenadas GPS que agregan las cámaras de celular. Ya lo hacía sharp del lado
 * del servidor; ahora esos metadatos ni siquiera salen del dispositivo.
 *
 * Solo-navegador: usa createImageBitmap y canvas. Importar desde un componente
 * cliente.
 */

// Los mismos valores que usa sharp en lib/blob/fotos.ts (LADO_MAX, CALIDAD_WEBP):
// comprimir con otros números haría que el servidor recomprima una imagen ya
// degradada y se note en la ficha.
const LADO_MAX = 1200;
const CALIDAD = 0.8;

/**
 * Devuelve una versión reducida en WebP, o el archivo ORIGINAL si algo falla.
 *
 * Nunca lanza: esto corre mientras alguien está llenando un formulario, y un
 * navegador que no soporte WebP en canvas o una imagen que no decodifique no
 * pueden dejar a la persona sin poder registrarse. El servidor sigue teniendo
 * su propio sharp como red: si acá no se comprimió, allá se comprime igual.
 */
export async function comprimirImagen(file: File): Promise<File> {
  if (typeof createImageBitmap !== 'function') return file;

  let bitmap: ImageBitmap;
  try {
    // `from-image` aplica la orientación EXIF al dibujar. Sin esto las fotos
    // tomadas en vertical se guardan acostadas, porque el canvas descarta el
    // EXIF y con él la marca de rotación que el visor habría respetado.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }

  try {
    const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
    // Sin agrandar: una foto de 400px se sube tal cual, no estirada a 1200.
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, ancho, alto);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', CALIDAD),
    );

    // Un navegador sin soporte de WebP en toBlob no falla: devuelve PNG en
    // silencio, y un PNG sin comprimir puede pesar MÁS que el original. Por eso
    // se comprueban las dos cosas, el tipo y el tamaño, antes de reemplazar.
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file;

    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
}

/** "3,8 MB", "142 KB" — para mostrarle a la persona cuánto se ahorró. */
export function pesoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}
