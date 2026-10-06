# Reporte del clasificador de categoría

Fecha de corrida: 2026-10-06T16:57:01Z · semilla 42 · generado por `pipeline/03_clasificador.py`.
Datos: `osm_valle_aburra_2026-10-02.csv` (fuente: OpenStreetMap contributors (ODbL 1.0), vía Overpass API). Etiqueta = tag de OSM mapeado a una de las
13 categorías del sitio (`pipeline/comun.py › MAPEO_OSM`), no el nombre del local.

## Resultado principal

Holdout estratificado y **agrupado por nombre** (20 %, 960 locales, ningún nombre visto en entrenamiento).
C elegido por validación cruzada interna: **30**.

| Modelo | F1 macro | Exactitud |
|---|---|---|
| **TF-IDF char_wb 2-4 + LogReg (este pipeline)** | **0.480** | 0.628 |
| Línea base: clase mayoritaria | 0.040 | 0.353 |
| Línea base: azar según frecuencias | 0.069 | 0.207 |
| Referencia (`pipeline/referencia/`, ver advertencia) | 0.634 | 0.742 |

- Con umbral 0.45: el modelo sugiere una sola categoría en el **85.2%** de los casos
  y acierta el **69.4%** de ellos; en el resto muestra 3 opciones.
- La categoría correcta está entre las 3 primeras en el **86.7%** del holdout.
- Split ingenuo (al azar, sin agrupar por nombre): F1 macro 0.555. Es la cifra inflada por
  cadenas repetidas; **no es la que se debe citar**.

Selección de C (F1 macro medio, validación cruzada de 4 pliegues agrupada, solo sobre entrenamiento):
C=0.5: 0.484, C=1: 0.491, C=3: 0.509, C=10: 0.510, C=30: 0.512.

### Advertencia sobre la referencia

El modelo de referencia declara haberse entrenado con 3398 locales de una descarga de OSM del
Valle de Aburrá del 2026-10-01 17:17. Esta corrida usa otra descarga (osm_valle_aburra_2026-10-02.csv); se desconoce con qué mapeo
de etiquetas se entrenó la referencia y qué nombres vio: su F1 sobre este holdout probablemente
está **sesgado a su favor** y la comparación no es un duelo limpio. Su código de entrenamiento no es
reproducible, por eso no se cita su F1 original.

## Holdout geográfico (Comuna 3)

Entrenado **sin** ningún local de la Comuna 3 (ni nombres repetidos de ahí) y probado en sus
174 locales con categoría mapeada: F1 macro **0.594**, exactitud 0.718.
Referencia sobre los mismos locales: F1 macro 0.686. Con tan pocas filas (varias clases con 2-8
ejemplos) el F1 macro tiene mucha varianza; tómalo como orden de magnitud, no como cifra fina.

## Ejemplos propios del sitio

Sin `pipeline/datos/ejemplos_constelaciones.json`: el modelo se entrenó solo con OSM. Para sumar las fichas aprobadas: `node scripts/exportar-ejemplos-entrenamiento.mjs` y volver a correr este script.

## Detalle por categoría (holdout agrupado)

| categoría | precisión | recall | F1 | soporte |
|---|---|---|---|---|
| comidas | 0.786 | 0.684 | 0.732 | 339 |
| panaderia | 0.451 | 0.653 | 0.533 | 49 |
| tienda_viveres | 0.585 | 0.515 | 0.548 | 200 |
| ropa_calzado | 0.333 | 0.278 | 0.303 | 36 |
| belleza_peluqueria | 0.630 | 0.486 | 0.548 | 35 |
| barberia | 0.000 | 0.000 | 0.000 | 2 |
| construccion | 0.737 | 0.609 | 0.667 | 23 |
| mecanica_motos | 0.759 | 0.564 | 0.647 | 39 |
| tecnologia_celulares | 0.400 | 0.190 | 0.258 | 21 |
| papeleria | 0.133 | 0.500 | 0.210 | 26 |
| salud_bienestar | 0.920 | 0.831 | 0.873 | 166 |
| mascotas | 0.889 | 0.762 | 0.821 | 21 |
| diseno_publicidad | 0.054 | 0.667 | 0.100 | 3 |

## Matriz de confusión (holdout agrupado; filas = real, columnas = predicho)

| real \ predicho | comidas | panaderia | tienda_viveres | ropa_calzado | belleza_peluqueria | barberia | construccion | mecanica_motos | tecnologia_celulares | papeleria | salud_bienestar | mascotas | diseno_publicidad |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| comidas | 232 | 35 | 38 | 9 | 1 | 0 | 1 | 6 | 1 | 3 | 2 | 1 | 10 |
| panaderia | 11 | 32 | 4 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| tienda_viveres | 8 | 2 | 103 | 1 | 1 | 0 | 0 | 0 | 1 | 77 | 4 | 1 | 2 |
| ropa_calzado | 10 | 0 | 6 | 10 | 1 | 0 | 2 | 0 | 0 | 2 | 0 | 0 | 5 |
| belleza_peluqueria | 5 | 0 | 3 | 1 | 17 | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 6 |
| barberia | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| construccion | 5 | 0 | 1 | 0 | 0 | 0 | 14 | 0 | 1 | 1 | 0 | 0 | 1 |
| mecanica_motos | 6 | 1 | 1 | 3 | 0 | 0 | 1 | 22 | 2 | 0 | 0 | 0 | 3 |
| tecnologia_celulares | 6 | 0 | 0 | 3 | 2 | 0 | 0 | 1 | 4 | 0 | 2 | 0 | 3 |
| papeleria | 4 | 0 | 5 | 0 | 2 | 0 | 0 | 0 | 1 | 13 | 0 | 0 | 1 |
| salud_bienestar | 6 | 1 | 14 | 2 | 1 | 0 | 0 | 0 | 0 | 1 | 138 | 0 | 3 |
| mascotas | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 2 | 16 | 0 |
| diseno_publicidad | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |

## Datos de entrenamiento

- Locales con nombre en el Valle de Aburrá: 5423; con categoría mapeada (usados): **4796**
  (4062 nombres distintos); sin categoría mapeada (descartados): 627.
- Distribución: comidas 1696, tienda_viveres 999, salud_bienestar 826, panaderia 247, mecanica_motos 197, ropa_calzado 178, belleza_peluqueria 173, papeleria 130, construccion 114, mascotas 105, tecnologia_celulares 102, diseno_publicidad 16, barberia 13.
- Categorías del sitio que el modelo NO cubre (sin etiqueta OSM fiable): modistería, reparación de
  electrodomésticos, transporte y domicilios, educación y cuidado infantil, fotografía y eventos,
  lavandería, reciclaje, otros.

## Limitaciones conocidas (medidas o por medir)

- Etiquetas "débiles": OSM puede estar mal etiquetado; no hay verificación manual de una muestra (**pendiente**).
- `barberia` tiene muy pocos ejemplos (13); su F1 es poco fiable.
- No se ha medido contra los registros reales del sitio: no hay archivo de ejemplos propios (**pendiente**).
- El modelo publicado (`public/modelo_categoria.json`, 441 KB) se re-entrena
  con todos los datos tras evaluar; las métricas de arriba son del modelo entrenado sin el holdout.
