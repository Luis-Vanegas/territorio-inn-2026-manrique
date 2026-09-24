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

Dos familias. No tres.

| Rol | Familia | Por qué |
|---|---|---|
| Títulos | **Fraunces** (serif) | Las láminas titulan en serif de alto contraste y caja normal («Menos cosas = mejor foto.»). Fraunces es la equivalente libre y ya estaba en el proyecto. |
| Todo lo demás | **DM Sans** | Cuerpo, botones, etiquetas, menú y formularios. Geométrica, redonda, de buena altura de x: es lo más cercano a la sans amigable de las láminas. |

### Por qué se sacó JetBrains Mono

Era la familia **más usada del sitio**: 316 clases `font-mono` contra 171 de
`font-sans` y 72 de `font-display`. Estaba en el menú, en los botones, en las
etiquetas y en los formularios.

JetBrains Mono es una tipografía monoespaciada **diseñada para escribir código**.
Nada en este producto es código, y el público no son programadores. El
monoespaciado en minúsculas de 12–16px, en mayúsculas y con tracking abierto,
se lee más lento y comunica «panel técnico» justo donde hacía falta comunicar
«esto es para vos, es fácil». Las láminas de marca no la usan en ningún lado.

Si algún día hay que mostrar algo que de verdad pide alineación monoespaciada
—una clave, un identificador, una columna de números que tiene que cuadrar—, va
en un `<code>` y lo resuelve la fuente del sistema, o se agrega `tabular-nums`
sobre DM Sans.

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

Fondo hueso, tinta casi negra, y los acentos de la constelación: magenta, azul,
amarillo. Los tokens viven en `tailwind.config.ts` y en `styles/globals.css`.

- El color fuerte es de los **acentos y las fotos**, no del cromo.
- Los estados semánticos (foco, error, éxito, destructivo) nunca se aplanan a
  neutro.
- Jerarquía con alpha sobre el lienzo (`text-tinta/70`, `border-tinta/12`), no
  con grises tintados sueltos. Ojo: los alphas de claro y de oscuro **no son
  los mismos** — el mismo porcentaje rinde más contraste sobre fondo oscuro.

## Tema

El sitio **abre siempre en claro**, aunque el sistema esté en oscuro. La paleta
está diseñada en claro y un vecino que entra por primera vez no debería ver la
versión secundaria sin haberla pedido. Quien prende el oscuro con el selector
manda, y su elección se guarda. Se resuelve en un solo lugar:
`components/TemaInicial.tsx`.

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

`components/ScrollReveal.tsx` hace fade + slide al entrar en viewport, una sola
vez, y respeta `prefers-reduced-motion` apareciendo directo.

**Pendiente conocido**: el titular de la home arranca en `opacity: 0` y depende
de JavaScript para verse. Si el JS falla o tarda, lo primero que ve un vecino es
una pantalla vacía. Funciona hoy, pero vale evaluarlo.

## Idioma

Español colombiano, registro «tú». Nunca voseo en texto visible — lo verifica
`scripts/verificar-voseo.mjs` dentro de `npm run verificar`. Los comentarios del
código sí van en rioplatense: los lee el equipo, no los vecinos.
