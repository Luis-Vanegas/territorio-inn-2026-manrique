/**
 * ¿Los primeros bytes son de un JPEG, un PNG o un WebP?
 *
 * `file.type` lo manda el navegador y se falsifica con una línea; sharp, en
 * cambio, elige el decodificador mirando el CONTENIDO. Sin esto, un AVIF o un
 * HEIC declarado como `image/jpeg` llegaba igual a libheif — que es justo lo
 * que explotaban GHSA-2xp9-vwfh-vxw4 y el aviso de libheif de sharp (sep. 2026).
 * Mirar la firma antes de sharp deja fuera de alcance cualquier decodificador
 * que no aceptamos, incluidas sus vulnerabilidades futuras.
 *
 * Módulo puro (sin sharp ni server-only) para poder probarlo con
 * scripts/verificar-formato-imagen.mjs.
 */
export function esFormatoPermitido(bytes: Uint8Array): boolean {
  const empieza = (firma: number[], desde = 0) =>
    bytes.length >= desde + firma.length && firma.every((b, i) => bytes[desde + i] === b);

  return (
    empieza([0xff, 0xd8, 0xff]) || // JPEG
    empieza([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) || // PNG
    (empieza([0x52, 0x49, 0x46, 0x46]) && empieza([0x57, 0x45, 0x42, 0x50], 8)) // RIFF....WEBP
  );
}
