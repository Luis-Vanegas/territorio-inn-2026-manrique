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
- Node >= 20.9.0

## Idioma del código

Todo el texto visible al usuario (labels, placeholders, mensajes de error,
páginas legales, confirm dialogs) va en **español colombiano, registro
"tú"** — nunca voseo ("vos", "podés", "tenés", "contanos"). Es un sitio para
vecinos de la Comuna 3 en Medellín, no suena bien en rioplatense ni en paisa
informal. Si escribís una frase nueva y dudás, usá la conjugación de "tú"
(puedes, tienes, quieres, haces) y listo.

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
  auth/               autenticación de admin
  blob/               integración con Vercel Blob
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
```

## Qué NO hacer

- No agregar un ORM ni un query builder — el patrón es SQL crudo vía repos.
- No traducir nombres de dominio al inglés.
- No tocar `data/` sin que el usuario lo pida explícitamente (son datasets fuente).
