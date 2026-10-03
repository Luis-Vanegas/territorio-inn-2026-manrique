# Seguridad del proyecto

Inventario de lo que protege el sitio hoy, con el porqué de cada decisión, y
la lista honesta de lo que falta. Se actualiza cuando cambia algo, no cuando
alguien se acuerda.

## Superficie expuesta

El sitio tiene exactamente cuatro puertas al mundo:

| Puerta | Quién entra | Qué puede hacer |
|---|---|---|
| `/aliados/registro` | cualquiera, sin cuenta | crear un portafolio `pendiente` + subir una foto |
| `/contacto` | cualquiera, sin cuenta | dejar un mensaje en el buzón |
| `POST /api/interacciones` | cualquiera, sin cuenta | sumar 1 a un contador |
| `/firmamento/entrar?rol=equipo` (antes `/admin/login`) | moderadores | obtener una sesión de 8 h |
| `/firmamento/invitacion/<token>` | quien recibió el enlace | ver a qué invita; el acceso se da al volver de Google (ver Accesos) |

Todo lo demás es lectura pública o está detrás de la sesión de moderación.

## Autenticación y sesión

- **Passwords con `scrypt`** de `node:crypto`, formato `salt_hex:hash_hex`.
  Sin bcrypt como dependencia: la stdlib ya lo resuelve.
- **Comparación con `timingSafeEqual`**, no con `===`. Comparar hashes con `===`
  filtra información por el tiempo que tarda en fallar.
- **Login de usuario inexistente corre igual un `scrypt` descartable**, para que
  el tiempo de respuesta no revele qué correos son moderadores.
- **Mensaje de error único** (`Credenciales incorrectas`) para email inexistente
  y password equivocada. Distinguirlos convertiría el formulario en un
  verificador de qué correos tienen cuenta.
- **Sesión firmada con HMAC-SHA256** sobre el payload en base64url, con
  expiración incluida en la firma. Cookie `httpOnly` + `sameSite=lax` +
  `secure` en producción.
- **Rate limit de 8 intentos cada 15 minutos por IP** sobre logins fallidos.
  Los exitosos no gastan cupo, así que trabajar normalmente nunca acerca al
  bloqueo.

## Ingreso de vecinos con Google (OAuth 2.0)

Distinto del login de moderadores: acá no hay contraseña propia. La identidad
la prueba Google y el sitio solo verifica que la vuelta sea legítima.

- **La identidad es `google_sub`, NUNCA el correo.** `google_sub` es el
  identificador inmutable que Google asigna a una cuenta; el correo cambia de
  manos. El upsert de `ingresarConGoogle` resuelve el conflicto por
  `google_sub`, y si llega una cuenta distinta con un correo ya registrado
  **se rechaza el ingreso** (`estado: 'correo_tomado'`).

  **No lo "arregles" con `on conflict (correo)`.** Sería la corrección obvia y
  es un agujero de suplantación: haría que una cuenta nueva se apodere de la
  fila existente —con sus negocios adentro— solo por traer el mismo correo.

- **Se rechaza un correo sin verificar.** Si `email_verified` viene `false`,
  no se entra: un correo sin confirmar no identifica a nadie.
- **PKCE (RFC 7636) con `S256`.** El código de autorización viaja en la URL del
  navegador —historial, logs de proxy, `Referer`—, así que solo sirve
  acompañado de un verificador que vive en una cookie `httpOnly` y nunca sale
  del servidor. Interceptar el código deja de alcanzar.
- **`state` aleatorio de 32 bytes**, en cookie `httpOnly` de un solo uso
  (`maxAge` 600 s), comparado con `timingSafeEqual`. Se borra apenas se lee,
  pase lo que pase después.
- **Prefijo `__Host-` en las tres cookies** (estado, verificador, sesión), solo
  en producción porque el prefijo exige HTTPS. Un subdominio comprometido no
  puede escribirlas.
- **Sesión de 14 días.** No hay lista de sesiones activas, así que una cookie
  robada vale hasta que expire; 14 días acota la ventana sin obligar a
  re-autenticarse a quien entra cada par de semanas. El daño posible está
  limitado por diseño: una sesión de vecino solo alcanza su propia ficha.
- **`sameSite=lax`, no `strict`.** Con `strict` la cookie no viaja al volver
  desde Google y la persona quedaría autenticada y deslogueada a la vez.
- **El mensaje de `correo_tomado` es vago a propósito.** Confirmar que ese
  correo ya está registrado le regalaría información sobre la cuenta de otro.
  El detalle va al log del servidor.

## Autorización

**Dos poblaciones, dos cookies: `admin_session` (moderadores) y
`sesion_usuario` (vecinos).** Separadas a propósito. Con una sola cookie y un
campo "rol" adentro, ese campo sería lo único entre un vecino y el panel de
moderación. El panel solo lee la suya, así que no existe un camino donde una
sesión de vecino se convierta en acceso de administrador — ni falsificándola,
porque el panel nunca la mira.

**Las dos cookies se firman igual, y por eso cada una valida su payload.**
`admin_session` y `sesion_usuario` usan el mismo `ADMIN_SESSION_SECRET` y el mismo
formato (base64url + HMAC, con `exp`). Hasta la 035, `verificarSesion()` solo
miraba la firma y el `exp`: **el valor de la cookie de un vecino, pegado a mano como
`admin_session`, pasaba la verificación y abría el panel del equipo** (y la
exportación completa de `/api/admin/exportar`) con `email: undefined`. Hoy exige
`email` de tipo string y que ese correo sea un moderador **activo** en `admins`; al
revés, `sesionActual()` ya exigía `id` string. `scripts/verificar-accesos.mjs`
falla si alguna de esas comprobaciones desaparece. ponytail: separar los secretos
(o firmar con un prefijo de dominio) cerraría la clase entera; se deja así porque
cambiarlo cierra todas las sesiones abiertas y las dos comprobaciones ya bastan.

**Moderador desactivado = sin panel en su siguiente petición.** `verificarSesion()`
lee `admins.activo` (una consulta por petición, deduplicada con `cache`; si la base
no responde, falla cerrado). La cookie de 8 h ya no sobrevive a una baja.

**Moderador por Google: por invitación o por `ADMIN_GOOGLE_SUBS`.** Un moderador
puede entrar por «Continuar con Google» en vez de por la contraseña de la pestaña
Equipo de `/firmamento/entrar`. `accesoModeradorGoogle` (`lib/auth/admin.ts`) decide,
en el retorno de Google:

1. **Por base** (la vía de todos los días, migración 035): una fila de `admins` con
   ese `google_sub`. La llena una **invitación de moderador** (ver Accesos). Manda su
   `activo`.
2. **Respaldo del despliegue**: el `sub` está en `ADMIN_GOOGLE_SUBS`. Sirve para el
   primer moderador y para recuperar el panel si la base queda sin ninguno. Se
   asegura la fila (la auditoría la necesita: `moderado_por` y compañía son FK a
   `admins(email)`) y se le ata el `sub`. **Una fila que el equipo desactivó
   (`desactivado_en`) no se reactiva por estar en la variable**: hay que invitarla de
   nuevo. Las filas viejas de esta vía (`activo = false`, sin `sub`, de antes de la
   035) se activan en su siguiente ingreso con Google; hasta entonces su cookie
   vigente no vale (se vuelve a entrar y listo).

En los dos casos es el `sub`, nunca el correo. El permiso vive en `admins`, no en
`usuarios`: un bug que escriba en la tabla de vecinos no puede dar el panel. La
cookie de vecino no cambia ni lleva ningún rol: el retorno emite **además**
`admin_session`. La fila `sin-acceso` no entra por contraseña (el hash no es un
hash). «Cerrar sesión» del vecino cierra también `admin_session`. El `sub` se
obtiene con `npm run db:google-sub -- --correo <correo>`.

Riesgo asumido: quien controle esa cuenta de Google controla el panel. Por eso
la cuenta debe tener verificación en dos pasos. Para revocar: «Quitar acceso» en
`/firmamento/equipo/moderadores` (vale de inmediato); si además está en
`ADMIN_GOOGLE_SUBS`, sacarlo de la variable.

## Accesos (migración 035)

**Regla: nadie gana acceso por coincidir un correo.** El correo de una ficha lo
escribió quien la registró y nadie lo verificó; vincular por él sería entregarle el
negocio a quien lo puso. En producción (3-oct) 7 de 8 negocios aprobados no tienen
cuenta y solo 1 coincide por correo: se resuelve a mano, por una de estas vías.

- **Dueño de un negocio, desde el panel** («Cuenta y acceso» en cada ficha de
  `/firmamento/equipo/aliados`). El moderador elige una cuenta que YA existe (entró
  con Google); el correo solo ubica la fila. Si el negocio tiene dueño, reasignar
  exige marcar la confirmación, y el candado está en el `where` del repo
  (`vincularPorEquipo`), no en la pantalla. Desvincular también. Todo deja
  bitácora (`negocio_vinculado` / `negocio_desvinculado`, solo nombres de campo).
- **Enviar acceso por WhatsApp**: el enlace personal `/aliados/estado/<token>` (el
  mismo de siempre) ofrece «Continuar con Google» si el negocio no tiene dueño; al
  volver, `vincularNegocio` lo ata a esa cuenta (`where usuario_id is null`: no pisa
  a nadie). **Antes no funcionaba**: el retorno leía `?vincular=` de su propia URL,
  pero Google vuelve solo con `code` y `state`, así que ese parámetro nunca llegó.
  Hoy viaja en la cookie `oauth_vincular` (httpOnly, 10 min, un solo uso).
- **Invitaciones** (entidad o moderador): el moderador crea un enlace
  `/firmamento/invitacion/<token>` y lo comparte. Token de 32 bytes aleatorios
  (256 bits); en la base **solo su sha256** (CHECK de 64 hex): una copia de la tabla
  no rearma enlaces. Se muestra una sola vez y no se escribe en ningún log. Vence a
  los 7 días (tope de 30 por CHECK), un solo uso, revocable. La página no da acceso:
  manda a Google con el token en la cookie `oauth_invitacion`, y el retorno lo
  consume en **una sentencia** (CTE: `update ... where usada_en is null and
  revocada_en is null and expira_en > now()` + la fila en `miembros_entidad` o en
  `admins`). Dos consumos a la vez: el segundo reevalúa el `where` y no hace nada
  (probado con 6 consumos concurrentes: gana uno). Los enlaces que no sirven gastan
  cupo de `invitacion` (10 cada 15 min por IP), al abrir la página y al consumir.
  La página lleva `referrer: no-referrer` y `noindex`.
- **Quitar acceso a un moderador**: `activo = false` + `desactivado_en/por`. Nunca a
  uno mismo ni al último activo; en transacción `Serializable`, para que dos
  moderadores dándose de baja el uno al otro no dejen el panel vacío.

Riesgo asumido: quien reciba el enlace de una invitación (o lo vea en el chat de
otro) puede usarlo antes que el destinatario. Por eso es de un solo uso, vence en 7
días, se revoca desde el panel y la lista de pendientes dice para quién era (`nota`).
Si alguien usó una invitación ajena, se le quita el acceso (Entidades › Quitar,
Moderadores › Quitar acceso) y se manda otra.

El guard es `exigirEquipo` (`lib/auth/firmamento.ts`) y se llama en el layout de `app/(firmamento)/firmamento/equipo/` Y en cada `page.tsx` (un layout no se re-ejecuta al navegar entre hermanas), no en `middleware.ts`. Se
decidió así cuando el middleware era Edge-only (Next 14), donde no existen
`node:crypto` ni `cookies()` de `next/headers` — justo lo que
`verificarSesion()` necesita. Desde Next 16 el middleware ya soporta Node, pero
el guard sigue donde está: mover la verificación no agregaría seguridad.

**Cada server action revalida la sesión por su cuenta.** El layout protege la
navegación; una server action es un endpoint HTTP invocable sin pasar por
ninguna página, así que confiar solo en el layout dejaría las acciones de
moderación abiertas.

## Validación de entrada

Tres capas, y ninguna sobra:

1. **Zod en el cliente** — respuesta inmediata, evita un viaje al servidor.
2. **Zod en el servidor** — el cliente se puede saltear entero con `curl`.
3. **CHECK constraints en Postgres** — última línea. Un `insert` directo contra
   la base no puede crear un portafolio sin contacto, ni moderado sin auditoría,
   ni rechazado sin motivo.

Para las fotos hay una cuarta: el `file.type` lo manda el navegador y se puede
falsificar, así que **el decode de `sharp` es la verificación real** de que el
contenido es una imagen. Un `.exe` renombrado a `.jpg` pasa la validación de
tipo y muere en sharp.

## Rate limiting

Tabla `intentos_registro` en Postgres, con cupos separados por `origen`:

| Origen | Cupo | Ventana |
|---|---|---|
| `registro` | 3 | 10 min |
| `login` | 8 | 15 min |
| `invitacion` | 10 fallidos | 15 min |

(La tabla completa de cupos, con `estado`, `agente`, `geocodificar`, `datos` e
`ingesta`, está en `lib/db/rateLimit.ts`.)

Están separados a propósito: compartir cupo permitiría quemar el de login con
intentos fallidos para dejar a esa IP sin poder registrar un negocio.

**Por qué Postgres y no Redis:** el endpoint de registro ya escribe en la base
en el mismo request. Sumar Upstash agrega un servicio, una credencial y un
punto de falla para ahorrar una query que ya está en el camino caliente.

**Limitación conocida:** detrás de un NAT compartido (un café, una biblioteca,
un colegio) varias personas comparten IP y comparten cupo. Por eso los límites
son holgados y el mensaje dice cuánto falta en vez de solo negar.

La tabla se purga con un cron diario (`vercel.json` → `/api/cron/purgar`,
protegido con `CRON_SECRET`). Sin eso crece para siempre.

> **Verificado el 2026-08-25: `CRON_SECRET` no estaba cargada en producción.**
> El endpoint falla cerrado (503) cuando la variable no existe, así que la purga
> diaria nunca llegó a correr y `intentos_registro` viene creciendo desde el
> primer despliegue. Se detectó sondeando `GET /api/cron/purgar` sin
> credenciales: **503 significa que falta el secreto, 401 que está bien puesto.**
> Esa sonda es la forma barata de verificarlo sin entrar al panel de Vercel, y
> conviene repetirla después de cada cambio de entorno.

## Cabeceras HTTP

Configuradas en `next.config.mjs` para todas las rutas:

| Cabecera | Para qué |
|---|---|
| `X-Frame-Options: DENY` | clickjacking sobre los botones de aprobar/rechazar |
| `X-Content-Type-Options: nosniff` | que el navegador no "adivine" el tipo de una respuesta |
| `Referrer-Policy: strict-origin-when-cross-origin` | que una ruta del panel no aparezca en logs de terceros |
| `Permissions-Policy` | apaga cámara, micrófono, pagos y USB; deja `geolocation=(self)` |
| `Strict-Transport-Security` | evita el primer request en texto plano |
| `Content-Security-Policy-Report-Only` | **anota, todavía no bloquea** — ver abajo |

### La CSP está en modo reporte, no aplicada

`Content-Security-Policy-Report-Only` hace que el navegador anote en su consola
lo que la política habría frenado, sin frenar nada. Es el paso previo
obligatorio: una CSP aplicada que se equivoca en un origen rompe el sitio **en
silencio**, sin un error visible en ninguna parte.

Ese riesgo no es teórico. La primera versión de esta política listaba
`*.tile.openstreetmap.org` como origen del mapa. El modo reporte marcó 67
violaciones al abrir `/aliados`: el mapa **no** usa OpenStreetMap, usa
`services.arcgisonline.com` (ver `TESELAS.url` en `lib/geo/constantes.ts`). En
modo bloqueo, el mapa se habría quedado gris. Lo mismo con
`va.vercel-scripts.com`, que sirve Analytics y Speed Insights.

Orígenes verificados con cero violaciones en `/aliados`, `/aliados/registro`,
`/entrar` y `/admin/login` (verificación anterior a la mudanza: hoy esa puerta es `/firmamento/entrar`, sin re-verificar).

**Antes de pasarla a modo bloqueo** (renombrar la cabecera a
`Content-Security-Policy`), recorrer con la consola abierta lo que todavía no
se probó: el panel de moderación con sesión, `/mi-cuenta` con sesión, el asesor
respondiendo, y el sitio **en producción** — donde los scripts de Vercel no son
los `.debug.js` de desarrollo.

**Lo que esta política todavía NO protege:** `script-src` lleva
`'unsafe-inline'` porque Next emite scripts inline para hidratar. Con eso, la
CSP no defiende contra XSS, que es su razón de ser principal. Quitarlo pide
nonces por request generados en un middleware — cambio de arquitectura, no una
línea. Lo que sí acota hoy es de dónde salen imágenes, conexiones, marcos y
formularios.

## Datos personales

Ver `docs/analitica.md` para el detalle. En resumen:

- Se guarda `ip_registro` en `portafolios` y `peticiones`. Es dato personal,
  está declarado en `/legal/politica-datos` y tiene consentimiento expreso.
  **Solo 30 días**: el cron diario (`/api/cron/purgar` → `purgarIpsViejas`) la
  anula pasado ese plazo; la fila queda, la IP no. Para auditoría de
  consentimiento queda `aliados_consentimiento.ip_hash`.
- **Datos abiertos (`GET /api/datos`)**: solo conteos de negocios aprobados, con
  la regla k = 5 (celdas < 5 salen como `"<5"`, con supresión complementaria en
  las particiones). Sin nombres, contactos, direcciones, coordenadas, tokens, IP
  ni respuestas individuales. CORS abierto a propósito: por eso no puede devolver
  nada que no se publicaría en la vitrina. Lo comprueba `verificar-datos-k.mjs`.
- **Asesor de IA**: la política nombra a los proveedores (Groq, Routeway, Google
  Gemini, OpenRouter, NVIDIA NIM) y qué datos de la ficha reciben. Si se agrega
  un proveedor a `lib/agente/proveedores.ts`, se nombra en la política y se sube
  `VERSION_TERMINOS`.
- `aliados_consentimiento.ip_hash` se calcula con `sha256(ip + IP_HASH_PEPPER)`.
  **Si la variable falta, `hashIp()` devuelve `null` y no se guarda nada.** Antes
  tenía un `?? ''` que caía al SHA-256 pelado en silencio: el espacio de IPv4 son
  ~4.300 millones de valores, así que sin pepper el hash se invierte con una
  rainbow table y la promesa de la migración 011 quedaba incumplida sin que nadie
  se enterara. Mismo criterio que `/api/cron/purgar`: falta el secreto, se falla
  cerrado. **`IP_HASH_PEPPER` es obligatoria en producción.**
- **No hay cookies de seguimiento, ni `localStorage`, ni huella de navegador.**
  El único cookie del sitio es la sesión de moderación.
- El contador de interacciones es agregado por día: no existe forma de
  reconstruir el recorrido de una persona porque el dato individual nunca se
  guarda.
- La ubicación del visitante (`navigator.geolocation`) **nunca sale del
  navegador**. Se usa para ordenar la lista y no se envía a ningún endpoint.

## Verificación antes de publicar

No hay CI. Se probó con GitHub Actions y se sacó: la cuenta tenía un presupuesto
de $0 con "stop usage" sobre el producto Actions, así que ningún job llegaba a
arrancar y cada push quedaba con una X roja que no informaba nada. Un CI que
nunca corre es peor que no tenerlo, porque da una señal falsa.

La verificación es a mano, antes de pushear:

```bash
npm run typecheck && npm run lint && npm run verificar
```

`npm run verificar` necesita `DATABASE_URL`: corre contra la rama de desarrollo
de Neon, nunca contra producción.

Si algún día se reactiva Actions, en repos públicos es gratis e ilimitado — lo
único que hay que hacer es sacar el presupuesto de $0 que lo bloquea.

**Excepción desde el reto de octubre de 2026:** hay UN workflow,
`.github/workflows/vigia-convocatorias.yml` (vigía diario de convocatorias, que
solo envía candidatas `pendiente` a moderación). No es CI de verificación, así
que el párrafo de arriba sigue valiendo. El repo es público y la documentación de
GitHub dice que los runners estándar no se cobran en repos públicos; si el
presupuesto de $0 todavía bloqueara el producto, el síntoma es el de antes: el job
no arranca. Los workflows programados se desactivan tras 60 días sin actividad.
Variables nuevas: `INGESTA_SECRETO` (Vercel) y los secretos `INGESTA_URL` e
`INGESTA_SECRETO` del repo.

## Lo que falta

Ordenado por lo que más duele:

1. **Content-Security-Policy.** Hoy no hay ninguna. Hacerla bien pide nonces
   por request y probarla contra el sitio real (las tiles de CARTO, las fotos
   del Blob y los estilos inline de Next son todos casos a contemplar). Una CSP
   con `'unsafe-inline'` en scripts no protegería de nada, así que o se hace
   completa o no se hace.
2. **Branch de Neon para desarrollo.** Hoy el proyecto tiene una sola branch:
   `.env.local` apunta a producción. Cualquier migración corrida en local se
   aplica en el sitio en vivo, y cualquier `delete` borra datos reales.
3. **Sin rate limit en `/api/interacciones`.** El techo conocido está anotado
   con un comentario `ponytail:` en `lib/db/interacciones.repo.ts`: alguien
   puede inflar su propio contador. A escala barrial es un número feo en un
   panel interno. Si aparece abuso, el patrón ya está resuelto y se reutiliza.
4. **Sin rotación de `ADMIN_SESSION_SECRET`.** Rotarlo invalida todas las
   sesiones abiertas, que es aceptable para un equipo de tres personas, pero
   no hay procedimiento escrito.
5. **Vercel BotID / reglas de WAF.** Pendiente de evaluar cuando haya tráfico
   real y se vea si aparece abuso automatizado que el rate limiting no contenga.
