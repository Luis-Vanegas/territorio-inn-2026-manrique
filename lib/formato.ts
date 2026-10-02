/**
 * Formato de cifras en español de Colombia («2.626», «13,16»). Un solo lugar:
 * lo usan el conteo animado (`NumeroAnimado`) y las páginas que escriben cifras
 * en texto, para que la misma magnitud se vea igual en los dos sitios.
 */
export function formatearNumero(valor: number, decimales = 0): string {
  return valor.toLocaleString('es-CO', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}
