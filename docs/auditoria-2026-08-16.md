# Auditoría — 2026-08-16

Revisión completa del branch `feat/analitica-cercania-y-seguridad` (commits
más cambios sin commitear): seguridad, duplicidad de código y bugs de
correctness. Se hizo con tres pasadas independientes — no es una lectura
superficial, cada hallazgo de abajo está verificado contra el código actual,
con cita de archivo y línea. Los que se plantearon como sospecha y no
resistieron la verificación también se listan, para que quede constancia de
qué se descartó y por qué.

## Cómo leer esto

- 🔴 **Arreglar antes de mergear** — bug con impacto real en un usuario real.
- 🟡 **Arreglar pronto** — real pero de menor probabilidad o impacto.
- 🔵 **Duplicidad / limpieza** — no rompe nada hoy, pero cuesta mantenimiento.
- ⚪ **Descartado** — se investigó y no es un problema.

---

## 1. Bugs de correctness

### 🔴 Los links de Instagram/Facebook quedan rotos (URL duplicada)

**Dónde**: [`app/(site)/aliados/_components/TarjetaEmprendimiento.tsx:27-39`](../app/(site)/aliados/_components/TarjetaEmprendimiento.tsx)
vs. `normalizarRedSocial` en [`lib/validation/portafolio.schema.ts:76-82`](../lib/validation/portafolio.schema.ts)

`normalizarRedSocial` ahora guarda una URL completa en la columna
`instagram`/`facebook` (por ejemplo `https://instagram.com/usuario`) cuando lo
que el usuario escribió no parecía ya una URL. La tarjeta pública, en cambio,
sigue armando el link a mano:

```ts
href: `https://instagram.com/${portafolio.instagram}`
```

Resultado: `https://instagram.com/https://instagram.com/usuario`. El link no
abre, y la etiqueta visible queda como `@https://instagram.com/usuario`.

**Por qué pasó**: la normalización se agregó en el flujo de guardado sin
actualizar el único lugar que lee ese campo para mostrarlo.

**Fix**: que `TarjetaEmprendimiento` use el valor de `portafolio.instagram`
directamente como `href` (ya es una URL completa) en vez de reconstruirla, o
que `normalizarRedSocial` devuelva solo el username y sea el punto de
renderizado el que arme la URL — una sola fuente de verdad, no dos.

---

### 🔴 Falla al subir la foto ya no se avisa en ningún lado

**Dónde**: [`lib/actions/registrarPortafolio.ts:190-208`](../lib/actions/registrarPortafolio.ts),
[`lib/actions/gestionarEstado.ts:101-107`](../lib/actions/gestionarEstado.ts),
página de estado en `app/(site)/aliados/estado/[token]/_components/EstadoAliado.tsx:566-603`

El código documenta la decisión explícitamente: *"Un aviso en pantalla ya no
hace falta: la persona va a parar en su página de estado, donde ve si la foto
quedó o no."* Pero la página de estado solo renderiza la imagen si
`foto_url` existe — no distingue entre "nunca subiste una foto" y "la
subida falló". Los dos `try/catch` que envuelven `subirFoto` (en
`registrarPortafolio.ts` y en `gestionarEstado.ts`) solo hacen
`console.error`, sin dejar rastro visible para el usuario.

**Impacto**: un negocio queda sin foto en el mapa público y su dueño nunca se
entera de que hubo un error — piensa que simplemente no subió nada.

**Fix**: guardar un flag (`foto_error: boolean` en el resultado de la acción,
o un campo efímero en la página de estado vía query param) y mostrar un
mensaje corto tipo "la foto no se pudo subir, probá de nuevo" cuando
corresponda.

---

### 🟡 El honeypot y el tiempo mínimo anti-bot no cubren editar/borrar por token

**Dónde**: [`lib/actions/gestionarEstado.ts`](../lib/actions/gestionarEstado.ts)
vs. [`lib/actions/registrarPortafolio.ts:71-99`](../lib/actions/registrarPortafolio.ts)

El registro tiene honeypot + tiempo mínimo de llenado (8s) además del rate
limit. El flujo nuevo de editar/borrar por `token_publico` solo tiene el rate
limit genérico (`estado`, 6/10min) — no honeypot, no chequeo de tiempo.

**Por qué importa**: si un token se filtra (historial del navegador,
referrer, una captura compartida), la ruta que puede modificar o borrar ese
negocio queda con menos fricción anti-bot que la que se pensó necesaria para
crear el registro en primer lugar.

**Fix**: no es urgente — el rate limit de 6/10min ya acota el abuso masivo —
pero si se agrega, el mismo patrón de `registrarPortafolio.ts` se puede
reusar tal cual.

---

### 🟡 El chequeo de tiempo mínimo depende del reloj del cliente

**Dónde**: [`lib/actions/registrarPortafolio.ts:71-74`](../lib/actions/registrarPortafolio.ts),
`iniciadoEn` capturado en `FormularioRegistro.tsx:262`

```ts
Date.now() - iniciadoEn < 8000
```

`iniciadoEn` es un `Date.now()` tomado en el navegador al montar el
formulario. Si el reloj del dispositivo está adelantado respecto al del
servidor — nada raro en un celular mal configurado o sin NTP — la resta puede
dar negativa y el envío se rechaza con un genérico "No pudimos procesar el
registro", sin decir por qué.

**Fix**: medir el tiempo transcurrido con `performance.now()` (reloj
monótono, no depende de la hora del sistema) en vez de `Date.now()`, o
directamente medir el tiempo del lado del servidor desde que se sirvió el
formulario (requiere un token de sesión de formulario, más cambio).

---

### 🟡 Opción "otro" de `mayor_dolor` es inalcanzable

**Dónde**: [`app/(site)/aliados/registro/_components/FormularioRegistro.tsx:610-625`](../app/(site)/aliados/registro/_components/FormularioRegistro.tsx),
`OPCIONES_MAYOR_DOLOR` / columna `mayor_dolor_otro` en
[`lib/validation/portafolio.schema.ts`](../lib/validation/portafolio.schema.ts)

El schema define `'otro'` como opción válida y una columna
`mayor_dolor_otro` para el texto libre. La UI (`OPCIONES_MAYOR_DOLOR_UI`) no
tiene ese chip, y no hay ningún textbox para llenar la columna. Es una
funcionalidad a medio terminar: cualquier consulta que espere filas con
`mayor_dolor_otro` lleno siempre va a volver vacía.

**Fix**: agregar el chip "otro" + un `Campo` de texto condicional (mismo
patrón que ya usa `categoria_id` con "otra" en `Chips.tsx`/`SelectConOtro.tsx`).

---

### 🟡 `normalizarRedSocial` puede confundir un username con un dominio

**Dónde**: [`lib/validation/portafolio.schema.ts:76-82`](../lib/validation/portafolio.schema.ts)

```ts
sinArroba.toLowerCase().startsWith(dominio) // dominio = 'instagram.com'
```

Un username que empiece literalmente con `instagram.com` (ej.
`instagram.comedyclub`) pasa ese `startsWith` y la función devuelve
`https://instagram.comedyclub` en vez de
`https://instagram.com/instagram.comedyclub` — un link roto. Caso de borde
poco probable, pero real.

**Fix**: comparar contra un parseo con `new URL()` envuelto en try/catch, o
anclar el check con `startsWith('http://') || startsWith('https://')` en vez
de comparar contra el nombre del dominio pelado.

---

### 🟡 Accesibilidad: los `Chips` no llevan `id`/`aria-describedby`/`aria-invalid`

**Dónde**: `Chips.tsx` (nuevo) usado en `categoria_id`, `tipo_negocio`,
`horario`, `medios_pago`, `mayor_dolor` — ver
[`FormularioRegistro.tsx:573`](../app/(site)/aliados/registro/_components/FormularioRegistro.tsx)
en adelante

Todos los demás campos reciben `{...p}` desde `Campo` (que incluye `id`,
`aria-describedby`, `aria-invalid`). Los campos migrados a
`ChipsUnica`/`ChipsMultiple` no reciben esas props porque el componente no
las acepta — se perdió la asociación label↔control y el anuncio de error
para lectores de pantalla en justo los campos que antes las tenían.

**Fix**: que `Chips.tsx` acepte y reenvíe `id`/`aria-describedby`/`aria-invalid`
a cada `input[type=radio|checkbox]`, igual que el resto de los campos.

---

### ⚪ Descartado — sección "investigación" oculta

Un hallazgo inicial sospechó que el bloque de investigación (con
`tipo_negocio` y `mayor_dolor`, ambos requeridos por el schema) estaba
colapsado por defecto y etiquetado como opcional, lo que haría fallar el
envío en silencio para casi todos los usuarios. **Se verificó y es falso**:
el propio código dice por qué —
*"Se movió más arriba y ya no está colapsada: el cliente la quiere de las
primeras a responder, no algo que se descubre al final del formulario"*
(`FormularioRegistro.tsx:552-553`). La sección renderiza sin colapsar.

### ⚪ Descartado — campo "teléfono" fantasma en edición

Otro hallazgo sospechó que el formulario de editar-por-token seguía
mostrando un input `telefono` que el schema ya no persiste (falso éxito).
**Se verificó y es falso**: el formulario de edición no tiene ningún campo
`telefono` — se sacó del todo. Solo queda la columna en la base para
registros viejos, mostrada de solo lectura en la tarjeta pública y en la
ficha de moderación.

---

## 2. Seguridad

### 🟡 `hashIp` no anonimiza nada (SHA-256 sin sal sobre IPv4)

**Dónde**: [`lib/db/rateLimit.ts:126-129`](../lib/db/rateLimit.ts), escrito en
`aliados_consentimiento.ip_hash` desde
[`lib/actions/registrarPortafolio.ts:166`](../lib/actions/registrarPortafolio.ts)

```ts
createHash('sha256').update(ip).digest('hex')
```

La migración `011_aliados_consentimiento.sql` documenta esto como
protección de privacidad ("el hash no es reversible"). Es una afirmación
incorrecta: el espacio completo de direcciones IPv4 son ~4.300 millones de
valores — un ataque de fuerza bruta o una rainbow table precomputada invierte
cualquier hash SHA-256 sin sal sobre ese espacio en minutos. Cualquiera con
acceso de lectura a `aliados_consentimiento` puede desanonimizar cada
`ip_hash`, lo cual va en contra de la garantía que la Ley 1581 pide para
justificar guardar el dato sin banner de consentimiento explícito.

**Fix**: agregar un pepper del lado del servidor (variable de entorno, no en
el código) al hash: `sha256(ip + PEPPER)`. Sigue sin ser criptográficamente
perfecto para búsquedas de igualdad, pero cierra el ataque de fuerza bruta
offline mientras el pepper no se filtre.

### 🟡 `CRON_SECRET` se compara sin `timingSafeEqual`

**Dónde**: [`app/api/cron/purgar/route.ts:31`](../app/api/cron/purgar/route.ts)

```ts
request.headers.get('authorization') !== `Bearer ${secreto}`
```

El resto del proyecto ya tiene el patrón correcto en
`lib/auth/admin.ts` (`crypto.timingSafeEqual`), pero este endpoint usa
comparación de string plana. Explotar un ataque de timing contra una función
serverless en Vercel es difícil por el jitter de red, así que el riesgo
práctico es bajo — pero es la única comparación de secreto en el proyecto que
no sigue el patrón ya establecido.

**Fix**: reusar el mismo helper de `timingSafeEqual` que usa el login de
admin.

### ⚪ Confirmado seguro — todo lo demás

La pasada de seguridad dedicada (SQL injection, auth bypass, IDOR, CSRF, XSS,
inyección de fórmulas en CSV, migraciones 009-019) no encontró vulnerabilidades
de severidad alta. Puntualmente:

- Todas las queries van parametrizadas vía el `sql` tagged-template de Neon.
- Las server actions de admin (`moderarPortafolio`, `exportar`,
  `cron/purgar`) reverifican sesión/secreto del lado servidor, sin depender
  solo del guard de `layout.tsx`.
- El flujo de token (`/aliados/estado/[token]`) es un magic-link deliberado
  y bien acotado: `noindex`, `dynamic = 'force-dynamic'`, rate limit propio,
  UUID v4 no adivinable.
- Ninguna `.tsx` usa `dangerouslySetInnerHTML`, `eval` ni `new Function`.
- El CSV de exportación neutraliza inyección de fórmulas correctamente.
- `.env.example` no se pudo inspeccionar por permisos de la sesión — se
  recomienda una revisión manual rápida antes de mergear.

Ver `docs/seguridad.md` para el inventario completo (login, headers, purga,
CI) que ya estaba documentado antes de esta auditoría.

---

## 3. Duplicidad y sobre-ingeniería

Barrido completo del repo (no solo el diff). El código ya viene con
comentarios `ponytail:` explícitos justificando simplicidad deliberada — el
resultado es una lista corta.

| Qué cortar | Reemplazo | Dónde |
|---|---|---|
| `BARRIOS_COMUNA_3`, `OPCIONES_HORARIO_UI`, `OPCIONES_MEDIOS_PAGO_UI` copiadas literal entre registro y edición | Un módulo compartido (ej. `lib/opciones.ts`) importado por ambos — hoy son archivos "de solo lectura" entre sí a propósito, pero eso es exactamente el riesgo | `FormularioRegistro.tsx:32-64` y `EstadoAliado.tsx:22-54` |
| `ETIQUETA_HORARIO`/`ETIQUETA_MEDIO_PAGO` en la ficha de moderación reimplementan el mismo mapeo valor→etiqueta por tercera vez | Derivar el `Record` desde la misma lista de opciones de arriba | `FichaModeracion.tsx:46-59` |
| Regex de formato UUID escrito 3 veces | Un solo `RE_UUID` exportado (ya existe una copia reusable en `interacciones.repo.ts`) | `portafolios.repo.ts:108,380`, `interacciones.repo.ts:17` |
| `desdeFormData` y `desdeFormDataEdicion` casi idénticos, la segunda es subconjunto estricto de la primera | Una función genérica que extrae por lista de claves, o que la edición llame a la completa y descarte lo que no usa | `lib/validation/portafolio.schema.ts:188-267` |
| `claseInput` (mismo string de Tailwind) definido en 6 archivos distintos | Un export compartido — aceptable hoy con 2 copias, pero la tercera ya es señal de drift | `FormularioRegistro.tsx`, `SelectConOtro.tsx`, `EstadoAliado.tsx`, etc. |
| `Seccion`/`Campo`/`claseInput` (el "shell" completo del formulario, ~100 líneas) copiado entero en la página de edición | Extraer a `app/(site)/aliados/_components/FormularioCampos.tsx` e importar desde registro y desde edición | `EstadoAliado.tsx:73-172` vs `FormularioRegistro.tsx` |

**Balance estimado**: -40 a -60 líneas, 0 dependencias nuevas ni removidas.
Nada de esto es urgente — es mantenimiento, no riesgo — pero el patrón que
más vale cortar primero es el de las listas de opciones triplicadas, porque
ya generó una inconsistencia real (ver "otro" inalcanzable en la sección 1).

---

## Resumen ejecutivo

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | Links de Instagram/Facebook duplicados y rotos | 🔴 Alta | Por arreglar |
| 2 | Falla de foto no se avisa en ningún lado | 🔴 Alta | Por arreglar |
| 3 | `hashIp` sin sal no anonimiza IPs | 🟡 Media | Por arreglar |
| 4 | Anti-bot no cubre editar/borrar por token | 🟡 Media | Opcional |
| 5 | Tiempo mínimo anti-bot depende del reloj del cliente | 🟡 Media | Opcional |
| 6 | Opción "otro" de `mayor_dolor` inalcanzable | 🟡 Media | Por arreglar |
| 7 | `normalizarRedSocial` puede confundir username con dominio | 🟡 Baja | Opcional |
| 8 | `Chips` sin cableado de accesibilidad | 🟡 Media | Por arreglar |
| 9 | `CRON_SECRET` sin comparación de tiempo constante | 🟡 Baja | Opcional |
| 10 | Duplicidad de opciones/formularios (6 puntos) | 🔵 Limpieza | No urgente |

No se encontraron vulnerabilidades de severidad alta (SQL injection, auth
bypass, RCE, XSS). Los dos hallazgos 🔴 son bugs de producto, no de
seguridad: enlaces rotos y falta de feedback al usuario.

---

## Estado al 2026-08-25

Re-verificado contra el código, no contra la memoria. Se agrega acá en vez de
editar la tabla de arriba: la auditoría es un registro de un momento, y
reescribirla borraría el rastro de qué se encontró y cuándo.

| # | Estado | Evidencia |
|---|---|---|
| 1 | ✅ Cerrado | `TarjetaEmprendimiento.tsx` usa el valor guardado como `href` |
| 2 | ✅ Cerrado | `?foto=error` + aviso en `EstadoAliado.tsx` y `ModalRegistroExitoso.tsx` |
| 3 | ✅ Cerrado | pepper agregado y, desde hoy, fallando cerrado (`rateLimit.ts`) |
| 8 | ✅ Cerrado | `Chips.tsx` acepta y reenvía `aria-describedby`/`aria-invalid` |
| 9 | ✅ Cerrado | `timingSafeEqual` en `app/api/cron/purgar/route.ts` |
| 4, 5, 7, 10 | ⏸️ Abiertos | marcados "Opcional"/"No urgente", sin cambios |

**El hallazgo 6 se retira: el diagnóstico era incorrecto.** Decía que el schema
aceptaba `'otro'` en `mayor_dolor` y la UI no lo ofrecía. Hoy `OPCIONES_MAYOR_DOLOR`
(Zod) tiene exactamente las mismas 5 opciones que `OPCIONES_MAYOR_DOLOR_UI` — no
incluye `'otro'`. Aplicación y UI están de acuerdo.

**Y no hay decisión pendiente: el historial ya la contiene.** El commit 78710f9
dice que las preguntas 6 y 7 se reescribieron *"con el texto del cliente: la 6 se
acorta de 10 a 5 opciones"*. El recorte fue deliberado y del propio cliente.

Queda la pregunta de si limpiar el esquema, y la respuesta es **no**. Consultando
producción: dos filas de `aliados_investigacion` tienen `proveedores` en
`mayor_dolor` — respuestas reales, dadas antes del recorte. Una migración que
angoste el CHECK a los cinco valores actuales **falla contra esas filas**, y la
única forma de forzarla sería borrar respuestas de una investigación con
personas. La restricción amplia no es residuo: es lo que permite que la tabla
siga conteniendo lo que ya contiene.

`mayor_dolor_otro` sí está vacía (cero filas), pero borrarla obliga a tocar
producción para no ganar nada. Se deja documentada en el schema.

**Dato para el equipo, no para el código:** de 6 respuestas, 2 eligieron
`proveedores` — un tercio. El cuestionario actual ya no puede capturar eso.
Si el diagnóstico de proveedores importa, es una conversación con el cliente
sobre la pregunta 6, no un cambio técnico.
