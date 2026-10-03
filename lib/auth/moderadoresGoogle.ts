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
 * ── La variable es el RESPALDO, no la única vía (migración 035) ──
 *
 * `ADMIN_GOOGLE_SUBS` (lista separada por comas) solo la edita quien tiene
 * acceso al despliegue: sirve para el primer moderador y para recuperar el
 * panel si la base queda sin ninguno. La vía de todos los días es
 * `admins.google_sub`, que llena una invitación de moderador
 * (`accesoModeradorGoogle` en admin.ts consulta las dos). No es una columna
 * de `usuarios` a propósito: un bug que escriba en la tabla de vecinos no
 * puede dar el panel; el permiso vive en `admins`, que solo tocan el consumo
 * de una invitación (en una sentencia) y el panel del equipo.
 *
 * Sin la variable, nadie entra por esta vía.
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
