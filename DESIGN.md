# DESIGN.md — Constelaciones

Identidad visual del sitio. **Esta es la fuente de verdad**: si un cambio la
contradice, se discute acá primero, no se resuelve en silencio en un componente.

Derivada de las láminas de marca que hizo el equipo (`public/marca/laminas/`),
no de un gusto genérico. Cuando haya duda, esas láminas mandan: son el material
que los vecinos ya recibieron por WhatsApp y por redes.

## Quién lo usa

Dueños de micronegocios, locales y personas que prestan servicios en la Comuna 3
de Manrique, Medellín. Muchos entran desde el celular, con datos móviles, y no
trabajan en tecnología. Varios llegan por un enlace que alguien les pasó en
persona durante el registro en campo.

Eso decide todo lo de abajo. **No es un producto para gente técnica**, y cada
decisión que lo haga parecer un panel de desarrollador está mal, por más
elegante que se vea.

## Tipografía

Tres familias, cada una con un rol cerrado. Una cuarta no entra.

| Rol | Familia | Por qué |
|---|---|---|
| Títulos | **Fraunces** (serif) | Las láminas titulan en serif de alto contraste y caja normal («Menos cosas = mejor foto.»). Fraunces es la equivalente libre y ya estaba en el proyecto. |
| Cifras grandes | **DM Mono** (`font-cifra`) | Rol cerrado: solo la cifra de un indicador. Ver «DM Mono: rol cerrado» abajo. |
| Todo lo demás | **DM Sans** | Cuerpo, botones, etiquetas, menú y formularios. Geométrica, redonda, de buena altura de x: es lo más cercano a la sans amigable de las láminas. |

### Por qué se sacó JetBrains Mono

(La razón fue la monoespaciada en **todo el cromo**, no en las cifras. Por eso
DM Mono entra después, acotada a las cifras: ver «DM Mono: rol cerrado».)

Era la familia **más usada del sitio**: 316 clases `font-mono` contra 171 de
`font-sans` y 72 de `font-display`. Estaba en el menú, en los botones, en las
etiquetas y en los formularios.

JetBrains Mono es una tipografía monoespaciada **diseñada para escribir código**.
Nada en este producto es código, y el público no son programadores. El
monoespaciado en minúsculas de 12–16px, en mayúsculas y con tracking abierto,
se lee más lento y comunica «panel técnico» justo donde hacía falta comunicar
«esto es para vos, es fácil». Las láminas de marca no la usan en ningún lado.

Si algún día hay que mostrar algo que de verdad pide alineación monoespaciada
que no es una cifra, una fuente ni una fecha —una clave, un identificador—, va
en un `<code>` y lo resuelve la fuente del sistema. Las cifras grandes tienen su
propia familia: DM Mono.

### Parámetros

- Cuerpo: 16–18px, peso 400, interlineado 1.5–1.6.
- Títulos grandes: interlineado cerca de 0.95–1.15, tracking levemente negativo.
- Medida de lectura: 55–68 caracteres (`max-w-xl` en la práctica).
- Tamaños de titular en `vw` con techo: el titular de la home usa `10.5vw` en
  móvil porque «emprendimientos» mide 7.8 veces el cuerpo de fuente y no entra
  a más que eso en 320px. **Ese número se midió, no se estimó** — si cambia el
  titular, se vuelve a medir.

### Mayúsculas: excepción deliberada

La regla general de UI dice no forzar mayúsculas por CSS. Acá **sí se usan**
en las etiquetas cortas de sección («MINI GUÍA», «02 · FONDO Y ORDEN»,
«COMUNA 3 · MANRIQUE») porque es exactamente lo que hacen las láminas. Es voz de
marca, no descuido. No se extiende a la navegación ni a frases largas.

## Color

**Una sola paleta, dos luces** (decisión de Luis, 3-oct-2026). Constelaciones y
Firmamento comparten paleta: la de Firmamento. El sitio de día es la misma paleta
con luz de día, y el modo oscuro es la misma paleta con luz de noche. No hay un
gris ni un blanco puro en ningún lado.

| Token | Claro (día) | Oscuro (noche) |
|---|---|---|
| `hueso` (superficie) | `#F3EFE4` (= `estrella`) | `#0B1026` (= `noche`) |
| `tinta` (texto) | `#0B1026` (= `noche`) | `#F3EFE4` (= `estrella`) |
| `morado-texto` | `#A8309F` | `#E07AD8` (= `noche-morado`) |
| `azul-texto` | `#0957C3` | `#7FB0FF` (= `noche-azul`) |
| `morado` / `azul` (decorativos) | `#C64DBE` / `#3C8AF6` | `#E07AD8` / `#7FB0FF` |
| `amarillo` (= `sodio`) | `#F4CC48`, solo fill | `#F4CC48`, solo fill |

Antes: hueso `#FFFFFF`, tinta `#1A1A1A`; en oscuro hueso `#1A1A1A`, tinta `#F5F5F5`,
morado-texto `#CB5DC3`, azul-texto `#3C8AF6`.

Contrastes medidos con la fórmula WCAG (luminancia relativa), no estimados:

| Par | Claro | Oscuro |
|---|---|---|
| `tinta` sobre `hueso` | 16,37 | 16,37 |
| `morado-texto` sobre `hueso` | 5,09 (antes `#B139A9`: 4,54, sin margen) | 7,12 |
| `azul-texto` sobre `hueso` | 5,78 | 8,56 |
| `morado-texto` sobre `amarillo/15` | 4,87 | 5,26 |
| `azul-texto` sobre `amarillo/15` | 5,52 | 6,32 |
| `tinta/70` sobre `hueso` | 6,64 | 8,30 |
| `tinta/60` sobre `hueso` | 4,74 | 6,37 |
| `tinta/55` (borde de control) | 4,05 (pasa 3:1) | 5,54 |
| `tinta/12`, `tinta/15` (separadores) | 1,29 y 1,37, solo decorativos | 1,34 y 1,47 |
| `amarillo` sobre `hueso` | 1,35: nunca texto | 12,16 |

**Superficies elevadas**: no hay un token nuevo. Las tarjetas se separan con
`border-tinta/12` sobre el mismo `hueso`, como antes sobre el blanco; un `#FBF9F3` solo
agregaría un tono más sin que nada lo pida. Si una pieza lo necesita, se discute aquí.

**Paneles sin noche (4-oct, Luis):** `VentanaNoche` ya no prende `.modo-noche`: los paneles van enteros con los colores del tema (como la portada) y `VentanaNoche` solo enmarca con `tinta/12`. La noche queda solo en los mapas con teselas oscuras del modo oscuro; `/firmamento` público ya no existe y la puerta sigue el tema.

**Ventanas de noche** (`.modo-noche`):
En modo oscuro el fondo de la ventana coincide con el de la página, así que se
separa con un anillo `trazo` (`dark:ring-1 dark:ring-trazo`, y `dark:border-trazo` en
las piezas con borde propio). **Ventana de día** (`.modo-dia`): lo contrario, para lo
que muestra cómo se ve el sitio de día aunque el panel esté en oscuro (la vista
previa de la ficha).

**`theme-color`** (barra del navegador en el celular): `#F3EFE4` en todo el sitio,
que siempre abre en claro.

Fondo hueso, tinta azul noche, y los acentos de la constelación: morado, azul,
amarillo. (El acento se llamó «magenta» en este documento y «morado» en el
código y en el manual de marca: el nombre del token es **`morado`**, en todos
lados.) Los tokens viven en `tailwind.config.ts` y en `styles/globals.css`.

- El color fuerte es de los **acentos y las fotos**, no del cromo.
- Los estados semánticos (foco, error, éxito, destructivo) nunca se aplanan a
  neutro.
- Jerarquía con alpha sobre el lienzo (`text-tinta/70`, `border-tinta/12`), no
  con grises tintados sueltos. Ojo: los alphas de claro y de oscuro **no son
  los mismos** — el mismo porcentaje rinde más contraste sobre fondo oscuro.
  Los alphas salen de la escala de Tailwind (5, 10, 15…) más `8` y `12`, que se
  agregaron en `tailwind.config.ts`: sin ellos `border-tinta/12` no genera nada y
  el borde cae en el gris por defecto (#E5E7EB), que en oscuro se ve como una raya
  blanca.
- Un aviso sobre `amarillo/15` lleva texto `tinta`, nunca `azul-texto`: el azul
  da 3,6:1 sobre ese fondo en oscuro.

## Tema

El sitio **abre siempre en claro**, aunque el sistema esté en oscuro. La paleta
está diseñada en claro y un vecino que entra por primera vez no debería ver la
versión secundaria sin haberla pedido. Quien prende el oscuro con el selector
manda, y su elección se guarda. Se resuelve en un solo lugar:
`components/TemaInicial.tsx`.

**Superficies de terceros** (Leaflet): siguen al tema porque leen `--hueso-rgb` y
`--tinta-rgb`, no colores fijos. En oscuro, el popup, el botón de cerrar, el zoom
y la atribución del mapa son hueso oscuro con texto `tinta` claro y links
`azul-texto`; los marcadores y las teselas (gris claro de Esri) no cambian.
`leaflet.css` se carga después de `globals.css` (viaja con el chunk del mapa), así
que cada regla que lo pise cuelga de `.leaflet-container` o lleva `!important`:
una regla de una sola clase perdía el empate y el popup salía blanco con texto
claro. La estrella y el punto de OSM llevan trazo claro `estrella` (la estrella opaco,
el punto a media opacidad, para que siga más tenue) y así se ven en la leyenda y
sobre teselas oscuras; las formas de los grupos conservan su contorno `noche`
(`#0B1026`) y se sostienen por el color de relleno.

## Estructura

- `.seccion` (styles/globals.css) pone márgenes y ritmo vertical, **no ancho
  máximo**. En un monitor ancho mide ~1750px: cualquier `max-w-*` adentro deja
  el resto vacío y cualquier `justify-between` manda su segundo hijo al borde
  lejano. Si una sección va a ser ancha, que la use; si no, que sea de dos
  columnas como el Hero.
- Que el espacio separe antes que una línea. Antes de agregar un borde, nombrá
  qué quedaría ambiguo sin él.
- Ningún divisor cruzando una relación: una foto y su pie son una sola cosa.

## Movimiento

Todo movimiento va con `framer-motion` y respeta `prefers-reduced-motion`: quien
lo pidió ve el contenido aparecer directo. Solo se animan `transform` y
`opacity`; nada dura más de 900 ms.

**Sin excepciones**: todo movimiento va con framer-motion o CSS (Anime.js se quitó el 4-oct-2026 con la Constelación viva).

`components/ScrollReveal.tsx` hace fade + slide de 16 px al entrar en viewport,
una sola vez.

**Nada visible depende de JavaScript para dejar de estar en `opacity: 0`.** El
revelado arranca oculto en el HTML del servidor, así que hay que garantizar que
el contenido se vea si el JS no llega, tarda o falla. Son tres capas, y se
resuelven en `components/TemaInicial.tsx` y `styles/globals.css`:

1. Un script inline en `<head>` pone la clase `js` en `<html>` antes del primer
   pintado. **Sin `js`, todo elemento `[data-reveal]` se ve** (opacidad 1, sin
   desplazamiento).
2. Con `js` pero sin la clase `js-listo` (la pone el efecto de `TemaInicial` al
   hidratar) una animación CSS revela todo a los 4 s: cubre el bundle que no
   llega o que lanza un error. Con JS sano `js-listo` aparece enseguida y el
   revelado por scroll funciona como siempre.
3. Con `prefers-reduced-motion`, `ScrollReveal` no arranca oculto.

Quien agregue otro componente que arranque en `opacity: 0` debe marcarlo con
`data-reveal` (o usar `ScrollReveal`). Los textos que solo aparecen con `:hover`
(`opacity-0 group-hover:opacity-100`) no son revelado de carga, pero en celular
no existe el hover: nunca guardes ahí información que el vecino necesite.

Para el Firmamento (trazo de constelaciones con `pathLength`, parpadeo de
estrellas, día→noche con `useScroll`) rigen las mismas reglas; el detalle está en
`docs/plan-diseno-2026-10.md` §4.

## Objetivos táctiles

Todo control tocable mide **al menos 44 × 44 px** en móvil: botones, chips,
enlaces sueltos (se ensancha el área con `min-h-[44px]` e `inline-flex
items-center`, sin cambiar cómo se ve) y el zoom del mapa. Los enlaces dentro de
una frase de texto corrido quedan exentos.

## Firmamento

Propuesta aprobada en `docs/plan-diseno-2026-10.md` §2 y §8; esta sección es la
fuente de verdad de la identidad nocturna. Componentes hechos: el mapa (ver
«Mapa») y los paneles con sesión; la página pública `/firmamento` ya no existe
(4-oct-2026: redirige a `/`, que es la parte pública de datos, ver «Portada»); los tokens
viven en `lib/paleta.ts` y los esparce `tailwind.config.ts`.

### Metáfora

*De día el barrio, de noche el firmamento.* El sitio de día (hueso, como hoy) es
donde el vecino **hace** cosas: buscar, registrarse, aprender. El Firmamento es
donde se **leen** los datos del territorio. Vive en las «ventanas» de los paneles con
sesión (que son de día: ahí se hacen cosas). El sitio no abre en noche: el tema inicial sigue
siendo claro (ver «Tema»); el Firmamento es una superficie propia, no el modo
oscuro. Por eso sus colores no cambian con el selector de tema.

### Color

Hex fijos en `tailwind.config.ts`. Contrastes medidos con la fórmula WCAG
(luminancia relativa), no estimados.

| Token | Hex | Rol | sobre `noche` | sobre `noche-2` | sobre `noche-3` |
|---|---|---|---|---|---|
| `noche` | `#0B1026` | Fondo base | - | - | - |
| `noche-2` | `#121A3A` | Tarjetas, paneles | - | - | - |
| `noche-3` | `#1A2450` | Elevación, hover | - | - | - |
| `noche-activa` | `#202C62` | Fila activa de tabla | - | - | - |
| `estrella` | `#F3EFE4` | Texto principal | 16,37 | 14,80 | 12,94 |
| `tenue` | `#B7BEDC` | Texto secundario | 10,22 | 9,24 | 8,08 |
| `tenue-2` | `#8E97C2` | Texto de apoyo | 6,59 | 5,96 | 5,21 |
| `sodio` | `#F4CC48` | Acento, cifras clave (mismo valor que `amarillo`) | 12,16 | 11,00 | 9,61 |
| `ladrillo` | `#D9825B` | Acento cálido | 6,53 | 5,91 | 5,17 |
| `noche-morado` | `#E07AD8` | El `morado` de marca, en tono de noche | 7,12 | 6,44 | 5,63 |
| `noche-azul` | `#7FB0FF` | El `azul` de marca, en tono de noche | 8,56 | 7,74 | 6,77 |
| `menta` | `#5EEAD4` | Acento de datos | 12,72 | 11,50 | 10,05 |
| `trazo` | `#2C3A72` | Solo decorativo (rejillas, líneas tenues) | 1,75 | 1,58 | 1,38 |
| `trazo-2` | `#6573B0` | Borde de chips, botones e inputs | 4,15 | 3,75 | 3,28 |

Reglas:

- **Texto**: todo lo que es texto pasa 4,5:1 sobre `noche`, `noche-2` y
  `noche-3`. Sobre `noche-activa` pasan `estrella` (11,44), `tenue` (7,14) y
  `sodio` (8,50); `ladrillo` da 4,56 y `tenue-2` 4,60, así que sirven pero sin
  margen: no los uses ahí para texto pequeño.
- **Bordes de controles**: WCAG 1.4.11 pide 3:1. El `trazo-2` del prototipo
  (`#44528F`) daba 2,31:1 sobre `noche-2` y se subió a `#6573B0` (3,75:1). `trazo`
  no sirve de borde de un control: es decoración.
- **Fila activa**: el prototipo usaba `#23306A`, donde `tenue-2` daba 4,32 y
  `ladrillo` 4,28. Se oscureció a `noche-activa` (`#202C62`).
- **Nombres**: `noche-morado` y `noche-azul` llevan prefijo porque `morado` y
  `azul` ya existen para el sitio de día. Ningún token de Firmamento pisa a uno
  existente.
- **Alphas en oscuro**: se miden aparte (ver «Color»); el mismo porcentaje rinde
  distinto sobre `noche` que sobre hueso.

### Motivos

El motivo es el dato; nada decorativo que no salga de uno.

- **Estrella de cuatro puntas** = un negocio. También acompaña a cada indicador.
- **Líneas de constelación** = el árbol de expansión mínima (MST) **real** de cada
  constelación que encontró el análisis (HDBSCAN). No se dibujan líneas a mano ni
  inventadas.
- **Nombre de una constelación** en el mapa: Fraunces en itálica, sin caja.

### Reglas de cifras

- **Toda cifra visible lleva su fuente y su fecha debajo.** Sin excepción.
- **Una sola línea de fuente por grupo.** Cuando varias cifras juntas comparten fuente y
  fecha (las cuatro de un panel, que salen de la misma base en la misma carga), la línea
  va una vez, debajo del grupo (`GrupoCifras`), no repetida bajo cada cifra. Si una cifra
  del grupo viene de otro lado, esa lleva la suya y la del grupo dice de dónde salen las
  demás. Repetir cuatro veces «Fuente: base de datos de Constelaciones · hoy» no informa
  más y llena la pantalla de letra chica.
- La línea de fuente va en **DM Sans pequeña** (`text-xs`, `tinta/70` de día, `tenue` de
  noche), con el formato «Fuente: … · fecha». No en DM Mono (ver abajo).
- Ninguna pieza usa datos simulados.
- Las celdas con menos de 5 casos se muestran como «<5», con una nota que explique
  por qué (protege a los vecinos; ver `docs/seguridad.md`).
- El número de aliados nunca se escribe a mano y tiene dos fuentes según la pieza:
  las cifras de la **portada** («El barrio en cifras») y del panel de entidad usan solo los
  **agregados con k ≥ 5** de `obtenerDatosAbiertos` (el mismo repo de `/api/datos`), con
  celdas «<5»; los paneles del equipo y del negocio leen sus propios repos con guarda.

### DM Mono: rol cerrado

**Decisión vigente**: Luis, 3-oct-2026 (rediseño «Ventana al cielo»,
`docs/plan-rediseno-firmamento.md`). Enmienda la del 1-oct-2026, que había seguido a
la asesoría y ponía DM Mono también en fuentes y fechas: el primer Firmamento salió con
tanta letra monoespaciada chica que volvió a parecer un panel técnico, que es justo lo
que se quiso evitar al sacar JetBrains Mono.

Va en DM Mono (`font-cifra`, cargada en `app/layout.tsx`, pesos 400 y 500) **solo la
cifra grande de un indicador**: el número de un `Kpi` (también en la portada) o de
una ventana de noche (`text-3xl` o más). Nada más.

**No** va en DM Mono, aunque tenga números: las fuentes y las fechas (DM Sans pequeña,
ver «Reglas de cifras»), las insignias de conteo del menú, los valores al lado de una
barra o en una celda de tabla (DM Sans con `tabular-nums`), el menú, los botones, las
etiquetas, los formularios, el cuerpo de texto, las mayúsculas de sección («MINI
GUÍA»), los títulos y los números que son parte de una frase («3 trámites», «Paso 2
de 5»). Si dudas, es DM Sans.

Deuda conocida: varias piezas anteriores a esta decisión (líneas de fuente de `/firmamento`) todavía ponen fuentes y fechas en
`font-cifra`. Se pasan a DM Sans al tocarlas; un componente nuevo ya no lo hace.

Costo: una familia más que descargar con datos móviles. Se mitiga con solo dos pesos y
el subconjunto latino, `display: swap` (el texto se ve de inmediato con la fuente de
respaldo) y porque DM Mono solo se pinta en las pocas cifras grandes.

### Categorías

Los 15 colores de categoría del prototipo se confunden entre sí (amarillos,
naranjas, azules). Se reducen a **6 grupos, cada uno con color y forma**; la
categoría exacta va en el texto y en la ficha. **El color nunca es el único
portador**: la forma es la identidad, el color la refuerza. Los colores solo
identifican, nunca dicen bueno o malo.

| Grupo | Color | Forma |
|---|---|---|
| Comida | `ladrillo` | Círculo |
| Tienda | `sodio` | Cuadrado |
| Belleza | `noche-morado` | Rombo |
| Oficios y reparación | `noche-azul` | Triángulo |
| Salud | `menta` | Cruz |
| Otros | `tenue` | Anillo (círculo hueco) |

**En el mapa solo el color** (Luis, 4-oct-2026, como el tablero de la asesoría): cada
negocio es una estrella del color de su grupo y el TAMAÑO dice si es aliado o comercio de
OSM. Tradeoff aceptado: con daltonismo el mapa no basta para distinguir categorías; la
categoría exacta va escrita en el popup y en el `title` de cada marcador, y la forma sigue
en barras, listas y fichas.

Simulación de daltonismo (Machado 2009, severidad completa, distancia CIE76 entre
los colores de los grupos; visión normal: mínimo 29,0): la pareja más cercana baja
a 11,6 (Belleza y Oficios, protanopía), 13,1 (Salud y Otros, deuteranopía) y 18,3
(Comida y Belleza, tritanopía). Son diferencias pequeñas: por eso la forma es
obligatoria y cada marcador debe llevarla.

### Mapa

Aplica en la portada y en `/aliados` (`components/MapaAliados.tsx`).

- **Encuadre**: abre ajustado al polígono de la comuna; el paneo se limita a su
  margen (35 %) y fuera del polígono hay una máscara suave. Un aliado fuera del
  margen sigue en la lista pero el mapa no lo muestra.
- **Cada negocio es una estrella** de cuatro puntas del color de su grupo, con
  contorno `noche` (`svgEstrella`, `components/mapa/formas.ts`). **Aliado**: grande,
  28 px, opaco y con borde fino del color de la tinta. **Comercio de OpenStreetMap**:
  tenue (~55 % de opacidad, sin borde grueso), 12 px si está en una constelación y
  9 px si está suelto, debajo de los aliados. Caja táctil de 44 en todas. El mapeo
  categoría → grupo vive en un solo lugar, `lib/categorias/grupos.ts`. Los comercios
  de OSM **no son aliados**: se distinguen por el tamaño y la opacidad, y el texto habla de «comercios»,
  nunca de «negocios que hay».
- **Líneas de constelación** (interruptor «Líneas de constelación», `aria-pressed`,
  encendido de entrada): líneas finas y tenues del MST (`noche-3` sobre teselas
  claras, `noche-azul` sobre oscuras, opacidad ~0,35). El nombre en Fraunces itálica,
  sin caja, SOLO se escribe cuando hay una constelación elegida (no por zoom: el
  equipo lo vio recargado). Apagarlo deja las estrellas. Sin halos.
- **Leyenda** (equipo, 4-oct: «solo las categorías»): UNA fila con los 6 grupos (estrella
  de su color + nombre, sin conteos) y una línea: «Estrella grande: aliado de
  Constelaciones.» Nada de fuentes largas ni de explicar OpenStreetMap: la atribución
  corta (ODbL) la pone Leaflet en la esquina del mapa y no se quita.
- **Filtros del mapa** (sin controles nuevos): el desplegable «Ver una sola» lista
  cada constelación como «C04 · Carrera 31 · Tienda y víveres — 13 comercios»;
  si el JSON no trae `codigo` o un nombre descriptivo se usa lo que haya
  (`etiquetaConstelacion`). Al elegir una, bajo el mapa sale su mezcla en el estilo
  de la línea de fuente («Tienda y víveres 7 · Papelería 3 · Otros 3», las tres
  mayores y el resto junto; la línea empieza «Qué hay aquí, en C04 · Carrera 31 ·
  Tienda y víveres:»). El filtro de categoría de `/aliados` (`?categoria=`)
  también filtra las estrellas del mapa y la lista «Otros comercios» (mismos ids;
  `filtrarPorCategoria`): una constelación sin comercios de esa categoría
  desaparece y las líneas solo unen estrellas que quedan.
- **Mostrar todo, sea aliado o no**: el filtro de categoría de `/aliados` ofrece
  las categorías de aliados Y las que solo trae OSM, con los dos conteos sumados
  (`unirCategorias`; «Sin categoría» al final). Con cualquier `?categoria=` el mapa
  y «Otros comercios» salen siempre; si esa categoría no tiene aliados, la parte de
  aliados lo dice («Todavía no hay aliados en Salud y bienestar; abajo ves los
  comercios del barrio de esa categoría.») en vez de esconder todo.
- **Comercios sin nombre** (OSM no lo trae en ~1 de cada 3): se dibujan en el mapa
  y cuentan en la leyenda y en los conteos del filtro, pero NO van a la lista
  «Otros comercios» ni al buscador (no aportan nada para buscar; la condición vive
  solo en `comerciosConNombre`). Su ficha y el `aria-label` del marcador usan el
  título «Comercio sin nombre · Tienda y víveres» (`nombreVisible`), nunca un
  encabezado vacío. La línea de la lista lo aclara: «21 comercios con nombre; 9 más
  sin nombre aparecen solo en el mapa».
- **Estrella interactiva**: cada estrella y cada punto suelto se toca o se enfoca
  (Tab, Enter; Esc cierra) y abre un popup con lo que OSM trae: categoría, nombre,
  dirección, horario, cocina y web (solo las que existan; nada se rellena), la
  distancia en `font-cifra` si la persona activó «Ver los que tengo cerca», y la
  aclaración «Comercio mapeado en OpenStreetMap · no es aliado de Constelaciones».
  Dibujada mide 11 px, pero su caja táctil es de 44. **El popup no lleva botones
  ni enlaces**: la dirección es la forma de saber dónde queda. Horario y cocina
  se traducen (`lib/geo/comerciosOsm.ts`): «Mo-Sa 08:00-18:00» se lee «Lunes a
  sábado, 8:00 a. m. – 6:00 p. m.»; lo que no se puede interpretar se muestra tal
  cual. OSM no trae fotos, así que la ficha usa la forma de su grupo en vez de foto
  (el popup y las listas conservan la forma; el marcador del mapa es la estrella).
- **Otros comercios del barrio** (`/aliados`, bajo el listado de aliados): los
  mismos comercios de OSM como lista de información, con la misma ficha, línea de
  fuente en `font-cifra` («© colaboradores de OpenStreetMap (ODbL)», fecha del
  snapshot) y el subtítulo que aclara que no son aliados. No tiene controles
  propios: lo filtran el buscador y el filtro de categorías de la vitrina, y con la
  ubicación activa va ordenada por cercanía. Solo lista comercios con nombre y se
  ordena alfabéticamente. Se pinta por tandas de 12.
- **Buscador**: los comercios de OSM aparecen en los resultados (portada y
  `/aliados`) con la etiqueta «OpenStreetMap»; ante empate, primero los aliados.
- **Fuente**: una sola línea bajo la leyenda, en DM Sans pequeña: aliados aprobados de
  Constelaciones y comercios de OpenStreetMap (© colaboradores, ODbL), fecha del snapshot
  de OSM y fecha de la corrida. La misma atribución se
  suma al control de Leaflet mientras la capa está prendida.
- **En modo oscuro**: las teselas pasan a Esri `World_Dark_Gray_Base` (mismo
  servicio y atribución; las dos URL viven en `TESELAS`, `lib/geo/constantes.ts`) y
  cambian al vuelo con el selector de tema (`useTemaOscuro` de `lib/tema.ts`, un solo
  MutationObserver sobre `data-theme`, con `prefers-color-scheme` si falta). El contorno de la comuna toma `tinta` (5,4:1 sobre la
  tesela), las líneas de constelación pasan de `noche-3` a `noche-azul`
  (4,3:1) y el anillo del marcador activo a `estrella`. Los nombres de constelación
  usan `tinta` con halo `hueso`, así que siguen al tema. Popups y ficha de «Otros comercios»
  usan `hueso`/`tinta` del tema (ver «Tema»); la leyenda y la línea de fuente se
  leen con `tinta/75` y `tinta/70`.
- **Alternativa sin mapa**: enlace «Ver los aliados en lista» sobre el mapa.

### La página /firmamento (retirada)

Desde el 4-oct-2026 `/firmamento` redirige a `/`: los datos públicos (mapa, cifras,
constelaciones, barrios) viven en el inicio (ver «Portada»). Se borraron la página, el
índice de letras griegas, las secciones, el cielo proyectado, el horizonte, el sugeridor
público y la evaluación del modelo en lo público (la evaluación sigue en el panel del
equipo, Modelos). La Constelación viva de la puerta también se quitó (la puerta lleva una
foto) y con ella `animejs`.

### Firmamento con sesión (puerta y paneles)

Rutas `app/(firmamento)/firmamento/` (`entrar`, `negocio`, `equipo`, `entidad`).
Dirección «Ventana al cielo» (Luis, 3-oct-2026; `docs/plan-rediseno-firmamento.md`). La
puerta se rehízo el 4-oct-2026 sobre la pantalla de la asesoría, pero con los colores del
tema y sin beneficios ni cifras.

**De día, con ventanas de noche.** La puerta y los paneles son superficies de día
(`hueso`/`tinta`, siguen el selector de tema como el resto del sitio) porque ahí se
**hacen** cosas: entrar, moderar, editar la ficha, proponer una convocatoria. La noche
aparece solo donde se **leen** datos: una banda de cifras, un mapa, el observatorio. Es
la misma regla de «Metáfora», aplicada adentro de una página.

- **Encabezado**: el `SiteHeader` de siempre, arriba de la puerta y de los tres paneles
  (lo pone `app/(firmamento)/firmamento/layout.tsx`). El enlace a Constelaciones es el
  logo de siempre; no hay una barra propia ni una tarjeta «La cara de la red».
- **Puerta** (`/firmamento/entrar`): en escritorio, mitad y mitad a alto completo: a la
  izquierda la **foto de Manrique** (`public/fotos/manrique-iglesia.jpg`, `object-cover`)
  con un velo `noche` abajo y encima «Firma**mento**» (Fraunces, «mento» en `sodio`) y
  una sola línea («Los datos de tu barrio, trabajando para tu negocio.»; tonos fijos
  claros porque van sobre la foto); a la derecha, la **tarjeta** «Entra a Firmamento»
  (`hueso`/`tinta`, sigue el selector de tema) con tres **pestañas**: Mi negocio ·
  Equipo · Entidad. Son enlaces a `?rol=` (el servidor pinta la elegida, sin JS;
  `aria-current`; activa en `azul-texto` con texto `hueso`). Mi negocio: Google, «Sirve
  para entrar y para registrarte» y «¿Te registró el equipo? Usa el enlace que te
  enviamos por WhatsApp.». Equipo: correo y contraseña, o Google. Entidad: Google.
  En el celular la foto va arriba, baja (176 px), y la tarjeta debajo. **Sin enlace de
  registro, sin beneficios, sin cifras.** Los errores de ingreso (incluido `sin_equipo`)
  salen arriba de las pestañas (`role="alert"`, borde `amarillo`, texto `tinta`).
- **Panel** (`PanelShell`): bajo el `SiteHeader`, un encabezado de panel con el rol en
  mayúsculas cortas (`morado-texto`, la excepción de voz de marca), el nombre del negocio
  o de la entidad en Fraunces, el botón al sitio («Mi ficha pública», «Ver
  Constelaciones») y el menú de la persona. Debajo, **pestañas horizontales**: el ítem
  activo lleva `aria-current`, peso y una raya `azul` de 3 px que se desliza entre
  pestañas (`layoutId`; con menos movimiento salta directo). En el celular la fila se
  desplaza dentro de sí misma (nunca la página) y usa los rótulos cortos. El título de
  la sección (`h1`) abre el contenido; cada bloque titula con `h2`.
- **Pestañas del equipo**: cuatro, no dieciséis entradas sueltas: **Hoy** (Resumen,
  Moderación, Convocatorias, Peticiones), **Red** (Fichas de aliados, Entidades, Empleo,
  Campos del registro), **Datos** (Territorio, Datos abiertos, Modelos, Estadísticas) y
  **Guías** (Formalización, Marca, Ventas, Asesor). Dentro de cada una, sus secciones van
  como **subpestañas** con el mismo lenguaje (texto, peso y raya `azul` de 2 px, más
  chica). Las vistas por URL de una página (`?vista=`) usan el mismo componente
  (`SubPestanas`). Insignias de conteo reales: `amarillo` con texto `tinta`, DM Sans; la
  pestaña suma las de sus secciones. Negocio y entidad no tienen subpestañas.
- **Territorio del equipo**: mapa de barrios y mapa de constelaciones en `VentanaNoche`; el
  interruptor «Centralidades del POT» (apagado de entrada) dibuja las centralidades con
  contorno discontinuo y su nombre escrito (no solo color), con la nota «Uso interno: licencia
  de los polígonos pendiente». Solo en este panel, nunca en páginas públicas. Un cero de DM
  Mono en una cifra grande se pinta en DM Sans (`CifraLimpia`): la barra se lee «Ø».
- **Bloques**: `Tarjeta` (borde `tinta/12`, `rounded-xl`, título Fraunces). Con
  `plegable` es un `<details>` (`Plegable`: abre sin JS; con JS el contenido entra con
  un fundido de `AnimatePresence`) para ahorrar alto en lo que no se consulta todos los días; la
  variante `seccion` (sin marco, raya arriba) es la de las guías de `/formalizacion`.
- **Cifras**: `Kpi` (cifra en DM Mono, etiqueta en DM Sans, estrella `morado` de día y
  `sodio` de noche) dentro de un `GrupoCifras`, que imprime UNA línea de fuente para el
  grupo. Las bandas de cifras y los mapas van en una `VentanaNoche` (marco `tinta/12`,
  `rounded-2xl`, colores del tema; desde el 4-oct no es de noche). `Tarjeta` y `Kpi` leen
  `hueso`/`tinta` y sus variantes `[.modo-noche_&]`, así que sirven de día y de noche.
- **Pie**: atribución OSM y «Datos abiertos con supresión de celdas menores a 5», en DM
  Sans pequeña.
- **Formularios mudados de `/admin`**: escriben `hueso`/`tinta`, así que de día se ven
  como el resto del sitio sin remapeo. Botones de 44 px. Las tablas largas esconden
  columnas secundarias bajo `sm` en vez de desbordar a 320 px.
- **Panel del negocio** (`negocio/`): Inicio (saludo, «Tu ficha está al N %», cuatro
  cifras en una ventana de noche con una línea de fuente; «Semana a semana» plegada dentro de esa ventana, gráfico de 8 semanas en SVG propio con tabla `sr-only`, y con ocho semanas de ceros una sola línea honesta en vez del gráfico), Mi ficha (formulario del sitio, vista previa, lista de lo
  que falta con ✓ / + y texto, y «Cambios en tu ficha»: la bitácora de ese negocio con fecha y nombres de campo, sin valores), Para ti (convocatorias con «Fuente oficial» y
  «Compartir»), Mi constelación (el mapa en una ventana de noche; vecinos de OSM con
  «OpenStreetMap · no es aliado»), Mis clientes. Sin datos: estado vacío honesto, nunca
  cifras de ejemplo. La comparación con la categoría solo con 5 o más negocios.
- **Panel de entidad**: Observatorio (indicadores y mapa de constelaciones sin aliados
  en una ventana de noche, «Dónde apoyar primero», composición de la red por categoría
  con la forma de su grupo; la barra de una celda «<5» queda vacía), Convocatorias
  (vigentes con «Cierra en N días», formulario con error junto a cada casilla y resumen
  `role="alert"`, «Tus propuestas» con el estado en palabras) y Datos abiertos (qué
  publica, qué nunca sale, descargas y vista previa como tablas, nunca JSON crudo).
- **Vacío honesto**: una sección sin construir muestra «En construcción» y no rellena con
  cifras de ejemplo.

## Navegación

Ítems del encabezado (`components/SiteHeader.tsx`): Inicio · Aliados · **Aprende ▾**
(Formalización, Marca, Ventas) · Nosotros, más un solo botón, «Entrar» →
`/firmamento/entrar` (sin sesión; con sesión, el menú de la persona). No hay enlace
«Firmamento» ni «Registrarme»: el registro se ofrece después de entrar con Google.
Empleo e Inventario predictivo se suman solo si su flag está prendido (antes de
«Aprende»). «Escríbenos» sale del menú superior y queda en el pie (y al final del menú
móvil, que tiene espacio); el buzón no se pierde.

- **Aprende** es un botón con `aria-expanded` y `aria-controls`, no un enlace: abre un
  panel con tres enlaces. Se cierra con `Esc` (devolviendo el foco al botón), con clic
  afuera y al salir con Tab del panel. Abre con Enter/Espacio; no depende del hover.
  En el menú ☰ del móvil es el mismo botón, pero el panel se despliega en línea.
- Activo = peso, subrayado grueso y color (no solo color). «Aprende» está activo si
  estás en cualquiera de sus tres rutas.
- A 320 px el encabezado no desborda: el logo cede (la línea «COMUNA 3 · MANRIQUE» se
  oculta bajo 360 px) y el panel del ☰ se ancla al encabezado con `max-width` del
  viewport.

## Portada

La parte pública de datos (Luis, 4-oct-2026; reemplaza a la página `/firmamento`). De
día/oscuro según el selector, sin bandas de noche. Orden y nada más:

1. **Título corto** («Los negocios de la Comuna 3, Manrique, en un mapa.») y el
   **buscador** de negocios (`BuscadorNegocios`, que filtra el mapa de abajo). Sin hero grande, sin foto, sin botón de
   registro.
2. **El mapa** (uno solo en toda la página; ver «Mapa»): aliados + comercios de OSM,
   interruptor «Líneas de constelación», leyenda de tres renglones y, al lado (debajo en
   el celular), la **lista de constelaciones**: tocar una la enciende en el mapa
   (`useConstelacionElegida` + `BotonConstelacion`, el patrón de `MapaEstelar`).
3. **El barrio en cifras** (`CifrasBarrio`): cuatro `Kpi` en un `GrupoCifras` (aliados
   por datos abiertos k = 5, comercios de OSM, constelaciones; Cámara con su propia
   fuente), comercios por grupo de categoría con su % (`BarrasCategoria`), barrios como
   barras (comercios de OSM, con los aliados del barrio por datos abiertos en la nota) y
   las cinco constelaciones más grandes. Cada bloque, su línea de fuente.
4. Las guías (`EnfoqueSection`) y la galería de aliados, como estaban.

Sin título «Firmamento», sin letras griegas, sin método/F1/indicadores, sin sugeridor y
sin textos largos.

## Pie de página

Sin logos en SVG con texto: si no hay logos oficiales con permiso de uso, las
instituciones van como texto en DM Sans (Alcaldía de Medellín, Presupuesto
Participativo Comuna 3, ITM). Nunca monoespaciada ni texto dibujado como imagen.
Cuando lleguen los logos oficiales se reemplaza el texto por la imagen con su `alt`.

## Idioma

Español colombiano, registro «tú». Nunca voseo en texto visible — lo verifica
`scripts/verificar-voseo.mjs` dentro de `npm run verificar`. Los comentarios del
código sí van en rioplatense: los lee el equipo, no los vecinos.
