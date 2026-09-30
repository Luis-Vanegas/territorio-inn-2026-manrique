# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Visión general

"Constelaciones — Manrique": directorio público de negocios y oficios de la Comuna 3 de Medellín, con mapa, registro abierto y moderación humana. Maneja datos de vecinos reales (Ley 1581), así que lo que se publica y lo que se guarda es una decisión de diseño, no un detalle. Contexto y variables de entorno: `README.md`; seguridad y analítica: `docs/`; identidad visual: `DESIGN.md` (fuente de verdad, se discute ahí antes de contradecirla en un componente).

## Comandos que no están (o están incompletos) en AGENTS.md

```bash
npm run db:estado                      # qué migraciones están aplicadas
node scripts/verificar-voseo.mjs       # un solo verificador (los de `npm run verificar` corren sueltos)
node --experimental-strip-types scripts/verificar-marca.mjs   # los verificar-*.mjs que importan .ts necesitan este flag
```

- **No hay tests** (ni runner ni CI: la cuenta tiene $0 en Actions). La verificación es `npm run typecheck && npm run lint && npm run verificar`, a mano.
- `verificar-constraints`, `verificar-campos-personalizados` y `verificar-agente` **tocan la base**: leen `DATABASE_URL` de `.env.local`.
- No existe `.env.example` (el README lo menciona, está desactualizado). Tampoco `proxy.ts`/`middleware.ts`: el control de acceso vive en cada Server Action, ruta y repo.

## Arquitectura

- **Módulos con flag**: `lib/content.ts` decide qué módulos existen por `NEXT_PUBLIC_MODULO_EMPLEO` / `_INVENTARIO`. Apagado = 404 real, ni menú ni sitemap. Al ser `NEXT_PUBLIC_`, se incrustan en el **build**: cambiar la variable exige redesplegar. (Servicios existió y se eliminó en la migración 028.)
- **Flujo de un registro**: formulario público (o sesión de vecino) → Server Action en `lib/actions/` → schema Zod → repo → fila `pendiente` → moderador aprueba/rechaza en `app/admin/(panel)/` → recién ahí aparece en la vitrina. Nada se publica solo. Las columnas públicas están listadas explícitamente en los repos (`COLUMNAS_PUBLICAS`); datos de investigación y personales viven en tablas privadas aparte y nunca salen a la vitrina.
- **Migraciones**: `lib/db/migrations/NNN_*.sql`, aplicadas por `scripts/migrar.mjs` (runner propio, con checksum en `_migraciones` y driver WebSocket de Neon para transacciones). Nunca se edita una migración ya aplicada: se agrega una nueva.
- **`lib/geo/manrique.json`** es el polígono del territorio, generado por `scripts/extraer-manrique.mjs` desde un dataset externo (`data/` está en `.gitignore`). Lo valida `verificar-geo`.
- **Rutas públicas `force-dynamic`, lecturas cacheadas**: las páginas se renderizan por request (el layout lee la cookie de sesión), pero las lecturas de la vitrina salen de `unstable_cache` con etiqueta (`lib/db/cache.ts`) y se invalidan al moderar/editar. Un negocio aprobado sigue apareciendo de inmediato porque la acción llama `invalidarVitrina()`.
- **Fotos**: se comprimen en el navegador (`lib/imagen/comprimir.ts`, `manejarSeleccionFoto`) antes de subir a Vercel Blob (`lib/blob/`); el servidor valida la firma real del archivo antes de pasarlo a `sharp`. `serverActions.bodySizeLimit` está en `next.config.mjs` y solo toma efecto en el build.

## Gotchas

- **`.env.local` puede tener dos `DATABASE_URL`** (producción y rama `dev` de Neon). Next usa la última; `scripts/migrar.mjs` usa la **primera**. Antes de migrar, confirmá contra qué base apunta (`npm run db:estado`). Para migrar producción a propósito, pasá `DATABASE_URL` inline; le gana al archivo.
- **`useActionState` sí existe**: Next 16 corre sobre el React que él mismo vendoriza (`next/dist/compiled/react`), no sobre el de `node_modules`. No uses `useFormState`.
- **Next 16 degrada `images` `quality` en silencio** si el valor no está en `images.qualities` de `next.config.mjs`.
- **No recortes fotos de contenido** antes de subirlas: el contenedor ya aplica `object-cover`, y el recorte previo se suma al del contenedor.
- **Barridos de código** (voseo, `<label>` sin asociar, etc.): Los barridos se hacen por criterio de búsqueda sobre todo el árbol, no por listas de archivos armadas de memoria (`TASKS.md` documenta las tres veces que eso falló).
- Los indicadores de entorno (`lib/entorno.ts`) se resuelven en el Server Component leyendo `VERCEL_ENV`, nunca con `NEXT_PUBLIC_*`.

## Coordinación

`TASKS.md` es el estado de trabajo compartido con Antigravity (hecho, bloqueado, decisiones abiertas). Leelo al empezar y actualizalo al cerrar tareas.
