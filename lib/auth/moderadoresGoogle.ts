/**
 * ¿Esta cuenta de Google es de un moderador?
 *
 * Archivo aparte de `admin.ts` a propósito: esa lógica decide quién entra al
 * panel, y `admin.ts` importa `server-only` y `next/headers`, así que no se
 * puede ejecutar fuera de Next. Acá no hay nada de eso, y por eso
 * `scripts/verificar-moderadores-google.mjs` la prueba de verdad.
 *
 * ── Por qué el `sub` y no el correo ──
 *
 * Mismo criterio que docs/seguridad.md para toda la identidad con Google: el
 * correo puede cambiar de manos, el `sub` es inmutable. Y acá el premio es el
 * panel de moderación, así que la regla importa el doble.
 *
 * ── Por qué una variable de entorno y no una columna ──
 *
 * `ADMIN_GOOGLE_SUBS` (lista separada por comas) solo la edita quien tiene
 * acceso al despliegue. Una columna `es_moderador` en `usuarios` la podría
 * tocar cualquier bug de SQL o de Server Action que escriba en esa tabla, y
 * el resultado sería un vecino con el panel. Con la variable no hay camino
 * desde la aplicación hasta ese permiso.
 *
 * Sin la variable, nadie entra por acá: el comportamiento por defecto es no
 * tener moderadores por Google.
 */
export function esModeradorGoogle(
  sub: string,
  lista: string | undefined = process.env.ADMIN_GOOGLE_SUBS,
): boolean {
  if (!sub) return false;

  return (lista ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(sub);
}
