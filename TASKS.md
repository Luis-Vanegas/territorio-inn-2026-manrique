# Tareas del proyecto

## 🔎 Análisis de SonarCloud — 2026-08-31

Primer análisis sobre `main` (commit `d120aa7`). Marcó Security C (1 issue),
Reliability C (35) y Maintainability A (146). **Las notas engañan**: de los 182
hallazgos, uno solo tenía consecuencia real.

Proyecto público, así que la API se consulta sin credenciales:

```bash
curl -s "https://sonarcloud.io/api/issues/search?componentKeys=Luis-Vanegas_territorio-inn-2026-manrique&impactSoftwareQualities=RELIABILITY&statuses=OPEN,CONFIRMED&ps=50"
```

- [x] **Los 4 `<label>` sin asociar de `/admin/campos`** (`typescript:S6853`).
      El único con consecuencia. Ver la tarea de `CampoFormulario` más abajo.

Revisados y descartados, con el porqué —para no volver a auditarlos:

- **El modal de registro (`S1082`, `S6847`, `S6848`) es un falso positivo.**
  Sonar pide un listener de teclado en el mismo elemento que tiene el
  `onClick`; `ModalRegistroExitoso.tsx` cierra con `Escape` desde un listener
  a nivel documento (línea 48). Funcionalmente está cubierto.
- **Los 9 «ambiguous spacing» (`S6772`)** son formato de JSX.
- **Los 9 regex «super-linear» (`S8786`)**: seis están en scripts que corre el
  equipo. Los tres de la aplicación (`lib/sitio.ts`,
  `TarjetaEmprendimiento.tsx`, `camposPersonalizados.schema.ts`) son todos el
  mismo patrón de recortar barras o guiones bajos (`/^_+|_+$/g`) sobre
  entradas ya acotadas por Zod y `maxLength`. Riesgo real: despreciable.
- **`Error` como nombre de función (`S2137`, 3 casos)**: tapa el `Error`
  global dentro de esos archivos. Ninguno de los tres usa `new Error()` en el
  mismo alcance. Es un olor, no un defecto.

Pendiente:

- [ ] **El único issue de seguridad está en `scripts/extraer-manrique.mjs:240`**
      (`jssecurity:S8707`): construye una ruta desde argumentos de línea de
      comandos sin validarla, así que un argumento torcido puede salirse del
      directorio previsto. Es un script de mantenimiento que corre el equipo,
      no un endpoint público — por eso no es urgente, pero se cierra con una
      validación de la ruta antes de tocar el disco.
- [ ] **Coverage sin configurar, porque no hay tests.** Es el dato de fondo
      más pesado de todo el informe, y no lo arregla ninguna regla de Sonar.
      Con Empleo y Servicios ya abiertos al público, lo que más valor tendría
      es una prueba del camino de registro de punta a punta — el mismo que se
      recorrió a mano el 31 (ver el QA de producción más arriba).

      Ojo con el presupuesto: la cuenta tiene $0 en GitHub Actions, así que
      hoy los tests se correrían a mano, igual que `npm run verificar`.

## 📷 Fotos propias en el carrusel — 2026-08-31

Luis reemplazó las dos fotos del carrusel por otras tomadas por él. Con eso
queda resuelta de paso la licencia, que estaba sin confirmar desde el 29.

En el repo quedan solo las versiones optimizadas; los originales se movieron a
`originales/`, que está en `.gitignore` — misma convención que ya seguía el
proyecto.

- [x] **`manrique-iglesia.jpg`** (1080x823, 327 KB). La aguja de la iglesia
      entre el mar de casas de ladrillo.
- [x] **`manrique-casas-arcoiris.jpg`** (1400x1867, 626 KB). Las casas
      pintadas sobre la ladera con el arcoíris bajando al agua.
- [x] **Avanza solo cada 6 s, con botón de pausa.** Ver el encabezado de
      `components/CarruselFotos.tsx` para el porqué de cada decisión.

Dos cosas que costaron y conviene no volver a aprender:

- **No recortar las fotos del carrusel.** El primer intento las recortó a 3:2
  apaisado, dando por hecho que el carrusel era horizontal. No lo es: medido
  en el navegador, el contenedor es de **557x744 — vertical**, y encima aplica
  `object-cover`. O sea que el recorte previo se sumaba al del contenedor y la
  foto salía ampliada y sin composición. Se entregan enteras y que recorte el
  contenedor.
- **Next 16 degrada `quality` EN SILENCIO.** El default de `images.qualities`
  pasó a `[75]`, y un `quality={90}` que no esté declarado en esa lista no
  falla ni avisa: se ajusta al valor más cercano. Está declarado en
  `next.config.mjs` y verificado en el navegador (`&q=90` en la URL de
  `/_next/image`). Si alguien saca esa línea, la calidad baja sin que nada se
  rompa.

Pendiente:

- [ ] **`originales/20250129_221336.dng` no se pudo usar.** Es un RAW de
      cámara: ningún navegador lo muestra, y `sharp` tampoco lo abre
      (`tiff2vips: samples_per_pixel not a whole number of bytes`). Son 36 MB
      que hoy no sirven para nada. Si esa foto vale la pena, hace falta
      exportarla a JPG desde el celular o desde un editor y pasarla de nuevo.

## 🧪 QA de producción — 2026-08-31

Primera vez que el registro se recorre **entero contra producción**, con
escritura real en la base y borrado después. Hasta hoy solo se había probado
en local o por código, y hay antecedente de por qué eso no alcanza: el commit
`303db1c` arregló que Servicios **no guardaba nunca** y fallaba en silencio.

Antes de empezar: base en cero (0 candidatos, 0 servicios, 0 portafolios,
28 categorías de catálogo).

Lo que pasó:

- [x] **Empleo guarda.** Redirige a `/empleo?registrado=1` con confirmación, y
      la fila llega a `candidatos` con `estado = 'pendiente'`.
- [x] **Servicios guarda**, con sus cuatro consentimientos presentes en el DOM
      — el bug de `303db1c` no volvió. Redirige con el token.
- [x] **El compresor del navegador funciona en producción.** Un PNG de 800x600
      salió convertido a `.webp` de 3,9 KB antes de subir. `lib/imagen/comprimir.ts`
      verificado en vivo, no solo en local.
- [x] **El reparto público/privado es correcto.** `nombres` y `apellidos`
      quedan en `servicios_privado`; en `servicios` solo el nombre público
      (primer nombre + primer apellido), tal como promete la ayuda del campo.
- [x] **La moderación aísla de verdad.** Con el registro en `pendiente`, ni el
      nombre, ni el correo, ni la IP, ni la URL de la foto aparecen en la
      vitrina pública.
- [x] **El fix del Blob derivable está confirmado en producción.** La URL con
      sufijo aleatorio responde 200; la URL construida solo desde el `id` —que
      era el bug— responde **404**.
- [x] **La IP en claro está declarada.** `servicios_privado.ip_registro` guarda
      la IP sin hashear, y eso es deliberado: `ip_hash` existe solo para
      `aliados_consentimiento`. La política publicada la declara con su
      finalidad ("seguridad y prevención de abuso") y dice que no se publica.
      Cubierto para la Ley 1581.

Lo que el QA dejó al descubierto:

- [ ] **Un blob huérfano, y confirma el pendiente de arriba en vivo.** Al
      borrar la fila de prueba por SQL, la foto quedó viva en el Blob:
      `servicios/c2408d18-c471-4ff9-acdc-2878f8fbcc93-9MzNtTnuNF4Wk4FmjaZ62aEsJH3UI7.webp`
      Hay que borrarla a mano — la CLI pide un token de lectura-escritura que
      no está en las variables del proyecto (la app sube por OIDC), así que va
      desde el panel o con `vercel blob del <url> --rw-token <token>`.

      Lo importante no es este archivo: es que **el arreglo de hoy cubre el
      rechazo desde moderación, no el borrado de la fila**. Cualquier camino
      que borre un servicio sin pasar por `moderarServicio` deja la foto
      viva. Es el mismo agujero de los 3 huérfanos que aparecieron en el
      vaciado, con una boca menos.

Lo que NO se pudo probar:

- [ ] **El panel de moderación con los registros a la vista.** Requiere
      credenciales de admin, que esta sesión no tiene ni debe pedir. Falta
      confirmar que un moderador ve el registro, lo aprueba y aparece en la
      vitrina. **Es el último tramo del camino sin verificar.**

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

- [x] **Los warnings de React de `/servicios/registro` y `/empleo/registro`.**
      Cerrado en `3668ff6`. El diagnóstico anterior apuntaba al patrón de
      repoblado y anticipaba un refactor de los dos formularios; **no era eso**,
      y el arreglo terminó siendo de cuatro líneas.

      El warning de `key` no venía de ningún `.map` — todos tenían key, como
      decía la nota. Venía de la **opción vacía** de cuatro `<select>`
      (`categoria_id`, `como_consigue_clientes`, `formacion`, y
      `nivel_formacion` en Empleo):

      ```jsx
      <option value="">Elige uno…</option>   ← estática, sin key
      {OPCIONES.map((o) => <option key={o} …>)}
      ```

      Cuando una opción estática convive con un `.map`, React recibe los hijos
      del `<select>` como UNA lista y le exige key a todos, incluida la
      estática. Por eso el warning se atribuía a `CampoFormulario`: el array se
      arma dentro de la función `children` que ese componente ejecuta.

      Cómo se localizó, porque leyendo el código no se ve: se instrumentó
      `CampoFormulario` para recorrer el árbol que devuelve `children()` y
      reportar los elementos con `key == null` y `_store.validated` falso, que
      es el criterio exacto que usa React. Salieron los tres campos de
      Servicios por nombre. Antes de eso, tres hipótesis razonables —el
      Stepper, el Fragment del campo `foto`, el `key` sobre `{...p}`— fueron
      todas descartadas por bisección contra el navegador. **La lección es que
      acá revisar los `.map` a ojo no alcanzaba: había que preguntarle a React
      cuál era.**

      El segundo warning (`Can't perform a React state update on a component
      that hasn't mounted yet`) **ya no existe**: se recorrieron las dos rutas
      con la consola limpia, y además se envió cada formulario para forzar el
      error del servidor y ejecutar el bloque de repoblado. Cero errores en las
      dos, antes y después del envío. Lo más probable es que se lo haya llevado
      la migración a `useActionState` de `c18d232`, posterior a aquella nota.
      El patrón de repoblado se queda como está.
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
      Arreglado en `lib/blob/fotos.ts`: sufijo aleatorio solo para `servicios`,
      así la URL solo la conoce quien lee la tabla privada. Sin filas que
      migrar. **Desplegado el 2026-08-31.**

      **Corrección del 2026-08-31: la frase "no llegó a filtrarse nada porque
      el módulo nunca se encendió" era falsa.** Se escribió sin poder consultar
      Vercel. Con la CLI ya autenticada se verificó que
      `NEXT_PUBLIC_MODULO_SERVICIOS` existe en Production desde hace 11 días y
      que `/servicios` y `/servicios/registro` responden 200 en el sitio
      público — o sea el módulo **estaba encendido**. Y sí hubo fotos: de los
      7 blobs que se borraron en el vaciado, 3 eran de servicios.

      Lo que se puede afirmar: la URL fue derivable desde la vitrina pública
      mientras esas fichas estuvieron visibles. Lo que NO se puede afirmar es
      que alguien la haya construido — no hay logs de acceso al Blob para
      saberlo, y los archivos ya no existen. La CLI no expone el historial de
      cambios de una variable, así que tampoco se sabe si el flag estuvo en
      `true` los 11 días completos.

      La lección no es el bug, es el método: **una afirmación de seguridad no
      se apoya en un supuesto sobre el entorno que no se pudo verificar.** Si
      la verificación está bloqueada, se anota como desconocido, no como
      descartado.
- [x] **Ningún flujo libera la foto de un servicio.** Portafolios tenía tres
      caminos que llaman `borrarFoto` (moderar→archivado, borrado propio);
      Servicios no tenía ninguno, y un servicio rechazado dejaba la foto en
      Blob para siempre — de ahí salieron los 3 blobs huérfanos. Cerrado en
      `7f8350c`: `soltarFoto()` en `serviciosPrivado.repo.ts` + llamada en
      `moderarServicio`. Queda abierto el caso de borrado por la persona, que
      no existe como flujo todavía.
- [x] ~~**Neon sigue con el cómputo fijo en 0,25 CU.**~~ Resuelto el
      2026-08-31 a pedido de Luis. Ver la tarea del 29 más abajo.
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

- [x] **El cómputo estaba fijo en 0,25 CU** (`min = max = 0.25`), sin
      autoescalado. No era un problema de cupo sino un techo de rendimiento:
      con cien personas a la vez, la base no podía crecer. **Cambiado el
      2026-08-31**: el endpoint de producción (`ep-rapid-mouse-aypzg5fv`) quedó
      en **min 0,25 / max 2 CU**, el techo del plan Free. Escala sola cuando
      hace falta y no cuesta más cuando está tranquila.

      El endpoint de `dev` (`ep-floral-tree-ayi6j6o2`) se dejó en 0,25 a
      propósito: no atiende público.
- [ ] **`suspend_timeout_seconds` sigue en 0**, decisión de Luis por ahora. La
      base se suspende apenas queda inactiva, y como las rutas públicas son
      `force-dynamic`, el primer visitante después de un rato de silencio paga
      el arranque en frío. En un sitio para vecinos que entran desde el celular
      con datos móviles, esa espera es justo la que hace cerrar la pestaña.
      Subirlo a unos minutos lo elimina, a cambio de más tiempo de cómputo
      facturado — y del cupo Free sobra (3,3 % usado al 29).
- [ ] **Vercel NO despliega en la región de la base.** Verificado el
      2026-08-31 con `vercel inspect`: las funciones salen en **`iad1`**
      (Virginia, us-east-1) y Neon está en **us-east-2** (Ohio). No coinciden,
      así que cada consulta paga el viaje entre regiones — y las rutas públicas
      son `force-dynamic`, o sea varias consultas por visita.

      Con el tráfico actual no se nota, y el salto Virginia↔Ohio es de los
      baratos (~10-15 ms ida y vuelta). Se arregla poniendo la región del
      proyecto en `cle1` (Cleveland, us-east-2) o moviendo la base a us-east-1.
      Decisión de una línea, pero conviene medirla antes: mover la base es más
      caro que mover las funciones.
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
- [x] ~~**Confirmar el origen y la licencia de las dos fotos del carrusel.**~~
      Resuelto el 2026-08-31 sin necesidad de confirmar nada: las dos fotos se
      reemplazaron por otras **tomadas por Luis**, así que la licencia es
      propia. Ver la sección de fotos más abajo.

**No se pudo revisar**

- [x] **Vercel.** Resuelto el 2026-08-31: se instaló la CLI (`npm i -g vercel`)
      y Luis corrió `vercel login`. La CLI le gana al conector de claude.ai,
      que pide un OAuth que la sesión no puede completar. Lo que se vio:

      - **Despliegues.** El auto-deploy desde `main` funciona: los tres pushes
        del 31 dispararon tres builds de Production, los tres `Ready` en menos
        de 30 s. Con eso quedó aplicado el `bodySizeLimit: '6mb'`, que vive en
        `next.config.mjs` y solo toma efecto en el build.
      - **Región.** `iad1`. Ver la tarea de arriba.
      - **Variables.** Las ocho de Production están puestas. `CRON_SECRET`,
        `IP_HASH_PEPPER`, `ADMIN_SESSION_SECRET` y `DATABASE_URL` como Secret.
      - **Los dos flags de módulo están ENCENDIDOS.** `/empleo`, `/servicios`
        y sus dos `/registro` responden 200 en el sitio público. La nota de
        más arriba que decía "cuando se quiera publicar el módulo Empleo" está
        vencida: ya está publicado.
      - **Blob.** Sigue sin verse. `vercel blob list` exige un token de
        lectura-escritura, y traerlo con `vercel env pull` sobreescribiría el
        `.env.local` de Luis, que tiene las dos líneas `DATABASE_URL` de la
        tarea de abajo. Se mira desde el panel, o con
        `vercel blob list --rw-token <token>`.
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

      **Estaba incompleto y se cerró el 2026-08-31.** El barrido cubrió el
      sitio público pero se salteó el panel: `FormularioCampo.tsx` de
      `/admin/campos` seguía con cuatro `<label>` sueltas, sin `htmlFor` y sin
      envolver el control. Lo encontró SonarCloud (`typescript:S6853`), no una
      revisión nuestra. Ahora usa `CampoFormulario` como el resto.

      Verificado que **no queda ninguna otra**: se barrieron todas las
      `<label>` de `app/` y `components/`; las demás o envuelven el control
      —que es válido en HTML— o llevan `htmlFor`.

      Lo que esto enseña: el comentario de `CampoFormulario` decía que la
      corrección no era parchear archivos sino que quedara UNA sola copia
      "para que no haya de dónde copiar mal". La intención era correcta y el
      barrido igual dejó una copia viva, porque se buscó donde se esperaba el
      problema —los formularios públicos— y no en todo el árbol. **El chequeo
      que hubiera servido es el que se corrió recién: barrer `<label>` en todo
      `app/` y `components/`, no ir archivo por archivo de memoria.** Mismo
      error de método que con el voseo.

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
