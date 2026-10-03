/**
 * Los errores del retorno de Google llegan como ?error=<clave>. El texto real
 * del fallo nunca se muestra: los errores de OAuth traen identificadores de
 * cliente y descripciones internas que a la persona no le sirven de nada.
 *
 * Un solo lugar para las dos puertas (`/entrar` y `/firmamento/entrar`).
 */
export const MENSAJES_INGRESO: Record<string, string> = {
  estado: 'La sesión tardó demasiado. Intenta entrar otra vez.',
  google: 'No pudimos confirmar tu cuenta de Google. Intenta de nuevo.',
  limite: 'Hubo demasiados intentos. Espera unos minutos.',
  sesion: 'No pudimos abrir tu sesión. Intenta de nuevo.',
  sin_google: 'El ingreso con Google no está disponible por ahora.',
  // Deliberadamente vago sobre el motivo: confirmarle a quien intenta entrar
  // que ese correo ya está registrado le regala información sobre la cuenta
  // de otra persona. El detalle queda en el log del servidor, para el equipo.
  correo_tomado:
    'No pudimos entrar con esa cuenta. Escríbenos y lo resolvemos contigo.',
  // Sin decir si venció, se usó o la revocaron: a quien tiene el enlace le basta.
  invitacion:
    'Entraste, pero esa invitación ya no sirve: venció, ya se usó o la revocaron. Pide una nueva al equipo de Constelaciones.',
};
