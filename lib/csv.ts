/**
 * Serialización a CSV. Sin dependencia: son treinta líneas contra un paquete
 * con su propio parser, su config y su superficie de bugs.
 *
 * Se serializa RFC 4180: separador coma, comillas dobles alrededor de cualquier
 * celda con coma, comilla o salto de línea, y comillas internas duplicadas.
 */

/**
 * Neutraliza la inyección de fórmulas.
 *
 * Excel, LibreOffice y Google Sheets interpretan como fórmula cualquier celda
 * que empiece con `=`, `+`, `-`, `@`, tab o retorno de carro. Y acá los datos
 * los escribe cualquiera desde un formulario público: alguien puede llamar a
 * su negocio `=HYPERLINK("http://malo.com","Ver factura")` y ese CSV se abre
 * en la máquina de un moderador.
 *
 * El prefijo de comilla simple es la mitigación estándar: Excel la consume al
 * mostrar la celda, así que el texto se ve igual pero no se evalúa.
 */
function neutralizarFormula(texto: string): string {
  return /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
}

function celda(valor: unknown): string {
  if (valor === null || valor === undefined) return '';

  // Números y booleanos NO se neutralizan. Una longitud de -75.552 empieza con
  // `-` y quedaría como '-75.552: Excel lo leería como texto y el dato dejaría
  // de servir para cualquier cálculo. El riesgo de fórmula viene del texto que
  // escribe una persona, no de una columna numérica de Postgres.
  if (typeof valor === 'number' || typeof valor === 'boolean') return String(valor);

  const texto = neutralizarFormula(String(valor));

  return /[",\n\r]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

/**
 * Arma el CSV a partir de las filas y un mapa de columna → encabezado.
 * El mapa define también el ORDEN: un `Object.keys` sobre la primera fila
 * dejaría el orden a merced de cómo Postgres devolvió las columnas.
 */
export function aCsv<T extends Record<string, unknown>>(
  filas: T[],
  columnas: { clave: keyof T & string; encabezado: string }[],
): string {
  const lineas = [columnas.map((c) => celda(c.encabezado)).join(',')];

  for (const fila of filas) {
    lineas.push(columnas.map((c) => celda(fila[c.clave])).join(','));
  }

  // CRLF por RFC 4180, y porque es lo que Excel espera en Windows.
  return lineas.join('\r\n');
}

/**
 * BOM UTF-8 al principio.
 *
 * Sin esto Excel en Windows abre el archivo como Latin-1 y "Panadería" se ve
 * "PanaderÃ­a". El resto del mundo ignora el BOM sin problema, así que el
 * costo de ponerlo es cero y el de omitirlo es un informe ilegible.
 */
export const BOM_UTF8 = '﻿';
