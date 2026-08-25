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
| `/admin/login` | moderadores | obtener una sesión de 8 h |

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

## Autorización

El guard vive en `app/admin/(panel)/layout.tsx`, no en `middleware.ts`. Se
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

## Datos personales

Ver `docs/analitica.md` para el detalle. En resumen:

- Se guarda `ip_registro` en `portafolios` y `peticiones`. Es dato personal,
  está declarado en `/legal/politica-datos` y tiene consentimiento expreso.
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

## Integración continua

`.github/workflows/ci.yml` corre en cada push a `main` y en cada PR:
`typecheck`, `lint` y `verificar-geo`. Existía `npm run verificar` y no lo
corría nadie — un script que depende de que alguien se acuerde no es una red de
seguridad.

`verificar-constraints` y `verificar-campos-personalizados` quedan **fuera** de
CI a propósito: consultan Neon, y darle a CI una credencial de base para leer un
esquema es más superficie de la que ese chequeo justifica. Se corren a mano
antes de un release, junto con las migraciones.

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
