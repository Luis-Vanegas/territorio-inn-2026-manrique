# AGENTS.md — territorio-inn-2026-manrique

Convenciones de código de este proyecto. Leé esto antes de tocar código.

## Mantenimiento de este archivo

Este archivo lo leen Claude Code Y Antigravity — es la fuente de verdad
compartida entre los dos. Si el código introduce un patrón nuevo, cambia uno
existente, o agrega/quita una dependencia relevante para las convenciones de
abajo, quien lo haga (Claude Code o Antigravity) actualiza este archivo en el
mismo cambio. No se deja para después: un AGENTS.md desactualizado hace que
ambos agentes repliquen un patrón que ya no existe.

## Stack

- Next.js 16 (App Router), React 18, TypeScript
- Tailwind CSS. Tipografía con rol cerrado (ver `DESIGN.md`): Fraunces títulos, DM Sans
  todo lo demás, DM Mono (`font-cifra`) SOLO la cifra grande de un indicador (fuentes y fechas van en DM Sans pequeña). Tokens de noche
  (`noche`, `sodio`, `estrella`…) solo para Firmamento y sus ventanas de noche. Una sola paleta, dos luces: `hueso`/`tinta` valen crema/azul noche en claro y azul noche/crema en oscuro (DESIGN.md › Color); ni blanco puro ni grises sueltos.
- Movimiento con `framer-motion`, sin excepciones. (`animejs` se usó solo para la
  Constelación viva de la puerta; se quitó el 4-oct-2026 junto con esa pieza: la puerta
  lleva una foto. No lo vuelvas a instalar.)
- Zod para validación de datos
- Neon (Postgres serverless) como base de datos
- Vercel Blob para almacenamiento de archivos (fotos)
- El asesor de formalización (`lib/agente/`) habla con un modelo de lenguaje
  por `fetch` al formato de OpenAI en `/chat/completions`, **sin SDK**. Los
  proveedores viven en `lib/agente/proveedores.ts` y se recorren en orden hasta
  que alguno responda: todos corren con plan gratuito y un plan gratuito se
  agota. Cada uno se prende con su clave (`Gemi_Api` — sí, se llama así en el
  entorno de este proyecto, no `GEMINI_API_KEY`; las variables distinguen
  mayúsculas —, `GROQ_API` — también sin el sufijo `_KEY` —,
  `OPENROUTER_API_KEY`, `NVIDIA_API_KEY` — NVIDIA NIM, la clave empieza con
  `nvapi-` y se saca gratis en build.nvidia.com —, `API_router` (Routeway)); el modelo y la URL se pueden
  pisar con `<PROVEEDOR>_MODELO` y `<PROVEEDOR>_API_URL`. No instales el SDK de
  ningún proveedor: ata el proyecto a ese proveedor justo donde la
  portabilidad es el requisito. La llamada sale solo desde una Server Action
  detrás del token del negocio, de `sesion_usuario` (botón flotante
  `components/AsesorFlotante.tsx`, que el layout del sitio monta solo con sesión
  de vecino o de moderador) o de `admin_session`, nunca desde una ruta pública
  ni para visitantes anónimos. Las tres puertas comparten pregunta
  (`lib/validation/asesor.schema.ts`) y cupo por IP (`lib/agente/limite.ts`).
- Geocoding de direcciones (botón "Ubicar en el mapa" del registro,
  `lib/geo/geocodificar.ts`) usa **Nominatim (OpenStreetMap) por `fetch`, sin
  SDK ni API key** — mismo criterio que el asesor: gratis, sin atarse a un
  proveedor pago. La llamada sale server-only (Nominatim exige un User-Agent
  identificable que un fetch de navegador no puede fijar) y pasa por el rate
  limit compartido de `lib/db/rateLimit.ts` con su propio origen
  (`geocodificar`). No instales `mapbox`, `@googlemaps/*` ni similares para
  esto — si Nominatim empieza a fallar como CARTO (ver comentario de
  `TESELAS` en `lib/geo/constantes.ts`), se reemplaza este único archivo.
- Ingreso de vecinos con **Google OAuth 2.0 a mano, sin NextAuth** (`lib/auth/
  google.ts`): la sesión firmada ya existía en `admin.ts` y una librería
  dejaría dos sistemas de sesión conviviendo. Con PKCE (`S256`). La identidad
  es `google_sub`, **nunca el correo** — ver `docs/seguridad.md`.
- Node >= 20.9.0 — el paquete es ESM (`"type": "module"` en package.json).
  No hay ningún `.js` en el repo: config y scripts son `.mjs`, el resto `.ts`/`.tsx`.
  Si agregás un archivo `.js`, va a interpretarse como ESM, no como CommonJS.

## Idioma del código

Todo el texto visible al usuario (labels, placeholders, mensajes de error,
páginas legales, confirm dialogs) va en **español colombiano, registro
"tú"** — nunca voseo ("vos", "podés", "tenés", "contanos"). Es un sitio para
vecinos de la Comuna 3 en Medellín, no suena bien en rioplatense ni en paisa
informal. Si escribís una frase nueva y dudás, usá la conjugación de "tú"
(puedes, tienes, quieres, haces) y listo.

Esto lo verifica `scripts/verificar-voseo.mjs`, que corre dentro de
`npm run verificar` y falla si encuentra voseo en texto visible. **Correlo en
vez de revisar a ojo**: el voseo se coló tres veces y las tres alguien había
"verificado a mano" con una lista de verbos escrita de memoria. El script
busca el patrón —tilde en la última sílaba, que es lo que distingue al voseo
del "tú"— y no una lista, así que encuentra formas que nadie previó. Si marca
un falso positivo (un pretérito como «aprendí», o «estás», que se escribe
igual en los dos registros), se agrega a `CORRIENTES` con un comentario.

Los comentarios de código quedan en rioplatense a propósito: los lee el
equipo, no los vecinos. El script los ignora.

Todo el código de dominio va en **español**: nombres de funciones, tipos,
variables, rutas de `app/`, mensajes de error al usuario. Ejemplos reales:
`registrarPeticion`, `crearPeticion`, `marcarAtendida`, `EstadoPeticion`,
rutas como `app/(firmamento)/firmamento/negocio/registro`. No traducir esto al inglés al
agregar código nuevo — seguí el patrón existente.

## Estructura de carpetas

```
app/
  (site)/           route group del sitio público (aliados, servicios, contacto, legal)
  (firmamento)/firmamento/   Firmamento con sesión: `entrar` (puerta de 3 pestañas) y los
                    paneles `negocio/`, `equipo/`, `entidad/`, cada uno con su `layout.tsx`
                    (guarda + `PanelShell`). `/firmamento` a secas NO es una página:
                    redirige a `/` (los datos públicos viven en el inicio) desde
                    `next.config.mjs`; no crees un `page.tsx` ahí. El panel de
                    moderación vive en `equipo/` (ya no hay `app/admin`: `/admin/*`
                    redirige desde `next.config.mjs`).
  api/              route handlers (cron, exportar, interacciones)
  <ruta>/_components/  componentes usados solo por esa ruta
components/         componentes compartidos entre rutas; `registro/` (formulario de registro
                    de las dos puertas + `VistaPreviaEnVivo`), `vitrina/` (tarjeta pública)
lib/
  actions/          Server Actions ('use server'), un archivo por acción
  registro/          `guardar.ts`: el registro compartido por las dos puertas (server-only, no es action)
  db/                repositorios de acceso a datos (*.repo.ts), uno por tabla/dominio
  validation/        schemas de Zod (*.schema.ts)
  geo/                utilidades geoespaciales (comuna, barrios oficiales, punto en polígono)
  auth/               sesiones: admin.ts (moderadores), usuario.ts (vecinos), google.ts (OAuth);
                      secreto.ts compara secretos compartidos de endpoints de máquina
  blob/               integración con Vercel Blob
  agente/             asesor de formalización (prompt y llamada al modelo)
  ml/                 inferencia en el navegador (categoria.ts: sugeridor de categoría)
  privacidad/         regla k = 5 (kAnonimato.ts), pura y sin server-only
.github/workflows/   vigía de convocatorias (único workflow; no hay CI de verificación)
scripts/             scripts de mantenimiento (migraciones, verificación, admin)
pipeline/            Python reproducible (OSM, HDBSCAN, clasificador, vigía); su propio
                     requirements.txt y venv. Escribe solo en public/firmamento/ y
                     public/modelo_categoria.json. Ver pipeline/README.md
data/                datasets fuente (DANE, cámara de comercio, etc.) — no tocar sin pedir
```

## Patrones a seguir

- **Server Actions** (`lib/actions/*.ts`): empiezan con `'use server'`, reciben
  `FormData` o argumentos tipados, devuelven un discriminated union de estado
  (`{ estado: 'inicial' | 'ok' | 'error', ... }`). Ver `lib/actions/registrarPeticion.ts`.
- **Repos** (`lib/db/*.repo.ts`): empiezan con `import 'server-only'`, usan el
  tagged template `sql` de `lib/db/neon.ts`. Un repo por tabla/dominio. No usar
  ORM — SQL crudo vía template strings parametrizados.
- **Validación**: todo input externo pasa por un schema de Zod en
  `lib/validation/` antes de tocar la base de datos.
- **Rate limiting**: los endpoints públicos sin auth comparten el límite de
  `lib/db/rateLimit.ts` a propósito — no crear un límite nuevo por endpoint
  salvo que el volumen lo justifique. Excepción: `/api/interacciones` (se
  dispara en cada página vista) usa `lib/limiteMemoria.ts`, un contador en
  memoria sin base de datos, porque el límite de Postgres escribe una fila por
  llamada y duplicaría las escrituras justo ahí.
- **Caché de lecturas públicas**: `listarAprobados`, `listarCategorias`,
  `contarAprobadosPorCategoria` y `listarTodosLosCampos` van envueltas en
  `cachearVitrina()` (`lib/db/cache.ts`, `unstable_cache` con etiqueta). Toda
  Server Action que escriba en portafolios, categorías o campos personalizados
  DEBE llamar `invalidarVitrina()`; si no, lo público queda viejo hasta 10
  minutos. Lo que vuelve de la caché es JSON: nada de columnas `Date` ahí.
- **Datos abiertos y regla k = 5** (`GET /api/datos`, `lib/db/datos.repo.ts`):
  solo negocios `aprobado` y solo conteos. Toda celda pasa por
  `lib/privacidad/kAnonimato.ts`: menos de 5 sale como `"<5"` (los ceros
  también), y en las particiones con total publicado (categorías, barrios) si
  queda escondida UNA sola celda se esconde también la menor visible, porque si
  no se deduce restando del total. Cada dimensión lista TODAS sus opciones: que
  una falte diría que vale cero. Nunca salen: nombres de negocios, contactos
  (WhatsApp, teléfono, correo, redes), direcciones, coordenadas, fotos, tokens,
  IP, `google_sub`, `campos_extra`, respuestas individuales de investigación
  (solo conteos de las enumeraciones `formalidad` y `mayor_dolor`). Una
  dimensión nueva = consulta nueva en el repo (sin columnas personales: el
  verificador lee el archivo) + `suprimir()`. Caché de 1 h (`unstable_cache`
  sin la etiqueta de la vitrina), CORS `*`, rate limit de `rateLimit.ts` con
  origen propio `datos`. `scripts/verificar-datos-k.mjs` lo comprueba (y contra
  un servidor vivo con `VERIFICAR_URL_DATOS=http://localhost:3000/api/datos`).
- **Ubicación dentro de la Comuna 3** (`lib/geo/dentroDeManrique.ts`): función
  pura (ray casting sobre `manrique.json`, sin `server-only`, con 40 m de
  tolerancia al borde por el GPS y la simplificación del polígono). La exige el
  schema de `portafolio.schema.ts` en registro (propio y asistido) y en las dos
  ediciones (dueño por token y moderador) con `ubicacionEnManrique`, y la usa el
  selector del registro para avisar en vivo sin bloquear el arrastre. Un
  schema nuevo que reciba coordenadas de negocios debe pasar por ese refinamiento
  (aplicarlo DESPUÉS de `.omit()`). Moderar (aprobar/rechazar) no valida el
  punto; editar un negocio fuera del polígono obliga a corregirlo. Lo comprueba
  `scripts/verificar-geo.mjs` (corre con `--experimental-strip-types`).
- **Sugeridor de categoría** (`lib/ml/categoria.ts`): TF-IDF de n-gramas + regresión
  logística exportados a `public/modelo_categoria.json` (los genera
  `pipeline/03_clasificador.py`), inferencia en el NAVEGADOR: lo que la persona
  escribe en el nombre no sale de su pantalla. Con confianza >= 0,45 sugiere una;
  si no, las 3 mejores (`sugerirCategoria`). Replica a `pipeline/verificar_salidas.py`:
  al reentrenar hay que regenerar los casos de `scripts/verificar-sugeridor.mjs`. Ciclo de aprendizaje: `node scripts/exportar-ejemplos-entrenamiento.mjs` (fichas aprobadas, nombre + descripción + categoría final, sin datos personales → `pipeline/datos/ejemplos_constelaciones.json`, ignorado por git) → `03_clasificador.py` los suma (peso 5) y solo publica con 30 o más fichas propias (`MIN_PROPIOS`; con 5 el modelo las memorizaba) y si el F1 macro del holdout de OSM no baja → `exportar-evaluacion-modelo.mjs` y `verificar_salidas.py`; comandos en `pipeline/README.md`. Clases escasas: `pipeline/06_ampliacion_clases.py` baja de OSM en Colombia locales reales de esa clase (hoy diseño/publicidad) que `03_clasificador.py` suma SOLO al entrenamiento (nunca al holdout; descarta nombres del Valle). Nunca se agregan filas escritas a mano a los CSV de OSM. El texto de entrenamiento de una ficha es `nombre + ' ' + descripción`, igual que lo que lee la moderación.
  En el registro lo monta `SugeridorCategoria.tsx` bajo «Nombre del negocio»
  (aria-live polite; ≥ 0,45 «Usar esta», si no las 3 mejores). Lo único que
  viaja al enviar son dos campos ocultos (`sugerencia_categoria`,
  `sugerencia_confianza`); `registrarPortafolio` los lee con
  `sugerenciaDesdeFormData` y guarda en `sugerencias_categoria` la categoría
  inferida, su confianza y si la aceptó (`aceptada` = la `categoria_id` enviada
  coincide) y, desde la 033, el `portafolio_id` (para reentrenar con la
  categoría final de la ficha), NUNCA el texto escrito. Es telemetría: si falla no tumba el
  registro. El archivo no lleva `server-only` ni imports de valor, para que el
  verificador lo importe.
- **Sugeridor en la moderación** (`SugeridorModeracion.tsx` en
  `equipo/moderacion/_components/`): el mismo modelo corre en el navegador del
  equipo sobre nombre + descripción + `categoria_otra`, en cada registro
  pendiente (`FichaModeracion`) y en cada alerta de «Otros». Un clic: «Usar «X»»,
  «Mantener» o el selector «Corregir a mano»; si la propuesta ya es la actual,
  solo «Correcta ✓». Lo decide `decidirCategoria` (`lib/actions/`, recibe un
  objeto tipado, Zod `decisionCategoriaSchema`, revalida `admin_session`), que
  llama `decidirCategoriaFicha` (`portafolios.repo.ts`): cambia la categoría Y
  guarda el ejemplo en `sugerencias_categoria` (origen `moderacion`,
  `decision_equipo` usada/corregida/mantenida, migración 034) en UNA sentencia,
  solo si la categoría sigue siendo la que vio la pantalla. Al salir de «Otros»
  borra `categoria_otra`. Bitácora `categoria_corregida` / `categoria_mantenida`
  e `invalidarVitrina()` si cambió. Viajan ids y confianza, NUNCA el texto. El
  ejemplo de reentrenamiento es `portafolios.nombre` + `portafolios.categoria_id`
  de las filas con `portafolio_id` (ver docs/base-de-datos.md › 034). Una ficha
  con decisión del equipo (`fichasConCategoriaRevisada`) ya no muestra los
  botones: otro clic no es otro ejemplo.
- **Campos personalizados públicos**: un campo de `definiciones_campo` solo sale en
  la vitrina si tiene `publico = true` (default `false`, migración 032). El filtro
  vive en el SQL de `portafolios.repo.ts` (`COLUMNAS_PUBLICAS`), no en el
  componente: el dueño y el panel leen `COLUMNAS_PROPIAS` (todo). El
  moderador lo prende en `/firmamento/equipo/campos` (interruptor por fila →
  `cambiarPublicoCampoAction`, con Zod e `invalidarVitrina()`); `publico` es
  una decisión de privacidad y por eso NO viaja en `editarCampo`.
- **Endpoints de máquina** (`/api/cron/purgar`, `/api/ingesta/convocatorias`):
  secreto en variable de entorno (`CRON_SECRET`, `INGESTA_SECRETO`), comparado con
  `secretoValido` de `lib/auth/secreto.ts`; sin la variable fallan CERRADOS (503),
  con el header mal responden 401. Lo que entra por ahí es texto de terceros:
  Zod y siempre `pendiente` (el vigía de convocatorias no publica nada).
- **IP**: `ip_registro` se guarda en claro 30 días (`DIAS_IP_EN_CLARO`) y el cron
  diario la anula (`purgarIpsViejas`); para auditoría queda `ip_hash` en
  `aliados_consentimiento`. La política de datos lo declara: si cambia el plazo,
  cambia el texto y se sube `VERSION_TERMINOS`.
- **Búsqueda de negocios**: una sola función, `buscarNegocios` de
  `lib/busqueda.ts` (puntaje por campo + sinónimos del barrio, en el cliente),
  la usan el buscador de la portada y la vitrina de `/aliados`. No escribir
  otro filtro de texto por componente. Los comercios de OSM sin nombre
  (`nombre: null`) NO entran al buscador ni a «Otros comercios»: los saca
  `comerciosConNombre` (`lib/geo/comerciosOsm.ts`), único lugar de esa condición;
  el mapa sí los dibuja y su título de respaldo es `nombreVisible`. Busca también por dirección (con
  «cra», «cl», «kr»…) y atiende a los **comercios de OpenStreetMap**: se
  normalizan con `aBuscable` (`lib/geo/comerciosOsm.ts`, `origen: 'osm'`) y
  se mezclan en la misma lista; ante empate van primero los aliados. El JSON de
  constelaciones se pide por `fetch` (`useConstelaciones`) solo cuando hace
  falta (el buscador de la portada, al enfocar la caja). Los textos de OSM
  (horario, cocina, categoría) se traducen en ese mismo archivo: nunca se
  muestran crudos. Los sinónimos se amplían en `SINONIMOS`
  y se prueban con `scripts/verificar-busqueda.mjs`.
- **Módulos de guías** (Marca, Ventas y los que vengan para aliados): son
  datos, no componentes. Cada módulo es una `Coleccion` (`lib/marca.ts`) en su
  propio archivo (`lib/ventas.ts`), con sus láminas en `public/<modulo>/laminas/`.
  `IndiceMarca`, `GuiaMarca` y `PuertaRegistro` (`components/marca/`) reciben la
  colección por prop. Un módulo nuevo = archivo de datos + `app/(site)/<modulo>/`
  y `app/(firmamento)/firmamento/equipo/<modulo>/` (copiar los de ventas, con `incrustado`) + entrada en
  `lib/content.ts`, `app/sitemap.ts`, el menú del panel y la lista de
  `scripts/verificar-marca.mjs`. Ojo: el archivo de datos importa de `./marca`
  SOLO tipos (`import type`); ver «Imports con extensión `.ts`» más abajo.
- **Mis clientes (CRM de cada aliado)**: `lib/db/clientes.repo.ts` guarda datos
  de TERCEROS (los clientes del negocio, que no se registraron acá). Toda
  consulta cruza con `portafolios` y filtra `p.usuario_id = ${usuarioId}` de la
  sesión: los ids del formulario se pueden inventar. `scripts/verificar-clientes.mjs`
  falla si una consulta nueva lo olvida (revisa también `lib/db/cuenta.repo.ts`,
  que alimenta el panel del negocio: categoría y formalidad para «Para ti», semanas de vistas y
  contactos, comparación con la categoría; una consulta nueva del panel va en ese archivo y con ese filtro).
  Lo mínimo por Ley 1581: nombre, teléfono y nota; nada de cédula, dirección ni
  correo. El contacto sale por
  WhatsApp (`enlaceWhatsapp` + `?text=`), sin proveedor de correo.
- **Dos poblaciones, dos cookies**: `admin_session` (moderadores, 8 h) y
  `sesion_usuario` (vecinos, 14 días; con prefijo `__Host-` en producción).
  Cookies separadas a propósito: con una sola, un campo "rol" adentro sería lo
  único entre un vecino y el panel de moderación. No las unifiques. OJO: las dos
  se firman con el MISMO secreto y formato, así que cada verificador exige los
  campos de SU payload (`verificarSesion`: `email` string; `sesionActual`: `id`
  string). Sin eso, la cookie de un vecino pegada como `admin_session` abría el
  panel (corregido en la 035; lo vigila `scripts/verificar-accesos.mjs`).
  `verificarSesion` además lee `admins.activo` (con `cache`): desactivar a un
  moderador le quita el panel en su siguiente petición, aunque su cookie siga viva.
- **Accesos** (migración 035, `docs/seguridad.md` › Accesos): nadie gana acceso
  por coincidir un correo. Tres caminos, todos desde el panel del equipo:
  (1) **dueño de un negocio**: «Cuenta y acceso» en cada ficha de `equipo/aliados`
  (`vincularCuenta.ts` → `accesos.repo.ts`): el moderador elige una cuenta EXISTENTE
  (`<datalist>` de `usuarios`), reasignar exige confirmación y el candado está en el
  `where`; bitácora `negocio_vinculado`/`negocio_desvinculado`. «Enviar acceso» manda
  por WhatsApp `/aliados/estado/<token>`, que ofrece «Continuar con Google» y vincula
  al volver. (2) **invitaciones** (`invitaciones.repo.ts`, `components/firmamento/
  Invitaciones.tsx`): enlace `/firmamento/invitacion/<token>` de un solo uso, 7 días,
  revocable; en la base solo el sha256 (`lib/auth/invitacion.ts`); el enlace se
  muestra UNA vez y nunca va a un log. Se consume en el retorno de Google en UNA
  sentencia (CTE: marcar usada + `miembros_entidad` o `admins`). (3) **moderadores**
  (`equipo/moderadores`): por invitación (`admins.google_sub`); `ADMIN_GOOGLE_SUBS`
  queda de respaldo (`accesoModeradorGoogle` en `lib/auth/admin.ts` consulta las dos);
  «Quitar acceso» = `activo = false`, nunca a uno mismo ni al último (serializable).
  Lo que viaja a través de Google (destino, negocio a vincular, invitación) va en
  cookies `oauth_*` de un solo uso: Google devuelve SOLO `code` y `state`, un
  `?vincular=` en la URI de retorno se pierde.
- **Guardas verificadas**: `scripts/verificar-accesos.mjs` falla si una
  `page.tsx`/`layout.tsx`/`route.ts` de `firmamento/{negocio,equipo,entidad}` no llama
  la guarda de su rol, si una Server Action exportada no revalida la sesión en su
  cuerpo, o si una ruta de `app/api/admin` no llama `verificarSesion`. Una página o
  action pública a propósito va en su lista (`PUBLICAS` / `ACCIONES_PUBLICAS`) con
  la razón.
- **Firmamento con sesión** (`app/(firmamento)/firmamento/`, plan en
  `docs/firmamento-modulos.md`): tres roles, dos cookies. Guardas en
  `lib/auth/firmamento.ts` (`exigirNegocio` = `sesion_usuario`; `exigirEquipo` =
  `admin_session`; `exigirEntidad` = `sesion_usuario` + membresía vía `entidadDeSesion`
  de `lib/auth/entidad.ts`, que lee `miembros_entidad` por el `usuario_id` de la
  sesión con `cache` de React). Un layout NO basta (no se re-ejecuta al navegar entre hermanas): la
  guarda va en el layout del rol Y en cada `page.tsx`, junto a la lectura de datos,
  y cada action/repo revalida. La navegación es DATOS (`lib/firmamento/navegacion.ts`,
  un arreglo por rol); una sección nueva = entrada ahí + carpeta
  `<rol>/<seccion>/page.tsx`. Mientras no exista la carpeta, `<rol>/[...resto]/page.tsx`
  muestra «En construcción» (y 404 si la ruta no está en el menú). El armazón es
  `components/firmamento/panel/PanelShell.tsx`; las insignias del menú son una prop
  (`insignias` por `href`). La puerta devuelve a una ruta interna con `?destino=` en
  `/api/auth/google/iniciar` (cookie `oauth_destino`, validada con `rutaInterna` de
  `lib/auth/destino.ts` al guardar y al leer; la comprueba `scripts/verificar-destino.mjs`).
  El login del equipo reutiliza `iniciarSesion` de `sesionAdmin.ts` con un campo
  oculto `destino`.
- **Panel del equipo** (`/firmamento/equipo`, antes `/admin`): las lecturas propias del
  panel (insignias, insumo de alertas y territorio, cambios de los dueños, aprendizaje del
  sugeridor, alcance de una convocatoria) van en `lib/db/equipo.repo.ts`. Las alertas de
  calidad NO se guardan: `alertasDeCalidad` (`lib/firmamento/calidad.ts`) las calcula al
  vuelo con `dentroDeManrique`/`metrosAlBorde`, `barrio_oficial ?? barrioDe` y la categoría
  `otros` (la propuesta del sugeridor corre en el navegador). `?ficha=<id>` en
  `equipo/aliados` abre una ficha en su pestaña con la edición abierta: es el destino de
  «Cambios recientes» y de las alertas. Los CSV del panel (aliados, interacciones, plan de
  brigada, datos abiertos) salen de `/api/admin/exportar?conjunto=` (guarda propia).
  Entidades y miembros: `lib/actions/gestionarEntidades.ts`; un miembro se agrega por el
  correo de una cuenta que ya entró con Google (no se crean usuarios). Las actions que
  cambian algo del panel revalidan `revalidatePath('/firmamento/equipo', 'layout')` para
  que las insignias se actualicen. Menú (`components/firmamento/panel/NavPanel.tsx`):
  lateral fijo desde `lg` (`NavLateral`) y, bajo `lg`, botón ☰ que abre la misma lista en
  un cajón (`NavMovil`). Los ítems con `pestana` van bajo ese encabezado (`gruposDe`).
  Solo los paneles con sesión llevan este menú: el sitio público NO.
  Estilo (Ola 2b): el panel es de día; la noche solo entra en `VentanaNoche` (cifras, mapas, F1 y
  matriz), nunca con tokens `estrella`/`tenue`/`sodio` sueltos en una página. Resumen = cifras
  (por revisar, alertas, convocatorias, invitaciones) + cambios de los dueños + bloques plegables;
  `AprendizajeSugeridor` (`components/firmamento/panel/`) es la única vista de las decisiones del
  sugeridor (registro y moderación: usó/corrigió/mantuvo). **Centralidades del POT**: capa interna
  solo de `equipo/territorio` (`MapaTerritorio` → `MapaEstelar` → `MapaAliados` prop `centralidades`,
  interruptor apagado de entrada, contorno discontinuo con nombre); el JSON se importa solo en esa
  página y ninguna ruta pública la pasa (licencia pendiente). Las cifras de un `Kpi` pintan el cero
  en DM Sans (`CifraLimpia`: el cero de DM Mono lee «Ø»).
- **Panel del negocio** (`/firmamento/negocio/{,ficha,para-ti,constelacion,clientes}`, antes
  `/mi-cuenta`, que redirige en `next.config.mjs`): cada page llama `exigirNegocio()` (devuelve
  `usuarioId`) y lee con `negocioActivo(usuarioId)` (`lib/firmamento/negocio.ts`): el negocio activo
  sale de la cookie `negocio_activo` (solo preferencia; se valida contra los negocios de la sesión en
  cada lectura; la fija `elegirNegocio`). Cifras del inicio: 8 semanas de `interacciones_portafolio`
  (`semanasDeNegocio`) y cuentas puras en `lib/firmamento/ficha.ts` (completitud de la ficha en 8 pasos,
  variación contra las 4 semanas anteriores). La comparación con la categoría
  (`comparacionCategoria`) devuelve null con menos de 5 negocios (k = 5) y en «Otros». Posibles
  alianzas: `lib/firmamento/alianzas.ts`, una tabla simétrica de rubros complementarios (ropa↔modistería,
  comidas↔panadería…); mismo rubro nunca es alianza; se amplía agregando una pareja. `/mi-cuenta` ya no
  existe: el destino tras Google es `/firmamento/negocio`. `/entrar` ya no existe: redirige a
  `/firmamento/entrar` (una sola puerta; el enlace personal `/aliados/estado/<token>` sigue
  funcionando solo). `constelaciones.json` también se importa en el servidor en
  `lib/firmamento/entorno.ts` (`server-only`): `entornoDeNegocio(portafolio, aprobados)` es la ÚNICA
  cuenta de «qué hay cerca» de un negocio (su constelación o la más cercana, aliados aprobados a menos de
  1,5 km, comercios de OSM de su grupo, constelaciones cercanas y lo que se dibuja: aprobados + el propio
  sin WhatsApp). La usan «Dónde estás» del inicio (`negocio/_components/DondeEstas.tsx`: `MapaAliados`
  acercado al punto con `seleccionado`, texto con las mismas cifras y botón a «Mi constelación») y
  `negocio/constelacion/page.tsx`; no recalcules eso en una página.
- **Dos puertas, una ficha**: un negocio entra por cuenta de Google
  (`usuarios.id` en `portafolios.usuario_id`) o por el enlace con
  `token_publico` — para quien registramos en campo y no maneja tecnología.
  `origen_registro` distingue `propio` de `asistido`; es una columna, no otra
  tabla. Un registro `asistido` EXIGE `consentimiento_asistido` y
  `capturado_por` por restricción de base: Ley 1581 de 2012, el consentimiento
  lo da el titular y hay que poder demostrar cómo. **La edición del dueño de una ficha APROBADA publica
  directo** (sigue `aprobado`, invalida la vitrina y deja fila en `bitacora`), por las dos puertas: la
  cuenta (`actualizarFichaDeCuenta`) resuelve el token con `tokenPropio` y usa el mismo
  `actualizarPorToken`. Pendiente sigue pendiente; rechazada vuelve a pendiente; archivada no se edita.
  **El registro vive en Firmamento, no en el sitio público** (`/aliados/registro` redirige en
  `next.config.mjs`). Un solo formulario (`components/registro/FormularioRegistro.tsx`, prop `modo`) y un
  solo núcleo (`guardarRegistro` de `lib/registro/guardar.ts`: Zod, `ubicacionEnManrique`, fotos,
  consentimiento, investigación, sugeridor, bitácora, campos personalizados). Dos actions finas:
  `registrarPortafolio` (`/firmamento/negocio/registro`, `sesionActual()` obligatoria; `usuario_id` sale
  de la sesión, NUNCA del formulario; `propio`, con cupo de `rateLimit.ts`; redirige a
  `/firmamento/negocio?registrado=1` con ese negocio activo) y `registrarAsistido`
  (`/firmamento/equipo/registro`, `verificarSesion()`; `capturado_por` = correo de `admin_session`,
  `consentimiento_asistido` de Zod; sin cupo por IP: el equipo registra varios seguidos; devuelve el
  enlace personal para «Enviar acceso» con `CompartirEnlace`). Sin sesión, la guarda de la página manda a
  `/firmamento/entrar?rol=negocio&destino=…`: por eso el layout del negocio NO redirige sin sesión (no
  conoce la ruta) y deja que mande la guarda de cada `page.tsx`. La puerta pasa `destino` (solo
  `/firmamento/negocio…`, validado con `rutaInterna`) al botón de Google.
  **Conexión con Constelaciones**: `hrefFichaPublica` (`/aliados?q=<nombre>#<id>`: no hay ruta por
  negocio; la búsqueda la deja primera y pintada) alimenta «Mi ficha pública ↗» de `PanelShell`
  (`hrefSitio = null` → «Aún no se ve en Constelaciones», sin enlace). La vista previa «Así te verán en
  Constelaciones» es la tarjeta REAL de la vitrina (`components/vitrina/TarjetaEmprendimiento.tsx`,
  prop `vistaPrevia`: sin ancla ni conteo) dentro de `VistaPreviaEnVivo`, que envuelve el formulario sin
  volverlo controlado (relee el `<form>` en cada evento). No escribas otra tarjeta de vista previa.
- **RLS no se usa acá y no hace falta**: el navegador nunca habla con Postgres.
  Toda consulta sale de una Server Action o de un Server Component, que ya
  saben quién es el usuario por su sesión. El control de acceso va en el
  `where` del repo, no en políticas de fila.
- **Convocatorias** (`lib/db/convocatorias.repo.ts`, migraciones 032 y 033): el
  vigía las ingesta `pendiente`; el moderador decide en `/firmamento/equipo/convocatorias`
  (`moderarConvocatoria`: aprobar, descartar/retirar, marcar vencida, con quién y
  cuándo). Las transiciones válidas viven en el `where` de `decidirConvocatoria`
  (una descartada no se reabre; una ya cerrada no se aprueba), no en la
  pantalla. La entidad es `entidad_id` (FK a `entidades`): la ingesta manda el
  NOMBRE y `resolverEntidadOferente` (`entidades.repo.ts`) lo busca y, si no
  existe, lo crea como `oferente` (sin miembros: no da acceso a nada). El nombre
  de `pipeline/fuentes_convocatorias.json` tiene que ser idéntico al sembrado en
  la 033, o nace una entidad duplicada. A quién aplica lo elige el moderador AL
  APROBAR: `convocatoria_categorias` (ninguna fila = todas) y `aplica_formalidad`
  (vacío = cualquiera), escritos en la misma sentencia que el cambio de estado.
  Solo las `aprobada` y vigentes salen, y únicamente en «Para ti» del panel del negocio
  (`convocatoriasParaTi` con `perfilesParaTi` de `cuenta.repo.ts`): cruza
  NEGOCIO POR NEGOCIO categoría y formalidad (`aliados_investigacion`); formalidad
  desconocida (null o `prefiero_no_decir`) ve también las restringidas. No van en
  la vitrina: no llaman `invalidarVitrina()`.
- **Barrio oficial de un negocio** (`portafolios.barrio_oficial`, FK a `barrios`,
  migración 033): lo calcula `portafolios.repo.ts` con `barrioDe` en las tres
  escrituras con coordenadas (`crearPortafolio`, `actualizarPorToken`,
  `editarComoModerador`), no la acción: una puerta nueva no puede olvidarlo.
  `barrio` es lo que dice la persona; `barrio_oficial`, lo que dice el punto
  (null = fuera de los 15). Las filas viejas se rellenan con
  `scripts/rellenar-barrio-oficial.mjs` (idempotente, `--seco` para contar).
- **Bitácora** (`lib/db/bitacora.repo.ts`, tabla `bitacora`, 033): toda acción que
  cambia un negocio o una convocatoria llama `registrarEnBitacora` (registro,
  ediciones, aprobar/rechazar/archivar, decisiones de convocatoria). Guarda
  NOMBRES de campos, NUNCA valores (un WhatsApp viejo ahí sería un dato personal
  duplicado). Las ediciones devuelven los campos cambiados desde el propio
  `update` (`CAMPOS_CAMBIADOS`: `previo` vs `p` en el `returning`); foto y menú
  se suman con `camposConArchivos`. Si el moderador cambia la categoría la
  acción es `categoria_corregida` (señal para reentrenar el sugeridor).
  `registrarEnBitacora` NUNCA lanza: si falla, loguea y la acción sigue.
  Lee: el equipo todo; el negocio solo su ficha; la entidad nada.
- **Entidades** (`lib/db/entidades.repo.ts`, `entidades` + `miembros_entidad`, 033):
  una tabla para las territoriales (JAL, CEDEZO, CVS) y las oferentes (SENA,
  Bancóldex…). Lo que da acceso al panel es la fila en `miembros_entidad`
  (`entidadesDeUsuario(usuarioId)` con el id de `sesion_usuario`), no el tipo ni
  un rol en la cookie. Los miembros se agregan por correo de una cuenta que YA
  entró con Google (`agregarMiembroPorCorreo`; no crea usuarios). Una entidad
  NUNCA lee `portafolios` fila por fila: solo agregados k = 5
  (`obtenerDatosAbiertos`). `scripts/verificar-entidades.mjs` falla si una
  consulta de `entidades.repo.ts` nombra una tabla de negocios.
- **Constelación de un aliado**: no se guarda (la columna `portafolios.constelacion`
  se borró en la 033), se calcula al vuelo con `constelacionDe` /
  `vecinosDeConstelacion` (`lib/geo/comerciosOsm.ts`): centroide más cercano y
  dentro de su `radio_p90_m`, si no `null` y la ficha no muestra la sección.
  Los comercios que lista son de OSM, con la etiqueta «OpenStreetMap · no es
  aliado». Un id guardado quedaría colgando al regenerar el JSON.
- **Endpoints de máquina sin IP**: `verificarLimite` deja pasar cuando no hay IP,
  así que quien quita los headers se saltaría el cupo. `/api/ingesta/convocatorias`
  suma un contador en memoria compartido para esas peticiones
  (`lib/limiteMemoria.ts`), y si `verificarLimite` falla responde 503, no 500. Desde
  la 036 esa puerta es UNA sola, `puertaIngesta` (`lib/auth/puertaIngesta.ts`: 503 sin
  `INGESTA_SECRETO`, cupo, 401, y `leerJsonAcotado` para el tope de bytes); los dos
  endpoints de `/api/ingesta/*` la llaman y ninguno compara el secreto por su cuenta.
- **Vigía vivo** (migración 036, `lib/db/vigia.repo.ts`, `POST /api/ingesta/vigia`): al final
  de cada corrida `04_vigia_convocatorias.py` manda UN informe con el estado de cada fuente
  (`responde`, `error_http`, `timeout`, `bloqueada_robots`, código HTTP, huella sha256 de los
  enlaces de la página, candidatas, nuevas). Zod estricto (`vigia.schema.ts`; texto de
  terceros) y el mismo secreto y puerta que la ingesta. El pipeline NO guarda estado (el
  runner de Actions nace limpio): `registrarCorrida` compara la huella con la última de esa
  `fuente_id` y escribe `cambio` / `sin_cambio` en UNA sentencia con CTE; los totales los
  calcula el repo, no el informe. La llave de una fuente es su `id` slug en
  `pipeline/fuentes_convocatorias.json` (no lo cambies: es el historial). Se lee SOLO en el
  panel del equipo (Convocatorias › «Fuentes del vigía», `leerVigiaEquipo` de
  `lib/firmamento/vigia.ts`, que cruza el JSON de fuentes con la última corrida; una fuente
  nueva sin informe sale «Sin informe aún»). No va en páginas públicas
  (`scripts/verificar-vigia.mjs` lo comprueba). Para probar fallos sin tocar el JSON real:
  `python pipeline/04_vigia_convocatorias.py --fuentes otro.json`.
- **Centralidades del POT** (`public/firmamento/centralidades.json`, `pipeline/05_centralidades.py`):
  las centralidades urbanas del Acuerdo 48 de 2014 cruzadas con las constelaciones. Se regenera con
  `python pipeline/05_centralidades.py --descargar` (el servicio de la Alcaldía responde vacío sin un
  User-Agent de navegador) y la valida `pipeline/verificar_salidas.py`. La licencia de los
  polígonos está pendiente: no se dibujan en páginas públicas hasta confirmarla.
- **Barrios oficiales** (`lib/geo/barrios-manrique.json`, `lib/geo/barrioOficial.ts`):
  los 15 polígonos de barrio de la Comuna 3, recortados por `scripts/extraer-barrios.mjs`
  del GeoJSON de barrios de Medellín. Fuente: Alcaldía de Medellín (archivo entregado
  al equipo); viaja en `metadata.fuente`. El nombre va en
  la grafía de `BARRIOS_COMUNA_3` (una sola tabla de equivalencias, en el script).
  `barrioDe(lat, lon)` es pura y devuelve el nombre o `null`; es una AYUDA (aviso del
  registro, barrio de cada comercio OSM), no una regla de admisión: esa sigue siendo
  `dentroDeManrique`. El mapa (`MapaAliadosClient`) dibuja su contorno siempre y el
  nombre desde zoom 15 (`ZOOM_ETIQUETAS_BARRIO`), sin clics. El ray casting vive UNA vez en `lib/geo/puntoEnPoligono.ts` y lo
  usan los dos (y `scripts/extraer-barrios.mjs`); no lo copies. Se importa con
  extensión: ver «Imports con extensión `.ts`». El pipeline (`02_constelaciones.py`) calcula
  el mismo barrio con shapely y lo escribe en cada comercio de `constelaciones.json`;
  `verificar-barrios.mjs` exige que coincida con `barrioDe`. Una constelación sin calle
  se llama «Barrio <X> · <categoría>». Si cambia el dataset: re-correr el script, luego
  `pipeline/02_constelaciones.py` y `verificar_salidas.py`.
- **Grupos de categoría del mapa**: `lib/categorias/grupos.ts` es el único lugar
  que dice qué categoría cae en cuál de los 6 grupos (color + forma, DESIGN.md; en el
  MAPA solo el color: cada negocio es una estrella, `svgEstrella` de `components/mapa/formas.ts`,
  grande el aliado y chica el comercio de OSM — más chica aún si está suelto; la forma
  sigue en barras, popups y listas).
  Categoría nueva en la base = su id en ese archivo; si no, cae en «Otros». Las
  constelaciones de OSM (`public/firmamento/constelaciones.json`) se piden por
  `fetch` (`lib/geo/constelaciones.ts`), no se importan en el cliente. Solo se
  importan en el servidor: `app/(site)/aliados/page.tsx` (conteos del filtro de
  categorías con `unirCategorias`: aliados + comercios de OSM, así se puede filtrar
  por cualquier negocio del mapa aunque no tenga aliados), `app/(site)/firmamento/datos.ts` (inicio y
  panel de entidad),
  `lib/firmamento/territorio.ts` (panel del equipo; `server-only`) y `lib/firmamento/entorno.ts`
  (panel del negocio; `server-only`).
- **Firmamento con sesión (puerta y paneles, de día)**: `app/(firmamento)/firmamento/layout.tsx` monta el `SiteHeader`; `PanelShell` arma encabezado del panel + menú lateral (`lib/firmamento/navegacion.ts`: `NAV` por rol, el equipo agrupa en `pestana` Hoy/Red/Datos/Guías y `gruposDe` los deriva). Piezas únicas, no escribas otras: `Tarjeta` (`components/firmamento/panel/Tarjeta.tsx`, variantes `tarjeta`/`seccion`, `plegable`; reemplazó a `ModuloDesplegable`), `Plegable` (`<details>` + framer, funciona sin JS), `Kpi` + `GrupoCifras` (una línea de fuente por grupo), `VentanaNoche` (marco para cifras y mapas; desde el 4-oct NO es de noche: los paneles van enteros con los colores del tema), `BarraPestanas`/`SubPestanas` (`panel/Pestanas.tsx`, para vistas `?vista=` dentro de una página). Estas piezas escriben `hueso`/`tinta` y usan variantes `[.modo-noche_&]:` para la noche: dentro de una `VentanaNoche` cambian solas. Nada de tokens de noche (`estrella`, `tenue`, `noche-2`…) fijos en piezas que se usan en paneles: escribí `tinta`/`tinta/70`, que `.modo-noche` redefine. Paneles de negocio y entidad: cada pantalla es una pila de `Tarjeta` (plegables lo que no se mira a diario); `ListaConvocatorias` es una lista de filas dentro de una `Tarjeta`, no una tarjeta por convocatoria. «Cambios en tu ficha» (`negocio/_components/CambiosFicha.tsx`) lee `listarBitacora({ portafolioId })` solo con un id que ya pasó por `obtenerPropio`, muestra "El equipo" (nunca el correo de quien moderó) y nombres de campos, nunca valores; al formulario de edición no viaja `moderado_por`.
- **Visualizaciones de Firmamento** (`components/firmamento/`): una sola pieza por cosa,
  no se copian. `BarrasCategoria` es la ÚNICA barra horizontal (forma del grupo, celda
  «<5» con barra vacía, tabla `sr-only` dentro de un `<div className="sr-only">`; `PistaBarra`
  es su pista sin texto, la usa también «Tu ficha está al N %»). `MapaEstelar`
  (`useConstelacionElegida` + `MapaEstelar` + `BotonConstelacion`) es el «mapa + lista que
  enciende una constelación» de `MapaTerritorio` y `ObservatorioCielo`; el inicio usa el hook y
  `BotonConstelacion` con su propio mapa (`MapaAliadosDestacado`, con aliados); el hook se desestructura
  (pasar el objeto entero a un componente rompe la regla `react-hooks/refs`). `MapaBarrios`
  pinta los 15 barrios por una cifra con la escala de `lib/escalaSecuencial.ts` (5 clases
  para conteos, 6 para la matriz; el número del barrio va escrito, el color solo agrupa).
  Solo cifras públicas (comercios de OSM, `contarPorBarrio`); una cifra de aliados por barrio
  pasaría antes por `suprimir()`. `MatrizConfusion`, `F1PorCategoria` y `ConfusionDelModelo`
  leen `public/firmamento/modelo_evaluacion.json`, que NO se edita: lo genera
  `node scripts/exportar-evaluacion-modelo.mjs` desde `pipeline/reporte_modelo.md` (correrlo
  después de cada `03_clasificador.py`; `verificar-evaluacion-modelo.mjs` falla si quedó
  viejo). Cifra del modelo: F1 macro del holdout agrupado por nombre, nunca la del split
  ingenuo ni la de la asesoría. En el mapa cada negocio es una estrella del color de su grupo
  (`svgEstrella(color, tam)`): 28 px opaco con borde fino de tinta el aliado; el comercio de OSM, tenue (~55 % de opacidad, sin borde grueso), 12 px en constelación y 9 px suelto.
- **Inicio = datos públicos** (`app/(site)/page.tsx`, 4-oct-2026; reemplaza a la página pública `/firmamento`, que redirige a `/`): título corto + `BuscadorNegocios` → UN mapa (`MapaAliadosDestacado`: `MapaAliados` con aliados + comercios de OSM, interruptor «Líneas de constelación», leyenda de una fila con los 6 grupos y la lista de constelaciones que enciende una). El buscador y el mapa comparten la consulta por contexto (`components/BusquedaInicio.tsx`, `ProveedorBusqueda` en la página): con una búsqueda activa el mapa solo dibuja lo que devuelve `buscarNegocios` (sin líneas ni nombres de constelación, encuadrado en los resultados), arriba sale «N resultados para «x»» + «Limpiar búsqueda» y la lista de la derecha pasa a ser la de resultados; el nombre de una constelación solo se escribe cuando está elegida → `CifrasBarrio` («El barrio en cifras»: `GrupoCifras`/`Kpi`, `BarrasCategoria` por grupo con %, barrios como barras, las constelaciones principales) → `EnfoqueSection` → `GaleriaAliados`. Lee con `leerFirmamento` (`app/(site)/firmamento/datos.ts`): OSM del JSON y aliados SOLO por `obtenerDatosAbiertos` (k = 5) para las cifras; el mapa y el buscador sí usan `listarAprobados` (la vitrina ya es pública). Sin hero, sin sugeridor y sin botones de registro: en todo lo público el registro no se ofrece; se llega por «Entrar» → `/firmamento/entrar` → Google → registro. Las cifras de otras entidades (Cámara…) viven en `lib/cifras.ts`, con fuente y año.
- **Panel de entidad** (`app/(firmamento)/firmamento/entidad/`: observatorio, convocatorias,
  datos): una entidad ve SOLO agregados k = 5 y convocatorias. Lee por `leerFirmamento`
  (`app/(site)/firmamento/datos.ts`, que en la base solo usa `obtenerDatosAbiertos`), por
  `obtenerDatosAbiertos` y por las funciones de entidad de `convocatorias.repo.ts`
  (`listarConvocatoriasVigentes`, `listarPropuestasDeEntidad`, `proponerConvocatoria`); el
  mapa es `MapaAliados` con `portafolios` vacío. Ninguna pantalla importa repos de negocios:
  `scripts/verificar-entidades.mjs` lo comprueba por lista permitida (`datos.repo`,
  `convocatorias.repo`, `entidades.repo`) y corre con `--experimental-strip-types`. Un cruce
  nuevo con datos de la red va en `datos.repo.ts` y pasa por `suprimir()`. «Proponer una
  convocatoria» (`lib/actions/proponerConvocatoria.ts`): revalida sesión + membresía, la
  entidad sale de `entidadDeSesion()` (jamás del formulario), entra `pendiente` con
  `origen = 'entidad'` y `propuesta_por`, URL repetida = mensaje claro, deja fila en
  `bitacora` (`actor_tipo = 'entidad'`) y usa el cupo `estado` de `rateLimit.ts` (un origen
  nuevo exigiría migrar el CHECK de `intentos_registro`). La descarga CSV
  (`entidad/datos/csv/route.ts`, con guarda) sale de `lib/firmamento/datosAbiertos.ts`, que
  solo reordena `DatosAbiertos`: una celda «<5» sigue «<5».
- **Imports con extensión `.ts`**: los verificadores (`scripts/verificar-*.mjs`)
  corren con `--experimental-strip-types`, que no resuelve imports sin extensión.
  Para que compartan código con la app (y no copiarlo), un archivo que ellos
  cargan puede importar VALORES con la extensión explícita (`import { x } from
  ./distancia.ts`): `allowImportingTsExtensions` está activo en `tsconfig.json`
  (vale por `noEmit`). Ejemplo: `lib/geo/comerciosOsm.ts`. Restricción: todo lo que
  carga un verificador (`lib/busqueda.ts`, `lib/geo/distancia.ts`, `lib/marca.ts`,
  `lib/geo/comerciosOsm.ts`, `lib/geo/puntoEnPoligono.ts`, `lib/geo/barrioOficial.ts`…) solo puede tener `import type` hacia el resto del
  proyecto (los alias `@/` no los resuelve Node) y entre ellos usar `.ts`. Si
  necesitas un valor de `@/…`, ese archivo no puede cargarlo un verificador.
- **Comentarios**: solo cuando explican el WHY (una decisión no obvia, un
  trade-off). Los shortcuts deliberados se marcan con `ponytail: <qué se
  omitió y cuándo ampliarlo>`. No comentar lo que el código ya dice solo.

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm run lint          # eslint .
npm run typecheck     # tsc --noEmit
npm run verificar     # verifica voseo, geo, constraints, campos personalizados, guías de marca, entorno, sugeridor (ML), constelación de un punto, barrios oficiales, entidades (no leen negocios), accesos (guardas de Firmamento y Server Actions) y datos abiertos (k = 5)
npm run db:migrar     # corre migraciones
npm run db:admin      # crea usuario admin
npm run db:google-sub # muestra el google_sub de una cuenta (para ADMIN_GOOGLE_SUBS)
npm run agente:verificar  # prueba que el asesor habla con su proveedor
```

## Qué NO hacer

- No agregar un ORM ni un query builder — el patrón es SQL crudo vía repos.
- No traducir nombres de dominio al inglés.
- No tocar `data/` sin que el usuario lo pida explícitamente (son datasets fuente).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
