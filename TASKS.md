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

Cerrado por Antigravity en `d4459ea` (19 líneas en 6 archivos) — correcto,
pero la lista de arriba estaba **incompleta y la escribí yo**: `lib/actions/`
tiene once archivos y le asigné seis. Faltaban tres `Volvé a entrar.` en
`atenderPeticion.ts` y `camposPersonalizados.ts` (líneas 45 y 94, no solo la
81). Completado en `bcfcc49`.

> **Cómo delegar tareas mecánicas de acá en adelante:** se pasa el *criterio
> de búsqueda* ("barré `lib/actions/` entero buscando estas formas"), nunca un
> inventario de archivos y líneas hecho a mano. El inventario hereda los
> errores de quien lo escribió y el ejecutor no tiene forma de detectarlos —
> hizo bien su trabajo y el resultado igual quedó incompleto.

> Nota: los mensajes de `registrarCandidato.ts` los escribí yo (Claude Code)
> al crear el módulo Empleo, copiando el patrón de `registrarServicio` sin
> notar que arrastraba el voseo. No es deuda heredada, es mía.

## 🔵 Para Claude Code (arquitectura, lógica compleja, decisiones)

### Cierre de tareas previo a producción — 2026-08-30 (segunda vuelta)

Verificado en el navegador con el dev server, no solo por código.

Hecho:

- [x] **`useFormState` migrado a `useActionState` en los 7 componentes que
      faltaban.** La nota de "⚪ Anotado" decía que no se podía porque
      `useActionState` no existe en React 18.3 "verificado en node_modules".
      La verificación miró el `node_modules` equivocado: el App Router de
      Next 16 corre sobre el React que **Next vendoriza**
      (`next/dist/compiled/react`), que sí lo exporta, y los tipos están en
      `@types/react/canary.d.ts`. La prueba viva es que cinco componentes del
      propio proyecto ya lo usaban y funcionaban. El proyecto estaba partido
      en dos patrones para lo mismo; ahora hay uno. `useFormStatus` se queda
      en `react-dom`, que ahí no cambió. Consola limpia tras el cambio.
- [x] **Compresión de fotos en Aliados** (registro y edición). No se agregó
      una cuarta copia del handler: había TRES copias del mismo `onChange` y
      solo la de Servicios comprimía. Ahora hay una sola,
      `manejarSeleccionFoto` en `lib/imagen/comprimir.ts`, y los tres
      formularios la llaman. 39 líneas menos en Servicios.
- [x] **`app/error.tsx` ya no miente.** Distingue el 413 por foto grande del
      resto, con título y cuerpo propios. Se verificó en
      `node_modules/next/.../action-handler.js` que el mensaje es `Body
      exceeded Nmb limit.`, y en `server-action-reducer.js` que lo reexpone el
      CLIENTE cuando la respuesta es `text/plain` — por eso sobrevive a la
      sanitización de producción. Para todo lo demás ya no afirma una causa.
- [x] **Los `text-[Npx]` de 9–11 px.** Eran 20 (10 públicos, 10 en admin), no
      30. Todos a `text-xs`. Se deja a propósito el de
      `IndicadorEntorno.tsx`, que no se renderiza en producción. Medido en el
      navegador: no queda texto bajo 12 px en ninguna ruta pública.
- [x] **La atribución de Leaflet subió de 10 a 12 px.** No estaba en la lista
      porque no es un `text-[Npx]` sino CSS propio en `globals.css`. Es la
      atribución que la licencia de OpenStreetMap obliga a mostrar.
- [x] **La foto de un servicio rechazado se libera del Blob.**
      `soltarFoto()` en `serviciosPrivado.repo.ts` + llamada en
      `moderarServicio`. Cierra la asimetría con Portafolios anotada arriba.
- [x] **Empleo y Servicios probados con los flags prendidos.** En local están
      encendidos. Las dos rutas cargan, los formularios renderizan (44 campos
      Servicios, 8 Empleo) y el honeypot `sitio_web` está bien tapado: los
      tres formularios llevan `aria-hidden` (en el `div` contenedor en Empleo
      y Servicios), así que no llega al lector de pantalla.

Pendiente, con lo que se averiguó:

- [ ] **Dos warnings de React SOLO en `/servicios/registro` y
      `/empleo/registro`** — los dos formularios que ajustan estado durante el
      render para repoblar tras un error (`if (estado !== estadoVisto) {...}`).
      Son los mismos dos en ambas rutas, están desde antes de este cambio
      (verificado con `git stash`), y React no evalúa ninguno de los dos en
      producción:
      1. `Can't perform a React state update on a component that hasn't
         mounted yet` — apunta al bloque de repoblado.
      2. `Each child in a list should have a unique "key" prop. Check the
         render method of CampoFormulario` — el array sin key se crea dentro
         de alguna función `children` de `CampoFormulario` (por eso React lo
         atribuye a ese componente y no a quien lo llama). No se localizó el
         array exacto: se revisaron los seis `.map` de `FormularioServicio` y
         todos llevan key, y el `componentStack` llega vacío.
      Arreglarlos es refactorizar el patrón de repoblado de dos formularios;
      va con envío real de formulario para probarlo, no a ciegas. **Hacerlo
      antes de encender los flags.**
- [ ] **`servicios.token_publico` no lleva a ninguna parte.** La columna
      existe, tiene índice único y se le muestra a la persona al registrarse
      (`/servicios?registrado=<token>`), pero no hay ruta
      `/servicios/estado/[token]` — el equivalente sí existe para Aliados. Hoy
      un servicio rechazado es terminal: no hay cómo corregirlo. Decidir si se
      construye la ruta o se deja de prometer el token.

### Vaciado de datos de prueba — 2026-08-30

La base de producción se vació a pedido de Luis, que la revisó y confirmó
"todo". Respaldo completo (14 tablas + las 7 fotos de Blob) en el scratchpad
de la sesión antes de borrar — fuera del repo, así que **no sobrevive a un
reinicio de la máquina**. Si hay que conservarlo, moverlo a un lugar propio.

Borrado: 10 portafolios, 9 `aliados_investigacion`, 10
`aliados_consentimiento`, 8 `interacciones_portafolio`, 10 `visitas_sitio`,
1 `candidatos`, 1 `intentos_registro`, el admin `prueba@itm.edu.co` y los 7
blobs. Conservados a propósito: las 28 `categorias` (catálogo, no datos),
las 25 filas de `_migraciones` y los tres admins activos — borrar esos
últimos dejaba el panel sin acceso el día del lanzamiento.

- [x] **La foto de Servicios era derivable desde la vitrina pública.** La 023
      movió `foto_url` a `servicios_privado` porque el dato es reservado, pero
      `subirFoto` la guardaba en `servicios/<id>.webp` con `addRandomSuffix:
      false` — y ese `id` es el mismo que `COLUMNAS_PUBLICAS` manda al
      navegador. Cualquiera con la ficha a la vista armaba la URL del blob.
      No llegó a filtrarse nada porque el módulo nunca se encendió. Arreglado
      en `lib/blob/fotos.ts`: sufijo aleatorio solo para `servicios`, así la
      URL solo la conoce quien lee la tabla privada. Sin filas que migrar.
- [x] **Ningún flujo libera la foto de un servicio.** Portafolios tenía tres
      caminos que llaman `borrarFoto` (moderar→archivado, borrado propio);
      Servicios no tenía ninguno, y un servicio rechazado dejaba la foto en
      Blob para siempre — de ahí salieron los 3 blobs huérfanos. Cerrado en
      `7f8350c`: `soltarFoto()` en `serviciosPrivado.repo.ts` + llamada en
      `moderarServicio`. Queda abierto el caso de borrado por la persona, que
      no existe como flujo todavía.
- [ ] **Neon sigue con el cómputo fijo en 0,25 CU** (verificado hoy:
      `autoscaling_limit_min_cu` = `max_cu` = 0.25). Sigue pendiente de la
      revisión del 29. Con público de verdad, subir el máximo.
- [ ] La retención de historial sigue en 6 h y `allowed_ips` sigue vacío.
      Ambos verificados hoy, ambos sin cambio.

Verificado en verde tras el vaciado: `verificar-voseo`, `verificar-geo`
(14/14), `verificar-constraints` (11/11), `verificar-campos-personalizados`
(6/6), `verificar-entorno` (10/10), `tsc --noEmit` y `eslint .`.

### Revisión previa a producción — 2026-08-29

**Neon** (`dark-shape-12148328`, us-east-2, Postgres 18). Ciclo cierra el
2026-09-01. Sobra cupo por todos lados:

| Recurso | Uso | Límite Free | % |
|---|---|---|---|
| Almacenamiento | 31,5 MB | 512 MB | 6,2 % |
| Cómputo | 6,4 CU-h | 191,9 CU-h | 3,3 % |
| Transferencia | 7,3 MB | 5 GB | 0,15 % |

Dos ramas: `main` (31,5 MB) y `dev` (`br-long-lake-ay0jaw5y`, comparte datos
con `main` por copy-on-write, no suma almacenamiento aparte). 14 tablas.

Pendiente de Neon, en orden:

- [ ] **El cómputo está fijo en 0,25 CU** (`min = max = 0.25`), sin
      autoescalado. No es un problema de cupo sino un techo de rendimiento:
      si el sitio se presenta en un evento y entran cien personas a la vez, la
      base no puede crecer. El plan Free permite hasta 2 CU. Subir el máximo
      antes de cualquier lanzamiento con público.
- [ ] **Verificar que Vercel despliegue en la región de la base.** Neon está
      en `us-east-2` (Ohio). Si las funciones de Vercel quedan en otra región,
      cada consulta paga el viaje de ida y vuelta entre regiones, y este sitio
      hace varias por página.
- [ ] **Retención de historial en 6 horas** (`history_retention_seconds:
      21600`). Alcanza para deshacer un error que se note enseguida; no
      alcanza para uno que se note al día siguiente. Decidir si es suficiente
      una vez que haya datos reales de vecinos.
- [ ] **La base acepta conexiones desde cualquier IP** (`allowed_ips` vacío).
      Es lo normal en serverless, pero conviene dejarlo dicho: la única
      defensa es la cadena de conexión.

**Aplicación**

- [x] La home hacía `listarAprobados()` dos veces por visita. Memoizada con
      `cache()` de React (`ecfb66e`).
- [ ] **Todas las rutas públicas son `force-dynamic`.** Es correcto hoy —se
      eligió a propósito para que un negocio aprobado aparezca de inmediato—
      pero significa cero caché: cada visita golpea la base. Con el tráfico
      actual no se nota. Si el sitio se difunde en serio, el patrón a evaluar
      es revalidación por etiqueta (`revalidateTag` al aprobar) en vez de
      dinámico total.
- [ ] **Falta Content-Security-Policy.** Omisión consciente y documentada en
      `next.config.mjs` y `docs/seguridad.md`. Es lo que queda por hacer en
      seguridad de cabeceras.
- [ ] **`public/logos/itm.svg` no lo usa nadie.** La lista de logos
      institucionales de `lib/content.ts` solo tiene alcaldía y presupuesto
      participativo. O falta agregarlo, o sobra el archivo — es una decisión
      de contenido, no técnica.
- [ ] **Confirmar el origen y la licencia de las dos fotos del carrusel**, y
      si la de las casas de colores es de Manrique. Sin resolver.

**No se pudo revisar**

- [ ] **Vercel.** El conector de Vercel pide autorización y esta sesión no
      puede hacer el login, así que no se pudieron ver despliegues, variables
      de entorno, uso de Blob ni región de las funciones. Autorizarlo desde
      la configuración de conectores de claude.ai, o revisarlo a mano en el
      panel.
- [ ] **`npm run verificar`** (geo, constraints, campos personalizados y
      entorno). Necesita las credenciales de `.env.local`, que están fuera de
      permisos en esta sesión. Correrlo antes de desplegar.


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
- [x] **Los cuatro CTA, mismo ancho y misma altura.** El ancho lo desigualaba
      `items-start`; la altura, que "Ofrezco un servicio a domicilio"
      envuelve. Verificado en el navegador: 361x66 los cuatro, letra de 16px.
- [x] **El SVG del inicio se reemplazó por `ConstelacionBarrios`.** Sacarle
      los nombres de adentro lo dejó huérfano —una silueta con cinco puntos
      sin nombre ocupando media pantalla—, y la usuaria lo señaló. Ahora los
      nombres SON la constelación: Fraunces, desplazados, ninguna letra por
      debajo de 24px. Se fueron 201 líneas (el SVG entero y su CSS) y
      entraron 19.

### Accesibilidad, segunda vuelta — 2026-08-29

Hecho:

- [x] **Enlace "Saltar al contenido"** (WCAG 2.4.1, nivel A). No existía. El
      destino es un envoltorio en `app/(site)/layout.tsx`, no el `<main>` de
      cada página, para que funcione en las diez rutas sin depender de que
      alguien se acuerde de ponerle un id.
- [x] **Texto repetido.** "Comuna 3" de 4 a 1, "Manrique" de 8 a 5, medido
      sobre la página renderizada. Cuatro focos: la etiqueta del hero, el
      subtítulo, el encabezado de barrios y la sección de Aliados destacado,
      que decía "negocios" tres veces en tres líneas seguidas.
- [x] **Una sola copia del campo de formulario** (`components/CampoFormulario.tsx`).
      Había cuatro; dos ponían la `<label>` sin asociar y dejaban 18 campos sin
      nombre accesible — el lector de pantalla leía el placeholder en su lugar.

Pendiente:

- [ ] **Conseguir una foto de Manrique para el hero.** Decisión de la usuaria:
      reemplazar la constelación tipográfica por una foto real. El repo no
      tiene ninguna — solo dos del equipo y el isotipo. Requisitos: horizontal,
      mínimo 1600px de ancho, y consentimiento firmado si salen personas
      reconocibles. Con la foto en mano el trabajo restante es de una sesión:
      optimización, `alt` descriptivo y comportamiento en celular.
- [ ] **Probar Empleo y Servicios con los flags prendidos.** La corrección de
      los 18 campos se verificó por código y por typecheck, pero en el
      navegador solo se pudo comprobar Aliados: las otras dos rutas dan 404
      con los flags apagados. Antes de prenderlas, recorrer los dos
      formularios con lector de pantalla.
- [ ] **Decidir si las etiquetas de formulario suben a 16px.** Hoy quedaron
      unificadas en 14px, que es lo que ya usaba Aliados. Subirlas es
      coherente con el resto de lo que se hizo, pero cambia el aspecto de un
      formulario que hoy funciona — va con revisión visual aparte.

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

- [x] ~~**`useFormState` está deprecado.**~~ Hecho el 2026-08-30. La razón
      por la que estaba bloqueado era incorrecta: se verificó el
      `node_modules` del proyecto (React 18.3.1) en vez del React que Next
      vendoriza para el App Router, que sí exporta `useActionState`. Ver la
      sección del 2026-08-30, segunda vuelta.

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
