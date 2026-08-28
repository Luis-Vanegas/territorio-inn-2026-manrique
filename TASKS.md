# Tareas del proyecto

## 🟢 Para Antigravity (rápidas, mecánicas, acotadas)

### Voseo en los mensajes de las server actions

El barrido de voseo anterior (rama `fix-voseo-registro`, ya mergeada) limpió
JSX, placeholders y schemas de Zod, pero **se saltó `lib/actions/`**. Quedan
19 mensajes que la persona sí ve, porque se pintan en el `role="alert"` de
cada formulario.

Tabla: `Probá` → `Prueba` · `Intentá` → `Intenta` · `Escribí` → `Escribe` ·
`Completá` → `Completa`. No tocar comentarios de código.

- [ ] `lib/actions/registrarServicio.ts` — líneas 70, 77, 81, 134
- [ ] `lib/actions/registrarPortafolio.ts` — líneas 57, 68, 73, 137
- [ ] `lib/actions/registrarCandidato.ts` — líneas 46, 53, 57, 84
- [ ] `lib/actions/gestionarEstado.ts` — líneas 44, 89, 147, 157
- [ ] `lib/actions/registrarPeticion.ts` — líneas 34, 50
- [ ] `lib/actions/camposPersonalizados.ts` — línea 81

Al terminar: `npm run lint && npm run typecheck` (son solo strings).

> Nota: los mensajes de `registrarCandidato.ts` los escribí yo (Claude Code)
> al crear el módulo Empleo, copiando el patrón de `registrarServicio` sin
> notar que arrastraba el voseo. No es deuda heredada, es mía.

## 🔵 Para Claude Code (arquitectura, lógica compleja, decisiones)

- [ ] **La pantalla de error miente.** `app/error.tsx` dice "Casi siempre es
      la base de datos tardando en responder" para *cualquier* fallo. El 413
      de fotos que reportó Luis (2026-08-27) mostró ese texto y mandó el
      diagnóstico para el lado equivocado. Debería distinguir al menos el 413
      (archivo muy grande) del resto, o no afirmar una causa que no conoce.

Hecho el 2026-08-27 (en `main`, pendiente de desplegar):

- [x] **Servicios no guardaba nunca** (`303db1c`). El schema exigía cuatro
      consentimientos y el formulario tenía tres: faltaba la casilla
      `acepto_investigacion`, así que `z.literal(true)` rechazaba el 100% de
      los envíos — y sin `<Error>` que lo pintara, fallaba en silencio.
      Verificado que Aliados y Empleo no tienen la misma desalineación.
- [x] `serverActions.bodySizeLimit: '6mb'` — el default de Next es 1 MB y
      todo el sitio promete 5 MB.
- [x] Compresión de fotos en el navegador (`lib/imagen/comprimir.ts`), solo
      en Servicios por ahora. ~1 MB → ~50 KB antes de subir.
- [x] Animación del mapa del inicio rehecha en CSS puro (`70b7fbb`).
- [x] Módulo Empleo completo (`f68c2d0`) y bifurcación de intención en el
      Hero (`7b2c0b7`).

Hecho el 2026-08-25:

- [x] Ritmo vertical de la home en tokens CSS. Home: 6225px → 4394px.
- [x] `app/error.tsx` y `app/not-found.tsx`.
- [x] SEO: `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `metadataBase`.
- [x] `hashIp()` falla cerrado sin `IP_HASH_PEPPER`; `CRON_SECRET` con
      `timingSafeEqual`.
- [x] Rama `dev` en Neon (`br-long-lake-ay0jaw5y`).
- [x] ~~`.github/workflows/ci.yml`~~ — quitado: la cuenta tiene presupuesto
      $0 en Actions. Verificación a mano:
      `npm run typecheck && npm run lint && npm run verificar`.
- [x] Barrido de voseo en JSX, placeholders y schemas (rama
      `fix-voseo-registro`, mergeada). **Incompleto**: ver la tarea abierta de
      `lib/actions/` arriba.

## 🔴 Bloqueado — necesita a Luis (cuentas, no código)

- [ ] **Desplegar para que el arreglo de fotos tome efecto.** El
      `bodySizeLimit` vive en `next.config.mjs` y se aplica **en el build**:
      hasta el próximo deploy, producción sigue con el límite de 1 MB.

- [ ] **`.env.local` tiene dos líneas `DATABASE_URL`** (`ep-rapid-mouse` =
      `main`, `ep-floral-tree` = `dev`). Next usa la **última** (dev, bien),
      pero `migrar.mjs` usa la **primera** — o sea que una migración correría
      contra **producción** sin avisar. Ya pasó una vez el 2026-08-27. Dejar
      una sola línea (la de `dev`) y usar una variable inline para migrar
      contra producción, que le gana al archivo y desaparece al terminar:

      ```powershell
      $env:DATABASE_URL="<string-de-main>"; npm run db:migrar; Remove-Item Env:DATABASE_URL
      ```

- [ ] **`NEXT_PUBLIC_MODULO_EMPLEO=true` en Vercel** cuando se quiera
      publicar el módulo Empleo. Es `NEXT_PUBLIC_`: se incrusta en el build,
      así que hay que redesplegar después de agregarla.

## 🟡 Decisión de producto

- [x] ~~Las 4 opciones huérfanas de `mayor_dolor`.~~ No había decisión que
      tomar: el commit `78710f9` dice que el cliente reescribió las preguntas
      6 y 7 y acortó la 6 de 10 a 5 opciones. El recorte fue deliberado.

      El esquema **no se limpia**: dos filas de `aliados_investigacion` tienen
      `proveedores` en `mayor_dolor` — respuestas reales anteriores al
      recorte. Angostar el CHECK falla contra ellas, y forzarlo significaría
      borrar respuestas de una investigación con personas.

- [ ] **Conversación con el cliente, no técnica:** de 6 respuestas, 2
      eligieron `proveedores` (un tercio). El cuestionario actual ya no puede
      capturar eso. Si el diagnóstico de proveedores importa para la
      investigación, hay que revisar la pregunta 6 con el cliente.

## ⚪ Anotado, no urgente

- [ ] **Content-Security-Policy.** Punto 1 de "lo que falta" en
      `docs/seguridad.md`. Pide nonces por request y probarla contra el sitio
      real (tiles de CARTO, fotos del Blob, estilos inline de Next).

- [ ] **Compresión de fotos en Aliados.** Hoy solo la tiene Servicios, por
      decisión de alcance. Aliados (registro y edición) sigue subiendo el
      archivo completo; el `bodySizeLimit` lo cubre, pero le gasta los datos
      móviles a la persona igual. Reusar `lib/imagen/comprimir.ts`.

- [ ] **`useFormState` está deprecado** en `FormularioRegistro.tsx:265` y la
      consola lo avisa en cada carga. **No se puede arreglar todavía**: el
      reemplazo (`React.useActionState`) no existe en React 18.3, que es la
      versión instalada — verificado en `node_modules`. Queda para cuando el
      proyecto suba a React 19.

- [ ] **Reevaluar el plan de Neon cuando crezca el volumen.** Free retiene
      6 h de historial: ese es todo el margen para un point-in-time restore.
      Con 7 negocios alcanza; con cientos, no. Launch sube a 30 días.

- [x] ~~Proteger la rama `main` de Neon.~~ **No se puede en el plan Free**:
      "protected branches" es de planes pagos (Launch en adelante). Verificado
      contra la documentación y la API de Neon.

      Tampoco hace falta: proteger la rama es un candado contra borrarla
      entera, y ese nunca fue el riesgo. El riesgo era correr migraciones
      contra datos reales desde local, y eso lo cierra la rama `dev` (ver la
      tarea de `.env.local` arriba).
