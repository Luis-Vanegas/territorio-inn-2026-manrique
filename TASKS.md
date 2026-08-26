# Tareas del proyecto
## 🟢 Para Antigravity (rápidas, mecánicas, acotadas)

### Unificar el registro a "tú" en todo el texto visible (eliminar voseo)

El sitio mezcla dos registros: "tú" (ya mayoritario, 14 archivos) y voseo
rioplatense/paisa ("podés", "tenés", "vos") colado en otros 17. Objetivo:
que todo quede en "tú" — consistente y sin sonar argentino.

**Tabla de conversión** (aplicar según el verbo de cada frase):
- podés → puedes · tenés → tienes · querés → quieres · sos → eres
- hacés → haces · sabés → sabes · necesitás → necesitas · arreglás → arreglas
- atendés → atiendes · vendés → vendes · prestás → prestas · debés → debes
- Contanos → Cuéntanos · Contame → Cuéntame · Contá → Cuenta
- Elegí → Elige · registrá → registra · pedilas → pídelas · publicá → publica
- Escribí → Escribe · Guardá → Guarda · Marcá → Marca · Completá → Completa
- vos → tú (como pronombre)
- "dejaste", "diste", "te equivocaste", "aceptaste" → **no tocar**, son idénticas en tú y vos

⚠️ Nota de Claude Code: la primera pasada de este audit (grep por
terminación "-és" acentuada) se comió las formas imperativas con pronombre
pegado ("Guardá", "Marcá", "Escribí", "Debés") y algunas líneas sueltas. La
lista de abajo ya está completa con una segunda pasada más ancha — si vas a
seguir el checklist, es esta versión, no una copia vieja que hayas guardado
en tu contexto.

**No tocar** comentarios de código (`// ...`, `/* ... */`, JSDoc) — son para
devs, no los lee ningún vecino. Solo texto que renderiza en el navegador:
JSX, placeholders, mensajes de error de Zod, `confirm()`.

Un checkbox por archivo, commit chico por archivo al terminar:

- [x] `app/admin/login/page.tsx` (línea ~30): "Si no tenés credenciales, pedilas al equipo del proyecto." → "Si no tienes credenciales, pídelas al equipo del proyecto."
- [x] `app/(site)/contacto/page.tsx` (línea ~18): "¿Tenés un caso puntual...?" → "¿Tienes un caso puntual...?"
- [x] `app/(site)/contacto/_components/FormularioContacto.tsx`:
  - línea ~88: `placeholder="300 123 4567 o vos@correo.com"` → `placeholder="300 123 4567 o nombre@correo.com"` (el "vos@" como ejemplo de email no tiene sentido en ningún registro, es un descuido)
  - línea ~108: `placeholder="Contanos tu caso o petición."` → `placeholder="Cuéntanos tu caso o petición."`
- [x] `app/(site)/aliados/_components/VitrinaAliados.tsx` (línea ~31): "No diste permiso de ubicación. Podés activarlo..." → "...Puedes activarlo..." (dejar "diste" como está)
- [x] `app/(site)/legal/servicios/page.tsx` — líneas ~30, ~57, ~59, ~83-84, ~129, ~162, ~165, ~168, ~173: aplicar la tabla de conversión en cada una (podés→puedes, hacés→haces, tenés→tienes, necesitás→necesitas, atendés→atiendes, vos→tú)
- [x] `app/(site)/aliados/estado/[token]/_components/EstadoAliado.tsx` — líneas ~195, ~258, ~365, ~427, ~428, ~532, ~634, ~650: "querés"→"quieres", "registrá"→"registra", "hacés"→"haces", "tenés"→"tienes", "Guardá"→"Guarda", "Escribí"→"Escribe", "Contá"→"Cuenta", "vendés"→"vendes", "prestás"→"prestas", "atendés"→"atiendes" (dejar "te equivocaste" como está)
- [x] `app/(site)/servicios/registro/page.tsx` — líneas ~15, ~38, ~50, ~51: "prestás"→"prestas", "publicá"→"publica", "arreglás"→"arreglas", "hacés"→"haces", "atendés"→"atiendes"
- [x] `app/(site)/legal/politica-datos/page.tsx` (línea ~84): "podés"→"puedes"
- [x] `app/(site)/legal/terminos/page.tsx` (línea ~82): "Podés"→"Puedes"
- [x] `app/(site)/aliados/registro/_components/SelectorUbicacionClient.tsx` — líneas ~91, ~111, ~113: "Marcá"→"Marca" (x2), "Podés"→"Puedes" (dejar "diste" como está)
- [x] `app/(site)/servicios/registro/_components/FormularioServicio.tsx` — líneas ~212, ~280, ~310, ~312, ~446, ~452, ~458: "sabés"→"sabes", "hacés"→"haces", "atendés"→"atiendes", "Elegí"→"Elige", "podés"→"puedes", "Tenés"→"Tienes"
- [x] `app/(site)/servicios/registro/_components/ConfirmarEnvio.tsx` (línea ~110): "Marcá"→"Marca"
- [x] `app/(site)/aliados/page.tsx` (línea ~87): "tenés"→"tienes"
- [x] `components/ModalRegistroExitoso.tsx` — líneas ~57, ~95, ~100: "Guardá"→"Guarda" (x2), "podés"→"puedes"
- [x] `lib/validation/peticion.schema.ts` (línea ~19): mensaje de error "Contanos..."→"Cuéntanos..."
- [x] `lib/validation/servicio.schema.ts` — líneas ~54, ~59, ~71, ~82, ~93, ~106, ~108, ~111, ~122: "Escribí"→"Escribe" (x3), "Contá"→"Cuenta", "hacés"→"haces", "Elegí"→"Elige", "atendés"→"atiendes", "Contanos"→"Cuéntanos", "Tenés"→"Tienes" (x3)
- [x] `lib/validation/portafolio.schema.ts` — líneas ~102, ~114, ~118, ~149, ~152: "Escribí"→"Escribe", "Marcá"→"Marca" (x2), "Debés"→"Debes" (x2)
- [x] `lib/actions/sesionAdmin.ts` (línea ~22): "Completá"→"Completa"
- [x] `lib/actions/moderarPortafolio.ts` (línea ~45): "Escribí"→"Escribe"
- [x] `lib/actions/moderarServicio.ts` (línea ~37): "Escribí"→"Escribe"

Al terminar todos: correr `npm run lint` y `npm run typecheck` para confirmar
que no se rompió nada (son solo strings, no debería haber impacto).

## 🔵 Para Claude Code (arquitectura, lógica compleja, decisiones)

Hecho el 2026-08-25 (todo en `main`, desplegado y verificado en vivo):

- [x] Ritmo vertical de la home unificado en tokens CSS (`--margen-editorial`,
      `--ritmo-seccion`, clase `.seccion`). Home: 6225px → 4394px.
- [x] `app/error.tsx` y `app/not-found.tsx` — la home es `force-dynamic` y
      consulta Neon 3 veces; sin boundary, un `fetch failed` la tumbaba con la
      pantalla default de Next.
- [x] SEO: `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `metadataBase`.
- [x] `hashIp()` falla cerrado sin `IP_HASH_PEPPER` (antes `?? ''` lo apagaba
      en silencio) y `CRON_SECRET` se compara con `timingSafeEqual`.
- [x] ~~`.github/workflows/ci.yml`~~ — se agregó y se quitó: la cuenta tiene un
      presupuesto de $0 sobre Actions y ningún job arrancaba. La verificación
      queda a mano: `npm run typecheck && npm run lint && npm run verificar`.
- [x] Rama `dev` en Neon (`br-long-lake-ay0jaw5y`) para dejar de trabajar
      contra producción desde local.

## 🔴 Bloqueado — necesita a Luis (cuentas, no código)

- [x] ~~Pegar la connection string de la rama `dev` en `.env.local`.~~ Hecho:
      `npm run verificar` corrió contra `dev` (51 s de CPU y +49 KB en esa rama,
      `main` intacta). Producción ya no se toca desde local.

## 🟡 Decisión de producto — cerrada

- [x] ~~Las 4 opciones huérfanas de `mayor_dolor`.~~ **No había decisión que
      tomar**: el commit `78710f9` dice que las preguntas 6 y 7 se reescribieron
      "con el texto del cliente: la 6 se acorta de 10 a 5 opciones". El recorte
      fue deliberado y del cliente.

      Y el esquema **no se limpia**: dos filas de `aliados_investigacion` tienen
      `proveedores` en `mayor_dolor` — respuestas reales anteriores al recorte.
      Angostar el CHECK falla contra ellas, y forzarlo significaría borrar
      respuestas de una investigación con personas. Documentado en el schema
      para que nadie lo reintente.

- [ ] **Conversación con el cliente, no técnica:** de 6 respuestas, 2 eligieron
      `proveedores` (un tercio). El cuestionario actual ya no puede capturar
      eso. Si el diagnóstico de proveedores importa para la investigación, hay
      que revisar la pregunta 6 con el cliente.

## ⚪ Anotado, no urgente

- [ ] **Content-Security-Policy.** Sigue siendo el punto 1 de "lo que falta"
      en `docs/seguridad.md`. Pide nonces por request y probarla contra el
      sitio real (tiles de CARTO, fotos del Blob, estilos inline de Next).
- [x] ~~Merge de `fix-voseo-registro`.~~ Mergeada sin conflictos (93 líneas
      cambiadas, 93 borradas). El checklist se había comido 4 mensajes en
      `camposPersonalizados` y en el aviso de foto fallida; corregidos aparte.
      Barrido por patrón sobre `app/`, `components/` y `lib/`: cero voseo en
      texto visible.

- [ ] **Proteger la rama `main` de Neon.** Está con `protected: false`. Es un
      checkbox en la consola y bloquea operaciones destructivas accidentales.
      La retención de historial es de 6 h: ese es todo el margen para un
      point-in-time restore.
