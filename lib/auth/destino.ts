/**
 * Adónde vuelve la persona después de entrar.
 *
 * Es la única puerta para un destino que viaja por la URL o por una cookie:
 * `?destino=` en el inicio de Google, el campo oculto del formulario de
 * moderación. Cualquier cosa que no sea una ruta INTERNA se descarta, para que
 * nadie arme un enlace de ingreso que termine en otro sitio (open redirect).
 *
 * Se aceptan solo letras, números, guion, guion bajo y barra, empezando por una
 * sola barra: eso deja afuera `//otro.sitio` (protocolo relativo), `\` (algunos
 * navegadores lo tratan como barra), `http:`, `..`, `?`, `#` y los caracteres de
 * control. Ningún destino legítimo de Firmamento necesita más.
 *
 * Sin `import 'server-only'` a propósito: es lógica pura y
 * `scripts/verificar-destino.mjs` la prueba fuera de Next.
 */
const RUTA_INTERNA = /^\/(?!\/)[A-Za-z0-9_\-/]*$/;

export function rutaInterna(valor: unknown): string | null {
  if (typeof valor !== 'string' || valor.length > 200) return null;
  return RUTA_INTERNA.test(valor) ? valor : null;
}

/**
 * La puerta a la que se devuelve a quien falla o cancela en Google: si venía de
 * Firmamento, la de Firmamento; si no, la de siempre.
 */
export function puertaDe(destino: string | null): string {
  return destino?.startsWith('/firmamento/') ? '/firmamento/entrar' : '/entrar';
}
