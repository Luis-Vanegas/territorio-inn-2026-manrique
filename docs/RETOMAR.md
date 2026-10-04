# Retomar el trabajo (traspaso del 3-oct-2026)

Para la IA o persona que siga. Leé primero `CLAUDE.md`, `AGENTS.md` y `DESIGN.md`. Este archivo
dice **dónde quedó todo** y **qué falta**, en orden de prioridad.

## Contexto en 5 líneas

- Constelaciones · Manrique: directorio de negocios de la Comuna 3 de Medellín (Next 16, Neon, SQL crudo).
- Concurso Territorio INN: entrega **11-oct-2026**. Luis quiere todo **funcional el 4-oct**: funcional antes que bonito.
- Dos lados:
  - **Constelaciones**: sitio público, solo vitrina.
  - **Firmamento** (`/firmamento/*`): con sesión, tres roles: negocio, equipo y entidad.
- Regla de Luis: **nada repetido en una misma página** (ni mapa, ni botón, ni dato). Firmamento va aparte del sitio público.
- Rama de trabajo: `reto/alineacion`. `main` es producción y Vercel la despliega solo al hacer push.

## Reglas que no se negocian

- **`.env.local` apunta a PRODUCCIÓN.** No lo leas ni corras migraciones contra él.
  - Para la base de prueba usá la rama de Neon `prueba-rediseno`, del proyecto `dark-shape-12148328`. La URL se saca del MCP de Neon o de la consola; **nunca la escribas en el repo**.
  - Para migrar o verificar contra la prueba, pasá `DATABASE_URL=<url de prueba>` inline.
- **Nada va a producción sin el OK explícito de Luis.**
- **Commits:**
  - Conventional commits en español.
  - **Sin `Co-Authored-By` ni atribución a IA.**
  - No hagas `npm run build`.
- **Textos y código:**
  - Texto visible en español colombiano con «tú», **nunca voseo**. Lo revisa `node scripts/verificar-voseo.mjs`.
  - Comentarios en rioplatense, y solo para explicar el porqué.
- **Servidor de desarrollo:** `npm run dev` ya usa `--webpack`, porque en Windows Turbopack rompe `next/font/google`.
  - `npm run dev` lee `.env.local`, o sea la base de producción: sirve solo para mirar.
  - Para probar flujos que escriben, levantá `npx next dev --webpack -p 3035` con la URL de prueba inline.
- **Verificación:** `npm run typecheck && npm run lint && npm run verificar`, con este último contra la base de prueba.

## Estado de `reto/alineacion` (HEAD `fdc3ee3`)

Todo lo siguiente está integrado, verificado y con QA pasada (sin hallazgos críticos):

- **Rediseño «Ventana al cielo»:**
  - Puerta de Firmamento con menú de 3 roles.
  - Paneles de negocio, equipo y entidad con piezas únicas (`Tarjeta`, `Kpi`, `GrupoCifras`, `VentanaNoche`).
  - Constelación viva con Anime.js.
  - Capa interna de centralidades del POT.
- **Moderación con sugeridor en un clic:** migración **034**.
- **Accesos:** migración **035**.
  - Invitaciones de un solo uso para entidades y moderadores.
  - Moderadores guardados en base (`admins.google_sub`).
  - Vincular cuenta ↔ negocio desde el panel del equipo y «Enviar acceso» por WhatsApp.
  - `scripts/verificar-accesos.mjs`.
- **Correcciones de QA:**
  - Error de Leaflet en `MapaBarriosClient`.
  - `coalesce` de arreglos nulos en `portafolios.repo.ts`.
  - DM Mono solo en las cifras grandes.

**Producción** (`main` = `5d66fc8`): Firmamento v1, migración 033 y el **parche de seguridad**. Una cookie de vecino pegada como `admin_session` ya no entra. Las migraciones **034 y 035 NO están en producción**.

## Trabajo en curso (worktrees en `.claude/worktrees/`, sin integrar)

Revisá cada uno con `git log reto/alineacion..<rama>`. Si el agente no terminó, retomá el trabajo con su consigna.

| Prioridad | Rama | Qué es |
|---|---|---|
| **1** | ~~`worktree-agent-ae10328fa06ce247c`~~ | **Registro dentro de Firmamento: INTEGRADO** (4-oct). Recorrido punta a punta OK en prueba. Pendiente: probar el retorno real de Google al registro en producción; la pestaña «Inicio» se marca activa en `/firmamento/negocio/registro` (`NavPanel.tsx:23`). |
| 2 | ~~`worktree-agent-ac5f06e841345bdf3`~~ | **Paleta C + portada sin duplicados: INTEGRADO** (merge + `d13e7c3`: un solo botón de registro, el del Hero). Falta ver los paneles con sesión con la paleta nueva. |
| 3 | `worktree-agent-ae10f813816819b8a` | **Vigía vivo** (opcional para la entrega) |

### 1 · Registro dentro de Firmamento

Hallazgo de raíz: `lib/actions/registrarPortafolio.ts` **no lee la sesión**, así que los negocios quedan sin `usuario_id`. Por eso hoy solo 1 de los 8 aprobados está vinculado.

Lo que tiene que quedar:

- **Registro con sesión:**
  - El formulario se mueve a `app/(firmamento)/firmamento/negocio/registro/page.tsx`, con `exigirNegocio()`.
  - El `usuario_id` sale **solo** de `sesionActual()` y `origen_registro` queda en `propio`.
  - El resto del registro no cambia: Zod, `ubicacionEnManrique`, rate limit, fotos, sugeridor, consentimiento de la Ley 1581, bitácora y `barrio_oficial`.
- **Redirección:** `/aliados/registro` redirige a la nueva ruta, desde el **único** `redirects()` de `next.config.mjs`. Sin sesión pasa por `/firmamento/entrar?rol=negocio` y, después de Google, tiene que volver al registro (con `?destino=`).
- **Enlaces:** todos los «Sumar mi negocio» apuntan a la nueva ruta. Buscá `aliados/registro` con rg en todo el árbol.
- **Registro asistido** desde el panel del equipo, para quien no tiene Google:
  - `origen_registro = 'asistido'`, con `consentimiento_asistido` y `capturado_por` (el correo del moderador).
  - Al final muestra el enlace personal para mandarlo por WhatsApp.
- **Panel del negocio:**
  - Botón **«Mi ficha pública ↗»** en el encabezado.
  - **Vista previa en vivo** «Así te verán en Constelaciones» junto al formulario de registro y de Mi ficha. Reutiliza la tarjeta pública real. Es la idea del prototipo del asesor (`firmamento-app/pantallas/02` y `03`), sin su estética nocturna.
- **Recorrido de punta a punta** contra la base de prueba:
  1. Visitante → puerta.
  2. Vecino se registra → queda con su `usuario_id`.
  3. Moderador aprueba → aparece en `/aliados` → «Mi ficha pública» la abre.
  4. Registro asistido funciona.
  5. Nadie registra a nombre de otro ni sin sesión.
  6. El lado público queda intacto.

### 2 · Paleta C «una paleta, dos luces» + portada sin duplicados

- **Paleta** (decisión de Luis): de día, fondo crema `#F3EFE4` con tinta `#0B1026` y sodio `#F4CC48` como relleno; el modo oscuro es la misma paleta invertida. Cambia `--hueso-rgb` y `--tinta-rgb` en `styles/globals.css`.
  - Recalibrar `morado-texto` y `azul-texto` a 4,5:1 o más sobre la crema.
  - Barrer con rg los colores sueltos (`bg-white`, `gray-*`, hex).
  - Documentar todo en `DESIGN.md` › Color.
- **Portada:** Hero → **un solo mapa** (`AliadosDestacado`, con «Sumar mi negocio» y «Ver el mapa completo») → números → `EnfoqueSection` → `GaleriaAliados`.
  - `MetricasSection` sin banda de noche ni degradado. Solo cifras con los tokens del tema, sin botón de registro y con un enlace discreto «Ver más datos en Firmamento →».
  - La Constelación viva queda **solo** en `/firmamento/entrar`.
- **Conflicto esperable** con el bloque 1 en `AliadosDestacado.tsx` y `MetricasSection.tsx`: el bloque 1 solo cambia los `href`. Al resolver, quedate con el diseño del bloque 2 y los `href` del bloque 1.

### 3 · Vigía vivo (opcional)

- Migración **036**: estado por fuente y por corrida.
- Endpoint de ingesta con `INGESTA_SECRETO`.
- Tarjeta «Fuentes del vigía» en Equipo › Convocatorias.
- Sección pública «Vigía» en `/firmamento`, con las reglas del raspado ético.
- Si el 4-oct no llega, se deja para después: no bloquea la entrega.

**4-oct:** paneles enteros con los colores del tema (`2183d44`; `VentanaNoche` ya no es de noche). El vigía queda para DESPUÉS de la entrega (decisión de Luis). Siguiente: QA final (en curso) → OK de Luis → producción con 034 + 035.

**4-oct (tarde):** integrado el Inicio con los datos (un mapa de estrellas y líneas de constelación, «El barrio en cifras»), `/firmamento` público y `/entrar` redirigen, menú con un solo «Entrar», puerta con foto, sin registro en lo público, Constelación viva y animejs borrados. QA final hecha y corregida. Siguiente: OK de Luis → producción con 034 + 035.

**4-oct, EN PRODUCCIÓN:** respaldo Neon `respaldo-pre-034-035`, migraciones 034 y 035 aplicadas, `main` = `5f98316`, Vercel OK y prueba rápida OK. Falta (con OK de Luis): borrar las ramas de Neon de prueba y respaldo, el script temporal y los worktrees viejos. El vigía queda para después de la entrega.

## Pasos para cerrar (en este orden)

1. Integrar las ramas a `reto/alineacion` (`git merge --no-ff`) en el orden 1 → 2 → 3 y resolver conflictos.
2. Correr `typecheck`, `lint` y `verificar` (este contra la base de prueba).
3. Levantar el servidor con la base de prueba y repetir el recorrido de punta a punta, tomando capturas a 1280 y 375 px en claro y en oscuro.
4. Mostrarle todo a Luis y **pedirle el OK para producción**.
5. Con el OK:
   1. Crear una rama de respaldo en Neon desde `main` (`br-purple-flower-ay0cs893`).
   2. Aplicar 034, 035 (y 036 si entra) con `DATABASE_URL=<producción> npm run db:migrar` inline.
   3. Hacer merge de `reto/alineacion` a `main` y push.
   4. Verificar que Vercel quedó en `success` (`gh api repos/Luis-Vanegas/territorio-inn-2026-manrique/commits/<sha>/status`).
   5. Hacer la prueba rápida de rutas: `/`, `/aliados`, `/firmamento`, `/firmamento/entrar`, redirecciones de `/admin` y `/mi-cuenta`, `/firmamento/equipo` con una cookie basura (tiene que dar 307), y `/api/admin/exportar` (tiene que dar 401).
6. **Avisos para producción con la 035:**
   - Cada moderador que entra por Google (`ADMIN_GOOGLE_SUBS`) tiene que **volver a entrar**: su cookie actual deja de valer.
   - Revisar `ADMIN_SESSION_SECRET` en Vercel.
7. Limpieza:
   - Borrar la rama de Neon `prueba-rediseno` y la rama de respaldo una vez confirmado.
   - Borrar los worktrees integrados. En Windows, primero quitá la junction de `node_modules` con `cmd /c rmdir`, **nunca** borres el `node_modules` real.
   - Los worktrees viejos `a0f5613…`, `a60cb10…`, `a8731e1…`, `aae64d8…` y `ae87f69…` borralos solo después de confirmar con `git merge-base --is-ancestor` que están integrados. `priceless-vaughan-33cd0a` y `documento2` no son nuestros: no los toques.

## Pendientes del lado de Luis (no los resuelve la IA)

- Probar el login real con Google y mandar la primera invitación a una entidad.
- Decidir entre `eom` y `leaf` (HDBSCAN), el presupuesto, los datos personales y la cesión de derechos al ITM.
- Confirmar la licencia de los polígonos del POT; hasta entonces no se dibujan en páginas públicas.
- Activar las Actions del vigía y sus secretos.
- Si las tiene, pasar las carpetas `integracion/` e `investigacion/` de la asesoría, que no vinieron en la descarga.

## Cifras que no se inventan

- F1 macro del sugeridor: **0,528** (holdout agrupado por nombre). **Nunca** citar el 0,632 de la asesoría.
- 20 constelaciones (HDBSCAN `leaf`) y 320 comercios de OSM (201 con nombre).
- Privacidad: k = 5 en todo dato abierto.
