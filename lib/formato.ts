/**
 * «2 de octubre de 2026»: el día de HOY en Bogotá, para el «al …» de una cifra
 * que sale de la base en cada carga. Ojo con la diferencia con `fechaLarga`
 * (`lib/geo/constelaciones.ts`): esa recibe una fecha UTC del pipeline y muestra
 * el día UTC; esta usa la hora de Colombia, porque a las 8 p. m. de Bogotá en UTC
 * ya es mañana y el vecino vería una fecha adelantada.
 */
export function fechaHoyBogota(): string {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'America/Bogota' }).format(new Date());
}

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

/** «3 de octubre de 2026, 6:02 a. m.» en hora de Bogotá, para un instante ISO (una corrida del vigía). */
export function fechaHoraBogota(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(new Date(iso));
}
