# Inicio: ficha del negocio, «Qué tengo cerca», estrellas y textos de OSM

## Objetivo
Pedido de Luis (6-oct-2026) sobre el inicio y Firmamento:
- La fila entera de una constelación (no solo el código) la enciende en el mapa.
- Tocar un resultado de búsqueda (o la estrella de un aliado) abre la ficha del negocio: productos, contacto, foto; un comercio de OSM muestra lo que OSM sabe.
- Menos repetición de «OpenStreetMap» en el inicio (una sola línea de fuente; la atribución ODbL del mapa no se quita).
- Estrellas del mapa más legibles (brillo del color de su grupo).
- Botón «Qué tengo cerca» junto a «Líneas de constelación», con el barrio donde está la persona.
- Firmamento en oscuro: la lista nativa de un `<select>` salía blanca con texto crema.

## Restricciones
- Tarjeta pública ÚNICA: la ficha es `TarjetaEmprendimiento` (prop nueva `angosta`), no otra tarjeta.
- Una sola búsqueda (`buscarNegocios`), barrio con `barrioDe`, distancia con `distanciaMetros`.
- La ubicación no sale del navegador.
- Verificación: `npm run typecheck && npm run lint && npm run verificar` (no hay tests ni runner: sin RED/GREEN).

## Tareas
- [x] T1 `option`/`optgroup` siguen al tema (styles/globals.css) — inline — a009472
- [x] T2 OSM: una sola fuente en «El barrio en cifras»; el popup dice «No es aliado» sin repetir OSM — inline — 7bf0d03
- [x] T3 Estrellas con brillo del color del grupo (components/mapa/formas.ts) — inline — f3861b8
- [x] T4 Fila de constelación tocable, ficha en la columna lateral, «Qué tengo cerca» + barrio — inline (el contexto ya estaba cargado en el padre; delegar lo habría re-leído entero) — 1876eb3

## Progreso
Verificado el 6-oct-2026: typecheck, lint y `npm run verificar` en verde. En el navegador (localhost:3000): la fila entera enciende la constelación; «Comidas» → tocar un aliado abre su ficha con productos; «Qué tengo cerca» con ubicación simulada → «Estás en Santa Inés · 23 negocios a menos de 500 m», lista por distancia y ficha OSM.
Desvío: las fuentes de las cifras no se borraron (DESIGN.md › Reglas de cifras exige fuente); los tres bloques comparten una línea.
Pendiente: el desplegable oscuro se arregló por regla global de `option`, sin reproducirlo en la pantalla exacta de Firmamento que vio Luis.
