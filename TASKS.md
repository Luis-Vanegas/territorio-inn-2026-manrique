# Tareas del proyecto

## 🟢 Para Antigravity (rápidas, mecánicas, acotadas)

### Voseo en los mensajes de las server actions

El barrido de voseo anterior (rama `fix-voseo-registro`, ya mergeada) limpió
JSX, placeholders y schemas de Zod, pero **se saltó `lib/actions/`**. Quedan
19 mensajes que la persona sí ve, porque se pintan en el `role="alert"` de
cada formulario.

Tabla: `Probá` → `Prueba` · `Intentá` → `Intenta` · `Escribí` → `Escribe` ·
`Completá` → `Completa`. No tocar comentarios de código.

- [x] `lib/actions/registrarServicio.ts` — líneas 70, 77, 81, 134
- [x] `lib/actions/registrarPortafolio.ts` — líneas 57, 68, 73, 137
- [x] `lib/actions/registrarCandidato.ts` — líneas 46, 53, 57, 84
- [x] `lib/actions/gestionarEstado.ts` — líneas 44, 89, 147, 157
- [x] `lib/actions/registrarPeticion.ts` — líneas 34, 50
- [x] `lib/actions/camposPersonalizados.ts` — línea 81

Al terminar: `npm run lint && npm run typecheck` (son solo strings).

> Nota: los mensajes de `registrarCandidato.ts` los escribí yo (Claude Code)
> al crear el módulo Empleo, copiando el patrón de `registrarServicio` sin
> notar que arrastraba el voseo. No es deuda heredada, es mía.

## 🔵 Para Claude Code (arquitectura, lógica compleja, decisiones)

### Addendum 2 de la auditoría (accesibilidad visual) — 2026-08-28

Hecho, en la rama `a11y-addendum-2`:

- [x] **Menú: estado activo.** `aria-current="page"` + tres señales visuales
      (peso, subrayado, color), texto a 14px y área táctil de 44px.
- [x] **Hero: los 4 CTA agrupados** en "Estoy buscando" / "Tengo algo para
      ofrecer", con encabezado de texto. El color deja de ser el único
      portador del significado (WCAG 1.4.1).
- [x] **Barrios del hero fuera del SVG.** Eran `<text>` a 5,2px efectivos en
      mobile; ahora son lista HTML en `text-base`. El dibujo queda decorativo
      y oculto en mobile.
- [x] **`prefers-reduced-motion` global** + `scroll-behavior: auto`.
- [x] **Menú a 16px.** 14px seguía siendo chico según la usuaria. A 16px el
      menú inline no entra a 1024px, así que el desplegable cubre hasta xl en
      vez de encogerle la letra a nadie.
- [x] **Barrido de contraste del acento** (157 líneas, 48 archivos).
      `terracota` #C55A3C sobre hueso da 3,93:1 y AA pide 4,5:1 — el sitio
      incumplía. Donde el acento es texto, o es fill con texto encima, pasa a
      `terracota-texto` #A34B33 (5,34:1). Sigue vivo en bordes, subrayados,
      puntos y fondos tenues: ahí 3:1 alcanza y es lo que sostiene la
      identidad.
- [x] **Los cuatro CTA del hero, mismo peso visual.** Los encabezados ya
      arreglaban WCAG 1.4.1, pero la usuaria también reportó que unos
      resaltaban más que otros. Decisión suya: los cuatro con borde.

Pendiente, en orden de valor:

- [ ] **Desplegar.** El punto 3 del addendum ("el sitio tiene tres barras de
      navegación") **no es un bug del código**: hay un solo `SiteHeader` en
      `app/(site)/layout.tsx`. Lo que vio la auditoría es producción
      desactualizada (Empleo, Hero y mapa nunca se desplegaron) más los flags
      `NEXT_PUBLIC_MODULO_*`, que filtran los ítems del menú. Se cierra
      desplegando, no editando.
- [ ] **Cablear los colores de Tailwind a variables CSS** para que
      `prefers-contrast: more` y `prefers-color-scheme: dark` puedan
      funcionar. Hoy `tailwind.config.ts` tiene los hex literales, así que
      redefinir `--color-tinta` en `globals.css` no afecta a `text-tinta`.
      Ojo: hay que pasar las variables a formato de canal
      (`--color-tinta: 26 26 26`) y el config a
      `rgb(var(--color-tinta) / <alpha-value>)`, porque si no Tailwind
      **descarta las opacidades** y el sitio usa `text-tinta/65`, `/70`, `/80`
      por todas partes. Es un refactor transversal con riesgo real, va en su
      propia rama y con revisión visual antes de mergear.
- [ ] **Los 30 `text-[Npx]`.** El diagnóstico del addendum ("px hace que el
      sitio ignore el zoom") es impreciso: el zoom de página sí escala px, lo
      que ignoran es el *tamaño de fuente predeterminado* del navegador. Y el
      resto del sitio ya está en `rem` vía las clases de Tailwind. El problema
      real de esos 30 casos es otro y más simple: **son de 9 a 11px**. Son 11
      en el sitio público y 19 en `/admin`. Priorizar los públicos.
- [ ] **Pasar Lighthouse** para cazar lo que quede bajo 4,5:1. El acento ya
      se barrió entero; falta verificar las opacidades de `tinta` una por una
      (`docs/sistema-diseno-a11y.md` marca `/65` como el piso y ya detectó
      `/50` y `/45` en uso).
- [ ] **Volver a probar con la misma usuaria.** Reportó cinco cosas y las
      cinco están corregidas; el ciclo se cierra cuando ella lo recorre de
      nuevo, no cuando pasa un validador.
- [ ] **El hero no tiene un CTA primario, a propósito.** El addendum proponía
      dejar uno solo destacado; la usuaria pidió lo contrario, que los cuatro
      pesen igual, porque el destacado era justo lo que la confundía. Se
      eligió accesibilidad sobre conversión. Si más adelante los datos dicen
      que hace falta guiar más, la prueba de pasillo con 5 vecinos es la forma
      de resolverlo — no volver a discutirlo internamente.


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
