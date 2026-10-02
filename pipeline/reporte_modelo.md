# Reporte del clasificador de categoría

Fecha de corrida: 2026-10-02T04:42:20Z · semilla 42 · generado por `pipeline/03_clasificador.py`.
Datos: `osm_valle_aburra_2026-10-02.csv` (fuente: OpenStreetMap contributors (ODbL 1.0), vía Overpass API). Etiqueta = tag de OSM mapeado a una de las
12 categorías del sitio (`pipeline/comun.py › MAPEO_OSM`), no el nombre del local.

## Resultado principal

Holdout estratificado y **agrupado por nombre** (20 %, 959 locales, ningún nombre visto en entrenamiento).
C elegido por validación cruzada interna: **30**.

| Modelo | F1 macro | Exactitud |
|---|---|---|
| **TF-IDF char_wb 2-4 + LogReg (este pipeline)** | **0.528** | 0.633 |
| Línea base: clase mayoritaria | 0.044 | 0.355 |
| Línea base: azar según frecuencias | 0.074 | 0.198 |
| Referencia (`pipeline/referencia/`, ver advertencia) | 0.666 | 0.714 |

- Con umbral 0.45: el modelo sugiere una sola categoría en el **84.6%** de los casos
  y acierta el **70.4%** de ellos; en el resto muestra 3 opciones.
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

## Detalle por categoría (holdout agrupado)

| categoría | precisión | recall | F1 | soporte |
|---|---|---|---|---|
| comidas | 0.756 | 0.685 | 0.719 | 340 |
| panaderia | 0.453 | 0.796 | 0.578 | 49 |
| tienda_viveres | 0.638 | 0.452 | 0.529 | 199 |
| ropa_calzado | 0.250 | 0.200 | 0.222 | 35 |
| belleza_peluqueria | 0.625 | 0.571 | 0.597 | 35 |
| barberia | 0.167 | 0.333 | 0.222 | 3 |
| construccion | 0.606 | 0.870 | 0.714 | 23 |
| mecanica_motos | 0.650 | 0.650 | 0.650 | 40 |
| tecnologia_celulares | 0.364 | 0.190 | 0.250 | 21 |
| papeleria | 0.153 | 0.536 | 0.238 | 28 |
| salud_bienestar | 0.867 | 0.830 | 0.848 | 165 |
| mascotas | 0.833 | 0.714 | 0.769 | 21 |

## Matriz de confusión (holdout agrupado; filas = real, columnas = predicho)

| real \ predicho | comidas | panaderia | tienda_viveres | ropa_calzado | belleza_peluqueria | barberia | construccion | mecanica_motos | tecnologia_celulares | papeleria | salud_bienestar | mascotas |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| comidas | 233 | 38 | 36 | 6 | 3 | 1 | 5 | 6 | 1 | 7 | 3 | 1 |
| panaderia | 6 | 39 | 3 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| tienda_viveres | 19 | 4 | 90 | 3 | 3 | 0 | 0 | 2 | 1 | 72 | 4 | 1 |
| ropa_calzado | 10 | 1 | 5 | 7 | 0 | 0 | 3 | 2 | 2 | 1 | 3 | 1 |
| belleza_peluqueria | 4 | 0 | 0 | 5 | 20 | 3 | 0 | 0 | 0 | 1 | 2 | 0 |
| barberia | 0 | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| construccion | 0 | 0 | 0 | 0 | 0 | 0 | 20 | 1 | 1 | 1 | 0 | 0 |
| mecanica_motos | 4 | 1 | 2 | 2 | 0 | 0 | 3 | 26 | 0 | 0 | 2 | 0 |
| tecnologia_celulares | 8 | 1 | 1 | 1 | 0 | 0 | 1 | 2 | 4 | 1 | 2 | 0 |
| papeleria | 3 | 1 | 2 | 3 | 0 | 0 | 1 | 0 | 0 | 15 | 3 | 0 |
| salud_bienestar | 18 | 1 | 2 | 1 | 3 | 1 | 0 | 0 | 2 | 0 | 137 | 0 |
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
- No se ha medido contra los registros reales del sitio (hay 7, insuficiente para una métrica) (**pendiente**).
- El modelo publicado (`public/modelo_categoria.json`, 411 KB) se re-entrena
  con todos los datos tras evaluar; las métricas de arriba son del modelo entrenado sin el holdout.
