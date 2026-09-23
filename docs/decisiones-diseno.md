# Decisiones de diseño

## Paleta

Negro tinta (`#1A1A1A`) en vez de negro puro, para que el contraste sea editorial y no de interfaz de software. La terracota (`#C55A3C`) que fue el acento único original se retiró del todo: el color ahora sale de la paleta de marca de Constelaciones (ver abajo). El token ya no existe en `tailwind.config.ts`, así que una clase `*-terracota` escrita por costumbre no compila a nada.

## Modo claro y oscuro

El sitio soporta los dos modos con un toggle persistente (`components/SelectorTema.tsx`, `data-theme` en `<html>`, sin `next-themes` — un script inline de ~10 líneas en `app/layout.tsx` alcanza y evita instalar una dependencia para esto). `hueso` y `tinta` no son dos temas con nombres distintos: son los mismos dos tokens de siempre (superficie / tinta de texto) que cambian de valor RGB según el modo, vía variables CSS en `styles/globals.css`. Esto es lo que permite que la migración a dark mode no haya tocado los ~55 archivos que ya escriben `bg-hueso`/`text-tinta`.

En modo claro el fondo pasa de hueso (`#F7F5F0`) a **blanco puro** — pedido explícito del equipo, por sobre la decisión editorial original de evitar blanco frío. En modo oscuro, `hueso` (superficie) es `#1A1A1A` y `tinta` (texto) es un casi-blanco (`#F5F5F5`).

## Paleta de marca — Constelaciones

El equipo mandó cuatro colores de marca: negro `#1A1A1A` (ya es la `tinta` del sitio, sin cambios), morado `#C64DBE`, azul `#3C8AF6` y amarillo `#F4CC48`. Verificados con la fórmula de contraste WCAG (la misma de `docs/sistema-diseno-a11y.md`), los tres vienen calibrados para verse bien sobre **fondo oscuro**, no sobre fondo claro: azul y amarillo ya cumplen AA (4.5:1) como texto sobre `#1A1A1A` tal cual, pero fallan sobre blanco (azul 3.41:1, amarillo 1.55:1 — este último falla por completo).

### Una función por color

Tres colores saturados repartidos al azar se leen como arcoíris. Por eso cada uno tiene **una sola función**, y la función decide el color, no el gusto:

| Color | Función | Dónde |
|---|---|---|
| **Azul** | Acción | Links, botones, estado activo del menú, anillo de foco, puntos del mapa, gráficos de estadísticas |
| **Morado** | Identidad | Etiquetas/kickers en mayúscula (`MEDELLÍN · 2026`), numerales de listas, hover del menú |
| **Amarillo** | Señal | Recuadros de aviso, el punto "en vivo", los `[CORCHETES]` a completar en las plantillas de marca |

Si dudas qué color lleva algo nuevo, pregúntate qué hace, no cómo se ve: si se toca, es azul; si nombra o etiqueta, es morado; si avisa, es amarillo. Todo lo demás es tinta.

### Base y `-texto`

- **Base** (`morado`, `azul`, `amarillo`): decorativo — bordes, iconos, fills, texto ≥24px.
- **`morado-texto` / `azul-texto`**: texto o fill con texto encima. Calibrados para cruzar 4.5:1 en cada modo (el valor cambia con `data-theme`).
- **`amarillo`**: sin variante de texto — no existe un amarillo lo bastante oscuro que siga leyéndose como amarillo. Solo fill, con `tinta` encima (11.25:1).

### Piso de contraste del texto neutro

`text-tinta/60` es el mínimo para texto chico: 4.6:1 sobre blanco y 6.4:1 sobre `#1A1A1A`. Por debajo (`/30`–`/55`) falla en uno o en los dos modos, y era lo que hacía que la letra chica "se perdiera" en oscuro. Se subieron 135 usos en un solo barrido. Las variantes `placeholder:`, `disabled:` y `hover:` no se tocaron (WCAG no exige contraste en placeholder ni en disabled).

### Superficies que no se invierten

El footer usa colores **fijos** (`bg-[#1A1A1A]`, `text-white/65`), no `bg-tinta`/`text-hueso`: esos tokens se invierten con el modo, y los logos institucionales están dibujados en claro (`#F7F5F0`). Con tokens, en oscuro el footer pasaba a ser una banda clara con los logos invisibles. Cualquier superficie que cargue una imagen pensada para un fondo concreto tiene que fijar ese fondo.

## Tipografía

Fraunces para titulares: serif variable con optical sizing, así el mismo archivo se ajusta de 140px a texto de apoyo sin perder carácter. Se aleja de la tipografía sans genérica de producto SaaS y aporta el peso editorial que pide una tesis territorial. Geist Sans para cuerpo: legible a 16-18px sin competir con los titulares. JetBrains Mono para datos y números: separa visualmente "lo narrado" (Fraunces/Geist) de "lo medido" (KPIs, coordenadas del mapa, numeración de fichas).

## Grid asimétrico editorial

Layouts centrados y simétricos comunican producto de software. Un grid de 12 columnas con títulos que rompen contra el margen izquierdo, columnas de ancho desigual y bloques desplazados verticalmente comunica reportaje digital — la referencia directa es cómo Rest of World y The Pudding maquetan texto largo junto a datos. La asimetría no es decorativa: fuerza al lector a recorrer la página como una nota, no a escanear una grilla de cards.

## Referencias visuales

- Rest of World — tipografía editorial + datos territoriales
- The Pudding — narrativa con datos, layouts no convencionales
- Selene Estudio — diseño colombiano con identidad territorial, sin clichés de startup
