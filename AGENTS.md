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
  todo lo demás, DM Mono (`font-cifra`) SOLO cifras, fuentes y fechas. Tokens de noche
  (`noche`, `sodio`, `estrella`…) solo para Firmamento y la banda nocturna.
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
rutas como `app/(site)/aliados/registro`. No traducir esto al inglés al
agregar código nuevo — seguí el patrón existente.

## Estructura de carpetas

```
app/
  (site)/           route group del sitio público (aliados, servicios, contacto, legal)
  admin/(panel)/    route group del panel de administración
  api/              route handlers (cron, exportar, interacciones)
  <ruta>/_components/  componentes usados solo por esa ruta
components/         componentes compartidos entre rutas
lib/
  actions/          Server Actions ('use server'), un archivo por acción
  db/                repositorios de acceso a datos (*.repo.ts), uno por tabla/dominio
  validation/        schemas de Zod (*.schema.ts)
  geo/                utilidades geoespaciales
  auth/               sesiones: admin.ts (moderadores), usuario.ts (vecinos), google.ts (OAuth);
                      secreto.ts compara secretos compartidos de endpoints de máquina
  blob/               integración con Vercel Blob
  agente/             asesor de formalización (prompt y llamada al modelo)
  ml/                 inferencia en el navegador (categoria.ts: sugeridor de categoría)
  privacidad/         regla k = 5 (kAnonimato.ts), pura y sin server-only
pipeline/            Python del reto (OSM, constelaciones, clasificador, vigía); salidas en public/
.github/workflows/   vigía de convocatorias (único workflow; no hay CI de verificación)
scripts/             scripts de mantenimiento (migraciones, verificación, admin)
pipeline/            Python reproducible (OSM, HDBSCAN, clasificador); su propio
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
- **Sugeridor de categoría** (`lib/ml/categoria.ts`): TF-IDF de n-gramas + regresión
  logística exportados a `public/modelo_categoria.json` (los genera
  `pipeline/03_clasificador.py`), inferencia en el NAVEGADOR: lo que la persona
  escribe en el nombre no sale de su pantalla. Con confianza >= 0,45 sugiere una;
  si no, las 3 mejores (`sugerirCategoria`). Replica a `pipeline/verificar_salidas.py`:
  al reentrenar hay que regenerar los casos de `scripts/verificar-sugeridor.mjs`.
  Si se guarda algo del sugeridor (`sugerencias_categoria`), es la categoría
  inferida y si la aceptó, NUNCA el texto escrito. El archivo no lleva
  `server-only` ni imports de valor, para que el verificador lo importe.
- **Campos personalizados públicos**: un campo de `definiciones_campo` solo sale en
  la vitrina si tiene `publico = true` (default `false`, migración 032). El filtro
  vive en el SQL de `portafolios.repo.ts` (`COLUMNAS_PUBLICAS`), no en el
  componente: el dueño y el panel leen `COLUMNAS_PROPIAS` (todo).
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
  otro filtro de texto por componente. Busca también por dirección (con
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
  y `app/admin/(panel)/<modulo>/` (copiar los de ventas) + entrada en
  `lib/content.ts`, `app/sitemap.ts`, el menú del panel y la lista de
  `scripts/verificar-marca.mjs`. Ojo: el archivo de datos importa de `./marca`
  SOLO tipos (`import type`): el verificador corre con `--experimental-strip-types`,
  que no resuelve imports de valor sin extensión.
- **Mis clientes (CRM de cada aliado)**: `lib/db/clientes.repo.ts` guarda datos
  de TERCEROS (los clientes del negocio, que no se registraron acá). Toda
  consulta cruza con `portafolios` y filtra `p.usuario_id = ${usuarioId}` de la
  sesión: los ids del formulario se pueden inventar. `scripts/verificar-clientes.mjs`
  falla si una consulta nueva lo olvida. Lo mínimo por Ley 1581: nombre,
  teléfono y nota; nada de cédula, dirección ni correo. El contacto sale por
  WhatsApp (`enlaceWhatsapp` + `?text=`), sin proveedor de correo.
- **Dos poblaciones, dos cookies**: `admin_session` (moderadores, 8 h) y
  `sesion_usuario` (vecinos, 14 días; con prefijo `__Host-` en producción).
  Cookies separadas a propósito: con una sola, un campo "rol" adentro sería lo
  único entre un vecino y el panel de moderación. No las unifiques.
- **Dos puertas, una ficha**: un negocio entra por cuenta de Google
  (`usuarios.id` en `portafolios.usuario_id`) o por el enlace con
  `token_publico` — para quien registramos en campo y no maneja tecnología.
  `origen_registro` distingue `propio` de `asistido`; es una columna, no otra
  tabla. Un registro `asistido` EXIGE `consentimiento_asistido` y
  `capturado_por` por restricción de base: Ley 1581 de 2012, el consentimiento
  lo da el titular y hay que poder demostrar cómo.
- **RLS no se usa acá y no hace falta**: el navegador nunca habla con Postgres.
  Toda consulta sale de una Server Action o de un Server Component, que ya
  saben quién es el usuario por su sesión. El control de acceso va en el
  `where` del repo, no en políticas de fila.
- **Grupos de categoría del mapa**: `lib/categorias/grupos.ts` es el único lugar
  que dice qué categoría cae en cuál de los 6 grupos (color + forma, DESIGN.md).
  Categoría nueva en la base = su id en ese archivo; si no, cae en «Otros». Las
  constelaciones de OSM (`public/firmamento/constelaciones.json`) se piden por
  `fetch` (`lib/geo/constelaciones.ts`), no se importan.
- **Comentarios**: solo cuando explican el WHY (una decisión no obvia, un
  trade-off). Los shortcuts deliberados se marcan con `ponytail: <qué se
  omitió y cuándo ampliarlo>`. No comentar lo que el código ya dice solo.

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm run lint          # eslint .
npm run typecheck     # tsc --noEmit
npm run verificar     # verifica voseo, geo, constraints, campos personalizados, guías de marca, entorno, sugeridor (ML) y datos abiertos (k = 5)
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
