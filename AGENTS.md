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
- Tailwind CSS
- Zod para validación de datos
- Neon (Postgres serverless) como base de datos
- Vercel Blob para almacenamiento de archivos (fotos)
- El asesor de formalización (`lib/agente/`) habla con un modelo de lenguaje
  por `fetch` al formato de OpenAI en `/chat/completions`, **sin SDK**. Los
  proveedores viven en `lib/agente/proveedores.ts` y se recorren en orden hasta
  que alguno responda: todos corren con plan gratuito y un plan gratuito se
  agota. Cada uno se prende con su clave (`GEMINI_API_KEY`, `GROQ_API_KEY`,
  `OPENROUTER_API_KEY`); el modelo y la URL se pueden pisar con
  `<PROVEEDOR>_MODELO` y `<PROVEEDOR>_API_URL`. No instales el SDK de ningún
  proveedor: ata el proyecto a ese proveedor justo donde la portabilidad es el
  requisito. La llamada sale solo desde una Server Action detrás del token del
  negocio, nunca desde una ruta pública.
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
  auth/               sesiones: admin.ts (moderadores), usuario.ts (vecinos), google.ts (OAuth)
  blob/               integración con Vercel Blob
  agente/             asesor de formalización (prompt y llamada al modelo)
scripts/             scripts de mantenimiento (migraciones, verificación, admin)
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
  salvo que el volumen lo justifique.
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
- **Comentarios**: solo cuando explican el WHY (una decisión no obvia, un
  trade-off). Los shortcuts deliberados se marcan con `ponytail: <qué se
  omitió y cuándo ampliarlo>`. No comentar lo que el código ya dice solo.

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm run lint          # eslint .
npm run typecheck     # tsc --noEmit
npm run verificar     # verifica geo, constraints, campos personalizados y entorno
npm run db:migrar     # corre migraciones
npm run db:admin      # crea usuario admin
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
