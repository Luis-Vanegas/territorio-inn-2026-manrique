# Reporte del clasificador de categoría

Fecha de corrida: 2026-10-01T20:00:38Z · semilla 42 · generado por `pipeline/03_clasificador.py`.
Datos: `osm_valle_aburra_2026-10-01.csv` (fuente: OpenStreetMap contributors (ODbL 1.0), vía Overpass API). Etiqueta = tag de OSM mapeado a una de las
12 categorías del sitio (`pipeline/comun.py › MAPEO_OSM`), no el nombre del local.

## Resultado principal

Holdout estratificado y **agrupado por nombre** (20 %, 890 locales, ningún nombre visto en entrenamiento).
C elegido por validación cruzada interna: **10**.

| Modelo | F1 macro | Exactitud |
|---|---|---|
| **TF-IDF char_wb 2-4 + LogReg (este pipeline)** | **0.535** | 0.654 |
| Línea base: clase mayoritaria | 0.044 | 0.358 |
| Línea base: azar según frecuencias | 0.088 | 0.202 |
| Referencia (`pipeline/referencia/`, ver advertencia) | 0.625 | 0.706 |

- Con umbral 0.45: el modelo sugiere una sola categoría en el **76.0%** de los casos
  y acierta el **73.8%** de ellos; en el resto muestra 3 opciones.
- La categoría correcta está entre las 3 primeras en el **89.1%** del holdout.
- Split ingenuo (al azar, sin agrupar por nombre): F1 macro 0.586. Es la cifra inflada por
  cadenas repetidas; **no es la que se debe citar**.

Selección de C (F1 macro medio, validación cruzada de 4 pliegues agrupada, solo sobre entrenamiento):
C=0.5: 0.520, C=1: 0.536, C=3: 0.553, C=10: 0.562, C=30: 0.561.

### Advertencia sobre la referencia

El modelo de referencia declara haberse entrenado con 3398 locales de una descarga de OSM del
Valle de Aburrá del 2026-10-01 17:17. Esta corrida usa otra descarga (osm_valle_aburra_2026-10-01.csv); se desconoce con qué mapeo
de etiquetas se entrenó la referencia y qué nombres vio: su F1 sobre este holdout probablemente
está **sesgado a su favor** y la comparación no es un duelo limpio. Su código de entrenamiento no es
reproducible, por eso no se cita su F1 original.

## Holdout geográfico (Comuna 3)

Entrenado **sin** ningún local de la Comuna 3 (ni nombres repetidos de ahí) y probado en sus
161 locales con categoría mapeada: F1 macro **0.670**, exactitud 0.714.
Referencia sobre los mismos locales: F1 macro 0.729. Con tan pocas filas (varias clases con 2-8
ejemplos) el F1 macro tiene mucha varianza; tómalo como orden de magnitud, no como cifra fina.

## Detalle por categoría (holdout agrupado)

| categoría | precisión | recall | F1 | soporte |
|---|---|---|---|---|
| comidas | 0.798 | 0.730 | 0.763 | 319 |
| panaderia | 0.484 | 0.689 | 0.569 | 45 |
| tienda_viveres | 0.633 | 0.471 | 0.540 | 187 |
| ropa_calzado | 0.250 | 0.310 | 0.277 | 29 |
| belleza_peluqueria | 0.759 | 0.710 | 0.733 | 31 |
| barberia | 0.000 | 0.000 | 0.000 | 2 |
| construccion | 0.600 | 0.545 | 0.571 | 22 |
| mecanica_motos | 0.719 | 0.605 | 0.657 | 38 |
| tecnologia_celulares | 0.412 | 0.438 | 0.424 | 16 |
| papeleria | 0.184 | 0.720 | 0.293 | 25 |
| salud_bienestar | 0.879 | 0.783 | 0.828 | 157 |
| mascotas | 0.696 | 0.842 | 0.762 | 19 |

## Matriz de confusión (holdout agrupado; filas = real, columnas = predicho)

| real \ predicho | comidas | panaderia | tienda_viveres | ropa_calzado | belleza_peluqueria | barberia | construccion | mecanica_motos | tecnologia_celulares | papeleria | salud_bienestar | mascotas |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| comidas | 233 | 27 | 22 | 16 | 1 | 0 | 3 | 5 | 1 | 5 | 5 | 1 |
| panaderia | 8 | 31 | 2 | 0 | 0 | 0 | 0 | 0 | 1 | 2 | 1 | 0 |
| tienda_viveres | 12 | 3 | 88 | 2 | 1 | 0 | 0 | 1 | 4 | 71 | 4 | 1 |
| ropa_calzado | 6 | 1 | 7 | 9 | 0 | 0 | 2 | 1 | 1 | 0 | 1 | 1 |
| belleza_peluqueria | 5 | 1 | 0 | 1 | 22 | 0 | 0 | 0 | 0 | 0 | 2 | 0 |
| barberia | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| construccion | 5 | 0 | 1 | 1 | 0 | 0 | 12 | 1 | 0 | 0 | 2 | 0 |
| mecanica_motos | 6 | 0 | 4 | 2 | 0 | 0 | 1 | 23 | 0 | 1 | 1 | 0 |
| tecnologia_celulares | 4 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 7 | 0 | 0 | 2 |
| papeleria | 4 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 1 | 18 | 0 | 0 |
| salud_bienestar | 8 | 1 | 11 | 2 | 4 | 0 | 2 | 1 | 2 | 1 | 123 | 2 |
| mascotas | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 16 |

## Datos de entrenamiento

- Locales con nombre en el Valle de Aburrá: 5007; con categoría mapeada (usados): **4446**
  (3763 nombres distintos); sin categoría mapeada (descartados): 561.
- Distribución: comidas 1593, tienda_viveres 933, salud_bienestar 785, panaderia 227, mecanica_motos 190, belleza_peluqueria 155, ropa_calzado 146, papeleria 124, construccion 106, mascotas 96, tecnologia_celulares 81, barberia 10.
- Categorías del sitio que el modelo NO cubre (sin etiqueta OSM fiable): modistería, reparación de
  electrodomésticos, transporte y domicilios, educación y cuidado infantil, fotografía y eventos,
  lavandería, reciclaje, otros.

## Limitaciones conocidas (medidas o por medir)

- Etiquetas "débiles": OSM puede estar mal etiquetado; no hay verificación manual de una muestra (**pendiente**).
- `barberia` tiene muy pocos ejemplos (10); su F1 es poco fiable.
- No se ha medido contra los registros reales del sitio (hay 7, insuficiente para una métrica) (**pendiente**).
- El modelo publicado (`public/modelo_categoria.json`, 412 KB) se re-entrena
  con todos los datos tras evaluar; las métricas de arriba son del modelo entrenado sin el holdout.
