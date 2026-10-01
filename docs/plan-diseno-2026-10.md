# Plan de diseño — Constelaciones · Manrique (concurso, oct-2026)

> Complementa la Fase 3 de `docs/plan-reto-2026-10.md`. `DESIGN.md` sigue siendo la fuente
> de verdad: todo lo que aquí cambie la identidad se escribe primero en `DESIGN.md`.
> Revisión hecha el 1-oct-2026 sobre producción (Playwright, 375 px y 1440 px, axe-core WCAG A/AA).
> Capturas en `Asesoria/capturas-2026-10-01/` (fuera del repo).

## 1. Diagnóstico

**Lo que ya está bien (no tocar):**
- axe-core: **0 violaciones WCAG A/AA** en `/`, `/aliados`, `/aliados/registro` y `/formalizacion` (móvil, menos movimiento).
- Sin scroll horizontal en 375 px ni 1440 px en las 7 páginas revisadas.
- Tipografía según DESIGN.md (Fraunces + DM Sans) en las páginas del sitio.
- `ScrollReveal` ya respeta `prefers-reduced-motion`.

**El problema de fondo no es estético, es de relato.** La portada dice «La red social de
emprendimientos» y muestra un directorio. No aparece nada del trabajo de investigación ni la
idea de constelación, que es justo lo que pidió la asesora. El diseño tiene que **contar los
datos**: el territorio (312 locales en OSM), la red (8 aliados) y la brecha entre los dos.

**Hallazgos concretos (verificados):**

| # | Hallazgo | Dónde | Prioridad |
|---|---|---|---|
| D1 | **Sin JavaScript la página queda en blanco** bajo el encabezado (todo arranca en `opacity: 0`). En celular con datos lentos es lo primero que ve un vecino. Es el pendiente que ya anota DESIGN.md › Movimiento. | `components/ScrollReveal.tsx`, `Hero.tsx` | Alta |
| D2 | El mapa de la portada y de `/aliados` abre sobre todo Medellín; la comuna queda en un borde y hay **2 aliados fuera del polígono** (oeste de la ciudad). | `MapaAliados*`, `lib/geo/constantes.ts` | Alta |
| D3 | Los «logos» del footer son SVG con **texto en monoespaciada** («Alcaldía de Medellín», «Presupuesto Participativo»), no logos; contradice DESIGN.md (sin mono) y falta el ITM, que convoca. | `public/logos/*.svg`, `Footer.tsx` | Media |
| D4 | «El proyecto, en números» muestra 1.016 visitas (inflado por el propio equipo) y 8 negocios. No muestra ningún dato del territorio. | `MetricasSection.tsx` | Alta |
| D5 | Empleo aparece en el menú y en «El enfoque» como «en vivo». Decidir si se queda (el reto se llama *Empleo y Desarrollo Económico*) o se apaga con `NEXT_PUBLIC_MODULO_EMPLEO`. | `lib/content.ts` | Decisión |
| D6 | Menú con 8 entradas en escritorio. Formalización, Marca y Ventas son lo mismo para el vecino: «aprender». | `SiteHeader.tsx` | Media |
| D7 | Galería: 3 fotos de 8 negocios, una con franjas negras arriba y abajo. | `GaleriaAliados.tsx` | Baja |
| D8 | Objetivos táctiles < 44 px: chips «Comidas/Papelería/Ropa» (36), «Ver el mapa completo», «Ver todos», «Escríbenos» (20), zoom del mapa (30). | portada | Media |
| D9 | «El enfoque»: las filas 02 y 04 se ven con sangría distinta de 01, 03 y 05 en la captura. Confirmar si es intencional o un estado intermedio de animación. | `EnfoqueSection.tsx` | Verificar |

## 2. Dirección: «de día el barrio, de noche el firmamento»

Una sola metáfora que une marca y datos, ya propuesta en `manual.html`:
- **Sitio de día (hueso, como hoy)**: donde el vecino hace cosas (buscar, registrarse, aprender).
- **Firmamento de noche** (`#0B1026`, sodio `#F4CC48`, ladrillo `#D9825B`): donde se *leen* los
  datos. Aparece como página `/firmamento` y como **una banda nocturna en la portada** que
  hace la transición día→noche al hacer scroll.
- **El motivo es el dato**: estrella de cuatro puntas = negocio; líneas = árbol de expansión
  mínima de cada constelación real (HDBSCAN). Nada decorativo que no salga de un dato.

## 3. Cambios por pantalla

### Portada (nuevo orden)
1. **Hero**: titular orientado al reto (opciones para que el equipo elija, no se decide aquí):
   «El mapa vivo de la economía de Manrique» / «Cada negocio es una estrella». Fondo: las 312
   estrellas reales en tenue; al cargar se trazan 2–3 constelaciones. Buscador y botón se quedan.
2. **Banda Firmamento (noche)**: 4 cifras con fuente y fecha — 312 en el mapa abierto · 15
   constelaciones · 91 sueltos · 8 en la red. Mensaje: «La brecha es nuestra línea base».
   Botón «Ver el firmamento».
3. **Mapa de Aliados** encuadrado en la comuna con capa de constelaciones.
4. **Qué ofrecemos** (antes «El enfoque»), en tarjetas: Aliados, Aprende (formalización, marca,
   ventas), Convocatorias (vigía), Firmamento.
5. Galería y equipo.
- Quitar las visitas de «en números» o mostrarlas solo en el panel admin.

### `/firmamento` (página nueva, modo noche)
Secciones α–θ del prototipo `Firmamento-Data.html`, pero como componentes del sitio y leyendo
`/api/datos` + `constelaciones.json`: cielo de hoy (KPI), mapa estelar, tabla de constelaciones
(toca una fila → se enciende en el mapa), brecha territorio vs red, sugeridor en vivo, vigía,
indicadores con meta. Toda cifra con fuente y fecha debajo. Celdas < 5 como «<5» con una nota
que explique por qué (eso suma en ética).

### Mapa (portada y `/aliados`)
- `fitBounds` al polígono + `maxBounds` con margen; máscara suave fuera de la comuna.
- Capa de constelaciones (halo + líneas) con interruptor; filtro por constelación.
- Marcadores con forma + color por categoría (no solo color, por daltonismo).
- Agrupar marcadores (cluster) pasada la centena.

### Registro
- Sugeridor de categoría bajo «Nombre del negocio»: «Te sugerimos: Comidas (78 %) · Usar esta»;
  < 45 % muestra las 3 más probables. Animación corta de entrada.
- Al marcar el punto: avisar si cae fuera de la comuna y mostrar el barrio calculado.

### Mi cuenta
- Tarjetas «Para ti» (convocatorias) y «Tu negocio en números» (vistas y contactos por mes,
  gráfico simple de barras con `tabular-nums`).

### Navegación
Inicio · Aliados · Aprende ▾ (Formalización, Marca, Ventas) · Firmamento · Nosotros + botón
Registrarme. Empleo según la decisión D5.

### Footer
Logos oficiales en SVG (Alcaldía, PP Comuna 3, **ITM**) con permiso de uso; si no hay
permiso, texto en DM Sans, nunca mono.

## 4. Movimiento (framer-motion, ya instalado)

| Pieza | Animación | Regla |
|---|---|---|
| Revelado de secciones | fade + 16 px, 400 ms, una vez | **Visible sin JS** (ver D1) |
| Constelaciones | trazo de líneas con `pathLength` 0→1, 900 ms, escalonado | Solo al entrar en pantalla |
| Estrellas | parpadeo muy leve (opacidad 0,6↔1, 3–6 s, desfasado) | Apagado con menos movimiento |
| Día → noche en portada | fondo interpolado con `useScroll` en la banda Firmamento | Sin saltos de layout |
| Cifras | `NumeroAnimado` existente | Ya respeta menos movimiento (verificar) |
| Marcadores | aparición escalonada 30 ms | Máx. 300 ms total |
| Modales / fichas | `AnimatePresence`, escala 0,98→1 + fade, 200 ms | Foco atrapado y `Esc` |

Reglas: solo `transform` y `opacity`; nada > 900 ms; con `prefers-reduced-motion` todo aparece
directo. **Arreglo de D1**: un script inline en `<head>` pone la clase `js` en `<html>`; el
estado oculto solo existe bajo `.js` (o `initial={false}` en el render del servidor). Sin JS
o si el JS falla, el contenido se ve.

## 5. Accesibilidad e inclusión

- Mantener 0 violaciones de axe en cada página nueva (agregar `/firmamento` y `/mi-cuenta`).
- Contraste 4,5:1 también en noche; medir los alphas en oscuro aparte (DESIGN.md › Color).
- Paleta de categorías probada con simulación de deuteranopia/protanopia/tritanopia; cada
  categoría con forma o letra además del color.
- Objetivos táctiles ≥ 44 px (D8). Enlaces sueltos con área de toque ampliada (padding).
- Mapa: alternativa en lista para lector de pantalla (ya existe la lista en `/aliados`; enlazarla).
- Texto en «tú», sin voseo (`node scripts/verificar-voseo.mjs`).

## 6. Orden de trabajo (5–9 oct)

1. D1 (sin JS en blanco) y D8 (objetivos táctiles) — rápido y de riesgo cero.
2. Tokens de noche en `tailwind.config.ts` + sección «Firmamento» en `DESIGN.md`.
3. Mapa encuadrado + capa de constelaciones (D2).
4. `/firmamento` con JSON fijos → cambiar a `/api/datos` cuando exista.
5. Portada nueva (hero, banda nocturna, D4, D6) y footer (D3).
6. Sugeridor en registro y tarjetas de Mi cuenta.
7. Pasada final: capturas 375/768/1440, claro y oscuro, axe, Lighthouse, sin JS.

## 7. Criterios de aceptación

- Con JS apagado, la portada muestra titular, buscador y mapa (aunque sin animación).
- axe: 0 violaciones A/AA en todas las páginas públicas.
- Ningún objetivo táctil < 44 px en móvil.
- Mapa abre encuadrado en la Comuna 3.
- Toda cifra visible tiene fuente y fecha.
- `npm run typecheck && npm run lint && npm run verificar` limpio.

## 8. Lo que traen `manual.html` y `Firmamento-Data.html` (revisado el 1-oct)

Los dos archivos de la asesoría traen un sistema visual completo para el modo noche. Se
adopta casi todo; abajo, qué se toma, qué se ajusta y por qué. Contrastes **medidos**
(fórmula WCAG), no estimados.

### Se adopta tal cual
- **Tokens de noche**: `noche #0B1026`, `noche-2 #121A3A`, `noche-3 #1A2450`, `trazo #2C3A72`,
  `estrella #F3EFE4`, `tenue #B7BEDC`, `sodio #F4CC48`, `ladrillo #D9825B`, `morado #E07AD8`,
  `azul #7FB0FF`, `menta #5EEAD4`. Sobre `noche` y `noche-2` todos pasan 4,5:1
  (estrella 14,8–16,4 · tenue 9,2–10,2 · sodio 11–12,2 · ladrillo 5,9–6,5 · morado 6,4–7,1 · azul 7,7–8,6).
- **Motivos**: estrella de cuatro puntas en cada indicador; líneas de constelación = árbol de
  expansión mínima real (el motivo es el dato); **letras griegas** (α, β, γ…) para numerar
  secciones de Firmamento, en Fraunces itálica color sodio; horizonte de ladera con luces de
  casa y la aguja de la iglesia como ilustración de cabecera.
- **Reglas**: los colores de categoría solo identifican, nunca dicen bueno/malo; toda cifra
  con fuente y fecha debajo; ninguna pieza con datos simulados.
- **Componentes del prototipo** que se portan: KPI con estrella, «embudo de visibilidad»
  (territorio → red → contactos), barras horizontales por categoría, tabla de constelaciones
  que enciende el nodo en el mapa, caja del sugeridor con respuesta en vivo, índice
  pegajoso con las letras griegas.
- **Titular en Fraunces itálica 300** con una palabra en sodio y peso 600 (h1 del prototipo):
  buena firma para `/firmamento`; en el sitio de día se mantiene el titular actual.
- El guion del video (sección η del manual) arranca con «Manrique de noche parece un cielo»:
  la banda nocturna de la portada debe poder grabarse para esa toma.

### Se ajusta (el prototipo falla o choca con DESIGN.md)
| Qué | Problema medido | Ajuste |
|---|---|---|
| **DM Mono** para cifras, fuentes y fechas | DESIGN.md dice «dos familias, no tres» y sacó la monoespaciada a propósito | Usar DM Sans con `tabular-nums` para cifras y fuentes. Si el equipo quiere DM Mono solo en Firmamento, se escribe como excepción en DESIGN.md antes de usarla |
| `trazo-2 #44528F` en bordes de chips, botones e inputs | 2,3:1 sobre `noche-2`; WCAG 1.4.11 pide 3:1 para bordes de controles | Subir a un tono ≥ 3:1 (p. ej. aclarar hacia `#6573B0` y volver a medir) |
| `tenue-2 #8E97C2` y `ladrillo` sobre la fila activa `#23306A` | 4,32 y 4,28:1, bajo 4,5 | En la fila activa usar `tenue`/`estrella`, o oscurecer el fondo activo |
| **15 colores de categoría** | Varios se confunden entre sí aun sin daltonismo: sodio/panadería/modistería (amarillos), comidas/construcción/ropa (naranjas-rojos), azul/electrodomésticos (azules) | 6 grupos con color + forma (Comida, Tienda, Belleza, Oficios y reparación, Salud, Otros); la categoría exacta va en el texto y el tooltip. Validar con simulación de deuteranopia/protanopia |
| Chips (34 px) y botones (38 px) | Bajo 44 px táctiles | `min-height: 44px` |
| Tooltip que sigue al mouse (`#tip`, `pointer-events:none`) | No existe en celular ni con teclado | Ficha que se abre al tocar/enfocar un punto, con `Esc` para cerrar, y lista equivalente debajo del mapa |
| Puntos ya proyectados en SVG | No sirven para datos vivos | Generar desde `constelaciones.json` (lat/lon) |
| «Nuestra red tiene 7» (manual y guion) | Hoy la portada dice 8 | Leer el número de `/api/datos`; en el guion, decir la cifra del día de la grabación |
| Nombre «morado» (manual) vs «magenta» (DESIGN.md) | Mismo acento con dos nombres | Unificar el nombre del token en DESIGN.md |

### No se toma
- Fondo `.cielo` fijo con gradiente detrás de toda la página: en el sitio real solo va en
  `/firmamento` y en la banda nocturna; el sitio de día sigue abriendo en claro (DESIGN.md › Tema).
- Publicar el prototipo en Netlify como sitio aparte (sección θ del manual): Firmamento vive
  dentro del sitio en `/firmamento`; el HTML queda solo como referencia.
