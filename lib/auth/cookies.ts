/**
 * Atributos de las cookies de sesión y de OAuth: una sola definición, para
 * crearlas y para borrarlas.
 *
 * ── El error que esto evita ──
 *
 * En producción las cookies se llaman `__Host-…`. Ese prefijo obliga al
 * navegador a rechazar cualquier `Set-Cookie` sobre ellas que no lleve
 * `Secure` y `Path=/` — y eso incluye el `Set-Cookie` que las BORRA.
 *
 * `cookies().delete('nombre')` de Next envía `nombre=; Path=/; Expires=1970`,
 * sin `Secure`. En local la cookie no tiene prefijo y se borra bien; en
 * producción el navegador ignora el borrado en silencio y la sesión no se
 * cierra jamás. Es un error que solo existe donde no se prueba.
 *
 * Por eso borrar es `set(nombre, '', opcionesBorrado())`: los mismos atributos
 * con los que se creó, más `maxAge: 0`.
 *
 * Sin `import 'server-only'` a propósito: es lógica pura, y así
 * `scripts/verificar-cookies.mjs` la puede probar fuera de Next.
 */
export function opcionesCookie(produccion = process.env.NODE_ENV === 'production') {
  return {
    httpOnly: true,
    // Con `__Host-` (solo en producción) esto no es opcional.
    secure: produccion,
    // 'lax' y no 'strict': con 'strict' la cookie no viaja cuando la persona
    // vuelve desde Google, y quedaría recién autenticada y deslogueada a la vez.
    sameSite: 'lax' as const,
    // `path: '/'` también es requisito del prefijo `__Host-`.
    path: '/',
  };
}

/** Para borrar: los mismos atributos con que se creó, y que expire ya. */
export function opcionesBorrado(produccion = process.env.NODE_ENV === 'production') {
  return { ...opcionesCookie(produccion), maxAge: 0 };
}
