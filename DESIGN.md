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
| Cifras, fuentes y fechas | **DM Mono** (`font-cifra`) | Rol cerrado, ver «DM Mono: rol cerrado» abajo. |
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
en un `<code>` y lo resuelve la fuente del sistema. Las cifras tienen su propia
familia: DM Mono.

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

Fondo hueso, tinta casi negra, y los acentos de la constelación: morado, azul,
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
«Mapa») y la página `/firmamento` (ver «La página /firmamento»); los tokens
viven en `lib/paleta.ts` y los esparce `tailwind.config.ts`.

### Metáfora

*De día el barrio, de noche el firmamento.* El sitio de día (hueso, como hoy) es
donde el vecino **hace** cosas: buscar, registrarse, aprender. El Firmamento es
donde se **leen** los datos del territorio. Vive en la página `/firmamento` y en
una banda nocturna de la portada. El sitio no abre en noche: el tema inicial sigue
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
- **Letras griegas** (α, β, γ…) numeran las secciones de `/firmamento`, en
  Fraunces itálica, color `sodio`.
- **Horizonte** de ladera con luces de casa y la aguja de la iglesia, como
  ilustración de cabecera.
- Titular de `/firmamento`: Fraunces itálica 300 con una palabra en `sodio` y peso
  600. El sitio de día conserva su titular actual.

### Reglas de cifras

- **Toda cifra visible lleva su fuente y su fecha debajo.** Sin excepción.
- Ninguna pieza usa datos simulados.
- Las celdas con menos de 5 casos se muestran como «<5», con una nota que explique
  por qué (protege a los vecinos; ver `docs/seguridad.md`).
- El número de aliados sale de `/api/datos`, no se escribe a mano.

### DM Mono: rol cerrado

**Decisión tomada**: Luis, 1-oct-2026, siguiendo a la asesoría (`manual.html`:
«DM Sans para todo el texto · DM Mono para cifras, fuentes y fechas» y «toda cifra
lleva su fuente y su fecha en DM Mono debajo»). Se eligió la opción de usar DM Mono
**en todo el sitio**, no solo en el Firmamento, y se descartó DM Sans con
`tabular-nums`. Esto enmienda «Dos familias. No tres.» (ver «Tipografía»).

Va en DM Mono (`font-cifra`, cargada en `app/layout.tsx`, pesos 400 y 500):

- **Cifras**: un dato numérico que se presenta como dato (indicadores, métricas,
  conteos de un panel, valores de una gráfica).
- **Fuentes**: la línea de fuente o crédito de un dato («Fuente: ...», «conteo
  anónimo, últimos 30 días»).
- **Fechas** y horas.

**No** va en DM Mono, aunque tenga números: el menú, los botones, las etiquetas, los
formularios, el cuerpo de texto, las mayúsculas de sección («MINI GUÍA»), los títulos
y los números que son parte de una frase («3 trámites», «Paso 2 de 5»). Si dudas, es
DM Sans.

Costo: una familia más que descargar con datos móviles. Se mitiga con solo dos pesos y
el subconjunto latino, `display: swap` (el texto se ve de inmediato con la fuente de
respaldo) y porque DM Mono solo se pinta en las pocas piezas de datos.

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
- **Aliados**: marcador con la forma y el color de su grupo (tabla de arriba), de
  26 px dentro de una caja táctil de 44. El mapeo categoría → grupo vive en un solo
  lugar, `lib/categorias/grupos.ts`.
- **Constelaciones** (interruptor con `aria-pressed`): halo punteado, líneas del
  MST y estrellas de cuatro puntas en `noche-3`, pequeñas, debajo de los
  marcadores de aliados. Son comercios de OpenStreetMap, **no aliados**: la
  leyenda lo dice y el texto habla de «comercios mapeados en OpenStreetMap»,
  nunca de «negocios que hay».
- **Filtros del mapa** (sin controles nuevos): el desplegable «Ver una sola» lista
  cada constelación como «C04 · Carrera 31 · Tienda y víveres — 13 comercios»;
  si el JSON no trae `codigo` o un nombre descriptivo se usa lo que haya
  (`etiquetaConstelacion`). Al elegir una, bajo el mapa sale su mezcla en el estilo
  de la línea de fuente («Tienda y víveres 7 · Papelería 3 · Otros 3», las tres
  mayores y el resto junto; la línea empieza «Qué hay aquí, en C04 · Carrera 31 ·
  Tienda y víveres:»). El filtro de categoría de `/aliados` (`?categoria=`)
  también filtra las estrellas del mapa y la lista «Otros comercios» (mismos ids;
  `filtrarPorCategoria`): una constelación sin comercios de esa categoría
  desaparece y las líneas solo unen estrellas que quedan. La leyenda cuenta lo que
  el mapa muestra por grupo («Comida (círculo) · 42»), aliados y estrellas, e
  incluye los comercios sin nombre («incluidos 9 comercios sin nombre»).
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
  cual. OSM no trae fotos, así que la ficha usa la forma de su grupo en vez de foto.
- **Otros comercios del barrio** (`/aliados`, bajo el listado de aliados): los
  mismos comercios de OSM como lista de información, con la misma ficha, línea de
  fuente en `font-cifra` («© colaboradores de OpenStreetMap (ODbL)», fecha del
  snapshot) y el subtítulo que aclara que no son aliados. No tiene controles
  propios: lo filtran el buscador y el filtro de categorías de la vitrina, y con la
  ubicación activa va ordenada por cercanía. Solo lista comercios con nombre y se
  ordena alfabéticamente. Se pinta por tandas de 12.
- **Buscador**: los comercios de OSM aparecen en los resultados (portada y
  `/aliados`) con la etiqueta «OpenStreetMap»; ante empate, primero los aliados.
- **Fuente**: bajo el mapa, en `font-cifra`: «© colaboradores de OpenStreetMap
  (ODbL)», fecha del snapshot de OSM y fecha de la corrida. La misma atribución se
  suma al control de Leaflet mientras la capa está prendida.
- **En modo oscuro**: las teselas pasan a Esri `World_Dark_Gray_Base` (mismo
  servicio y atribución; las dos URL viven en `TESELAS`, `lib/geo/constantes.ts`) y
  cambian al vuelo con el selector de tema (`useTemaOscuro` de `lib/tema.ts`, un solo
  MutationObserver sobre `data-theme`, con `prefers-color-scheme` si falta). El contorno de la comuna toma `tinta` (5,4:1 sobre la
  tesela), halos y líneas de constelación pasan de `noche-3` a `noche-azul`
  (4,3:1) y el anillo del marcador activo a `estrella`. Los marcadores de grupo
  sacan 5,5:1 o más sobre la tesela oscura. Popups y ficha de «Otros comercios»
  usan `hueso`/`tinta` del tema (ver «Tema»); la leyenda y la línea de fuente se
  leen con `tinta/75` y `tinta/70`.
- **Alternativa sin mapa**: enlace «Ver los aliados en lista» sobre el mapa.

### La página /firmamento

Ruta `app/(site)/firmamento/`, componentes en `components/firmamento/`. Siempre de
noche, sin seguir el selector de tema, y lee solo datos que ya existen (nada nuevo
en la base, ninguna pieza simulada).

- **`.modo-noche`** (styles/globals.css) envuelve la página y redefine los mismos
  tokens `hueso`/`tinta`/`azul-texto`/`morado-texto` con `noche`, `estrella`,
  `noche-azul` y `noche-morado`. Así el mapa existente (popups, controles,
  leyenda, ficha de comercio) sale con la paleta nocturna sin duplicar clases; el
  foco pasa a `sodio` (12:1 sobre `noche`). `MapaAliados` recibe `noche` y no sigue
  el tema; `constelacionElegida` y `alElegirConstelacion` dejan que la tabla
  controle el filtro del mapa. No hay un segundo mapa. **El mapa de /firmamento no
  lleva aliados individuales** (`portafolios` vacío): es un tablero de agregados
  k ≥ 5; los aliados se ven en `/aliados`.
- **Fraunces itálica** se carga solo en esta ruta (`layout.tsx` de la carpeta,
  variable `--font-fraunces-italica`, clase `.font-italica`): el layout raíz solo
  trae la Fraunces normal y sin ella el navegador inclinaría la letra a la fuerza.
  Va en el titular (itálica 300, «mento» en peso 600 `sodio`), en las letras
  griegas y en el índice.
- **Secciones** (solo las que tienen dato real): α cielo de hoy (4 indicadores
  con estrella + el cielo proyectado), β mapa estelar, γ tabla de constelaciones
  (tocar el código de una fila la enciende en el mapa; se apaga al tocarla otra
  vez), δ la brecha («tres miradas» lado a lado con la nota de que **no** son
  comparables como porcentaje, y la red por categoría con celdas «<5»), ε sugeridor
  en vivo, ζ indicadores de otras entidades, η método y límites. La vigía de
  convocatorias del prototipo no entra: aún no tiene dato propio en el sitio.
- **Cifras**: las de nuestros archivos se leen en `datos.ts` (OSM, modelo, datos
  abiertos); las de otras entidades están en `cifras.ts`, cada una con fuente y
  año. Si la base no responde, el indicador de aliados dice que no pudo
  consultarse; no se deja en cero.
- **Cielo** (`CieloConstelaciones`): comercios y líneas del MST proyectados del
  lat/lon real dentro del contorno de la comuna. Las líneas se trazan con
  `pathLength` (≤ 900 ms en total) al entrar en pantalla y las estrellas parpadean
  en 4 grupos desfasados (0,6 ↔ 1, de 3 a 6 s). Con menos movimiento aparece todo
  directo. Sin JavaScript se ve entero: framer rinde el trazo en 0, así que
  `.linea-cielo` lo anula sin la clase `js` y lo revela a los 4 s sin `js-listo`
  (las mismas tres capas de «Movimiento»).
- **Horizonte**: cada luz es un comercio de OSM y su posición de oeste a este es
  su longitud; la altura dentro de la ladera es solo reparto visual.
- **Índice**: barra pegajosa bajo el encabezado, con enlaces de 44 px; en pantallas
  angostas se desplaza dentro de su barra, no la página.
- **Tabla de constelaciones**: `caption`, `th scope`, botón de 44 px con
  `aria-pressed` en el código de cada fila. Bajo `sm` el radio y la mezcla bajan
  bajo el nombre para que no haya scroll horizontal a 320 px.
- **Celdas «<5»**: se muestran tal cual, con la nota de por qué (menos de 5
  negocios podrían señalar a una persona; Ley 1581).

## Navegación

Ítems del encabezado (`components/SiteHeader.tsx`): Inicio · Aliados · **Aprende ▾**
(Formalización, Marca, Ventas) · Firmamento · Nosotros, más el botón «Registrarme».
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

Orden: Hero → banda Firmamento (noche) → Aliados con mapa → Qué ofrecemos → Galería.
La banda es «El proyecto, en números»: las visitas se quitaron (las infla el propio
equipo; siguen en el panel de administración). Muestra datos del **territorio**, cada
uno con su fuente y su fecha en `font-cifra` debajo: comercios mapeados en OpenStreetMap
y constelaciones (de `public/firmamento/constelaciones.json`, fecha de la base de OSM),
aliados en la red (de la base de datos, fecha de hoy) y empresas registradas en Cámara
de Comercio en Manrique (2.626; Cámara de Comercio de Medellín para Antioquia,
Estructura Empresarial 2025). Cada cifra lleva la estrella de cuatro puntas. El
mensaje es «La brecha es nuestra línea base» y el botón lleva a `/firmamento`. La
transición día→noche es un degradado de borde (sin JS), no una animación.

El mapa y el buscador de la portada se comportan como `/aliados`: aliados (todos, sin
tope) y comercios de OSM, con los que no tienen nombre solo en el mapa; usan las mismas
funciones de `lib/geo/comerciosOsm.ts` y `lib/busqueda.ts`.

## Pie de página

Sin logos en SVG con texto: si no hay logos oficiales con permiso de uso, las
instituciones van como texto en DM Sans (Alcaldía de Medellín, Presupuesto
Participativo Comuna 3, ITM). Nunca monoespaciada ni texto dibujado como imagen.
Cuando lleguen los logos oficiales se reemplaza el texto por la imagen con su `alt`.

## Idioma

Español colombiano, registro «tú». Nunca voseo en texto visible — lo verifica
`scripts/verificar-voseo.mjs` dentro de `npm run verificar`. Los comentarios del
código sí van en rioplatense: los lee el equipo, no los vecinos.
