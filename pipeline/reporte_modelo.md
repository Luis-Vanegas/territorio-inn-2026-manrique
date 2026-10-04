# Reporte del clasificador de categoría

Fecha de corrida: 2026-10-04T15:44:05Z · semilla 42 · generado por `pipeline/03_clasificador.py`.
Datos: `osm_valle_aburra_2026-10-02.csv` (fuente: OpenStreetMap contributors (ODbL 1.0), vía Overpass API). Etiqueta = tag de OSM mapeado a una de las
12 categorías del sitio (`pipeline/comun.py › MAPEO_OSM`), no el nombre del local.

## Resultado principal

Holdout estratificado y **agrupado por nombre** (20 %, 959 locales, ningún nombre visto en entrenamiento).
C elegido por validación cruzada interna: **30**.

| Modelo | F1 macro | Exactitud |
|---|---|---|
| **TF-IDF char_wb 2-4 + LogReg (este pipeline)** | **0.544** | 0.640 |
| Línea base: clase mayoritaria | 0.044 | 0.355 |
| Línea base: azar según frecuencias | 0.074 | 0.198 |
| Referencia (`pipeline/referencia/`, ver advertencia) | 0.666 | 0.714 |

- Con umbral 0.45: el modelo sugiere una sola categoría en el **83.9%** de los casos
  y acierta el **70.3%** de ellos; en el resto muestra 3 opciones.
- La categoría correcta está entre las 3 primeras en el **89.6%** del holdout.
- Split ingenuo (al azar, sin agrupar por nombre): F1 macro 0.593. Es la cifra inflada por
  cadenas repetidas; **no es la que se debe citar**.

Selección de C (F1 macro medio, validación cruzada de 4 pliegues agrupada, solo sobre entrenamiento):
C=0.5: 0.524, C=1: 0.520, C=3: 0.542, C=10: 0.554, C=30: 0.559.

### Advertencia sobre la referencia

El modelo de referencia declara haberse entrenado con 3398 locales de una descarga de OSM del
Valle de Aburrá del 2026-10-01 17:17. Esta corrida usa otra descarga (osm_valle_aburra_2026-10-02.csv); se desconoce con qué mapeo
de etiquetas se entrenó la referencia y qué nombres vio: su F1 sobre este holdout probablemente
está **sesgado a su favor** y la comparación no es un duelo limpio. Su código de entrenamiento no es
reproducible, por eso no se cita su F1 original.

## Holdout geográfico (Comuna 3)

Entrenado **sin** ningún local de la Comuna 3 (ni nombres repetidos de ahí) y probado en sus
173 locales con categoría mapeada: F1 macro **0.636**, exactitud 0.705.
Referencia sobre los mismos locales: F1 macro 0.748. Con tan pocas filas (varias clases con 2-8
ejemplos) el F1 macro tiene mucha varianza; tómalo como orden de magnitud, no como cifra fina.

## Ejemplos propios del sitio (ciclo de aprendizaje)

Fuente: `ejemplos_constelaciones.json` (generado 2026-10-04 por `scripts/exportar-ejemplos-entrenamiento.mjs`): fichas aprobadas con la categoría que dejó el moderador. Texto = nombre + descripción, igual que lo que lee la moderación.

- Usados: **5** (comidas 3, papeleria 1, ropa_calzado 1); con decisión del equipo en el sugeridor: 0.
- Fuera de las 12 clases del modelo (no entran): 0.
- Peso de cada ficha propia: 5 (frente a 1 por cada nombre de OSM); C = 30 (el elegido solo con OSM).

### (a) Holdout de OSM (mismo split, nombres que el modelo no vio)

| Modelo | F1 macro |
|---|---|
| Solo OSM | 0.5281 |
| OSM + 5 propios (peso 5) | 0.5441 |

**Publicado**: el F1 macro del holdout de OSM no bajó (0.5281 → 0.5441).

Con los propios cambian **21 de 959** predicciones del holdout. Con tan pocas filas nuevas, un movimiento de un par de centésimas en el F1 macro es perturbación de las clases chicas (una sola predicción movida en una clase de 2-10 locales ya lo mueve), no aprendizaje demostrado: la regla de publicación es una valla contra regresiones, no una prueba de mejora.

Sensibilidad al peso (mismo holdout; informativa, el peso no se eligió con esto): peso 1: 0.5367, peso 5: 0.5441, peso 20: 0.5394.

### (b) Sobre los propios (validación dejando fuera un nombre por vez)

| Modelo | Aciertos | Exactitud | F1 macro (clases presentes) |
|---|---|---|---|
| Solo OSM, leyendo solo el nombre (lo que ve el registro) | 3/5 | 0.600 | 0.214 |
| Solo OSM, leyendo nombre + descripción | 3/5 | 0.600 | 0.214 |
| OSM + los demás propios, nombre + descripción | 3/5 | 0.600 | 0.214 |

Pliegues: 5 (cada uno deja fuera un nombre y también saca de OSM los nombres iguales). Con 5 ejemplos esto es **anecdótico, no una métrica**: un acierto más o menos mueve la exactitud 20 puntos. Sirve para detectar que algo se rompió, no para afirmar que el modelo mejoró.

## Detalle por categoría (holdout agrupado)

| categoría | precisión | recall | F1 | soporte |
|---|---|---|---|---|
| comidas | 0.765 | 0.697 | 0.729 | 340 |
| panaderia | 0.448 | 0.796 | 0.574 | 49 |
| tienda_viveres | 0.643 | 0.452 | 0.531 | 199 |
| ropa_calzado | 0.280 | 0.200 | 0.233 | 35 |
| belleza_peluqueria | 0.600 | 0.600 | 0.600 | 35 |
| barberia | 0.333 | 0.333 | 0.333 | 3 |
| construccion | 0.606 | 0.870 | 0.714 | 23 |
| mecanica_motos | 0.659 | 0.675 | 0.667 | 40 |
| tecnologia_celulares | 0.357 | 0.238 | 0.286 | 21 |
| papeleria | 0.156 | 0.536 | 0.242 | 28 |
| salud_bienestar | 0.873 | 0.830 | 0.851 | 165 |
| mascotas | 0.833 | 0.714 | 0.769 | 21 |

## Matriz de confusión (holdout agrupado; filas = real, columnas = predicho)

| real \ predicho | comidas | panaderia | tienda_viveres | ropa_calzado | belleza_peluqueria | barberia | construccion | mecanica_motos | tecnologia_celulares | papeleria | salud_bienestar | mascotas |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| comidas | 237 | 38 | 36 | 6 | 3 | 0 | 5 | 6 | 1 | 5 | 2 | 1 |
| panaderia | 5 | 39 | 4 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| tienda_viveres | 19 | 4 | 90 | 2 | 3 | 0 | 0 | 2 | 2 | 72 | 4 | 1 |
| ropa_calzado | 10 | 1 | 5 | 7 | 0 | 0 | 3 | 2 | 2 | 1 | 3 | 1 |
| belleza_peluqueria | 4 | 0 | 0 | 5 | 21 | 2 | 0 | 0 | 0 | 1 | 2 | 0 |
| barberia | 0 | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| construccion | 0 | 0 | 0 | 0 | 0 | 0 | 20 | 1 | 1 | 1 | 0 | 0 |
| mecanica_motos | 4 | 1 | 1 | 2 | 0 | 0 | 3 | 27 | 0 | 0 | 2 | 0 |
| tecnologia_celulares | 7 | 1 | 1 | 1 | 0 | 0 | 1 | 2 | 5 | 1 | 2 | 0 |
| papeleria | 2 | 2 | 2 | 1 | 1 | 0 | 1 | 0 | 1 | 15 | 3 | 0 |
| salud_bienestar | 19 | 1 | 1 | 1 | 4 | 0 | 0 | 0 | 2 | 0 | 137 | 0 |
| mascotas | 3 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 2 | 15 |

## Datos de entrenamiento

- Locales con nombre en el Valle de Aburrá: 5423; con categoría mapeada (usados): **4790**
  (4056 nombres distintos); sin categoría mapeada (descartados): 633.
- Distribución: comidas 1696, tienda_viveres 999, salud_bienestar 826, panaderia 247, mecanica_motos 197, ropa_calzado 178, belleza_peluqueria 173, papeleria 140, construccion 114, mascotas 105, tecnologia_celulares 102, barberia 13.
- Categorías del sitio que el modelo NO cubre (sin etiqueta OSM fiable): modistería, reparación de
  electrodomésticos, transporte y domicilios, educación y cuidado infantil, fotografía y eventos,
  lavandería, reciclaje, otros.

## Limitaciones conocidas (medidas o por medir)

- Etiquetas "débiles": OSM puede estar mal etiquetado; no hay verificación manual de una muestra (**pendiente**).
- `barberia` tiene muy pocos ejemplos (13); su F1 es poco fiable.
- Los ejemplos propios son 5 y su validación es anecdótica. Más fichas aprobadas y más decisiones del equipo mejoran esto (**pendiente de datos**).
- El modelo publicado (`public/modelo_categoria.json`, 411 KB) se re-entrena
  con todos los datos tras evaluar; las métricas de arriba son del modelo entrenado sin el holdout.
