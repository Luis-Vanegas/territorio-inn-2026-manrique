# Pipeline de datos y ML · Constelaciones Manrique

Produce los dos archivos públicos del reto:

| Salida | Qué es |
|---|---|
| `public/firmamento/constelaciones.json` | Grupos de comercios de la Comuna 3 (HDBSCAN en metros), con centroide, radio, mezcla de categorías y árbol de expansión mínima para dibujar las líneas. Coordenadas en lat/lon. |
| `public/modelo_categoria.json` | Clasificador de categoría por nombre (TF-IDF de caracteres + regresión logística), con los pesos en JSON para inferir en el navegador, sin servidor. |

Las métricas medidas están en [`reporte_modelo.md`](reporte_modelo.md). Cada JSON lleva dentro
`fuente`, `licencia` y `fecha_corrida`.

## Reproducir

Requiere Python 3.12. Desde la raíz del repo:

```bash
python -m venv pipeline/.venv
pipeline/.venv/Scripts/python -m pip install -r pipeline/requirements.txt   # en Linux/macOS: pipeline/.venv/bin/python
cd pipeline
python 01_osm_overpass.py     # descarga de OSM -> pipeline/datos/*.csv  (necesita internet)
python 02_constelaciones.py   # -> public/firmamento/constelaciones.json
python 03_clasificador.py     # -> public/modelo_categoria.json + reporte_modelo.md
python verificar_salidas.py   # revisa los JSON públicos (sale con código != 0 si algo falla)
```

Los pasos 2 y 3 leen el CSV más reciente de `pipeline/datos/`, así que **funcionan sin internet**
con los CSV que ya están en el repo. Solo el paso 1 necesita red. Semilla fija: `42` (`comun.py`).
Las versiones exactas están en `requirements.txt`.

## Corrida de referencia

- Fecha de la descarga: **2026-10-01** (los CSV llevan la fecha en el nombre; `osm_meta_*.json`
  guarda la consulta, los conteos y las validaciones).
- Overpass: el servidor principal (`overpass-api.de`) devolvió 504 a la consulta final y respondió el
  espejo `overpass.kumi.systems`, cuyo snapshot de OSM es del **2026-05-06** (campo `osm_base_timestamp`).
  Si se repite el paso 1 más adelante, el número de comercios puede cambiar.
- Si Overpass da 504, espera unos minutos y reintenta: es un servicio público compartido y la
  consulta (10 municipios) es grande. No la dispares en bucle.

## Qué hace cada paso

1. **`01_osm_overpass.py`** descarga, en una sola consulta, los elementos con `name` y etiqueta de
   comercio (`shop`, `craft`, algunos `amenity`, `healthcare`, gimnasios) de los 10 municipios del Valle
   de Aburrá. Guarda el Valle completo (insumo del clasificador) y el recorte de la Comuna 3 (punto
   dentro de `lib/geo/manrique.json`). Asigna la categoría del sitio con el mapeo etiqueta OSM -> categoría de
   `comun.py`.
2. **`02_constelaciones.py`** proyecta a metros (UTM 18N, EPSG:32618) y corre
   `sklearn.cluster.HDBSCAN(min_cluster_size=6, min_samples=3)`. Selección `leaf`: con `eom` (el valor por
   defecto) 168 de 192 locales caen en un solo cúmulo de ~730 m, inservible para dibujar; la comparación
   completa está en `sensibilidad_min_cluster_size` del JSON. Calcula centroide, radio máximo y p90, mezcla de
   categorías y MST (scipy) por constelación.
3. **`03_clasificador.py`** entrena con los comercios del Valle que tienen categoría mapeada y evalúa con
   holdout agrupado por nombre (ver el reporte para el porqué), línea base, holdout geográfico y comparación con
   `referencia/`.

## Validaciones incluidas

| Validación | Dónde | Resultado de la corrida |
|---|---|---|
| Nulos en nombre/lat/lon | paso 1 | 0 descartados |
| Duplicados por id OSM | pasos 1 y 2 | 0 |
| Duplicados por nombre + posición (~1 m) | paso 1 | 3 eliminados |
| Coordenadas fuera del polígono | pasos 1 y 2 | 0 (aborta si hay) |
| Categorías desconocidas / nombres vacíos al entrenar | paso 3 | aborta si hay |
| Trazabilidad (fuente, licencia, fecha) | `verificar_salidas.py` | presente en ambos JSON |
| El MST tiene n-1 aristas, ids sin repetir, inferencia reproducible desde el JSON | `verificar_salidas.py` | ok |

## Licencia y atribución (ODbL)

Los datos vienen de **OpenStreetMap** © colaboradores de OpenStreetMap, bajo la licencia
[ODbL 1.0](https://www.openstreetmap.org/copyright). Los CSV de `pipeline/datos/` y las constelaciones
son bases de datos derivadas: se redistribuyen con esta atribución y bajo la misma licencia (ODbL). Los
pesos de `modelo_categoria.json` derivan de nombres de OSM; el JSON lo declara en `licencia`.
Mostrar «© colaboradores de OpenStreetMap» en el sitio donde se publique el mapa o los datos es
responsabilidad de la capa de UI.

## Límites que conviene decir en voz alta

- OSM no es el censo de comercios: el recorte de la Comuna 3 trae **192** locales con nombre, una fracción
  del comercio real. Las constelaciones describen lo que está **mapeado**, no todo lo que existe. Una zona
  sin constelación puede ser una zona sin mapear.
- `categoria_dominante` puede ser débil (varios locales sin categoría mapeada); mira `mezcla_categorias`
  antes de nombrar una constelación por su categoría.
- Hay una constelación (`c09`) con radio de ~620 m: son 7 locales dispersos, no un núcleo compacto.
- El modelo cubre 12 de las categorías del sitio; las demás no tienen etiqueta OSM fiable.
- Las etiquetas del clasificador salen de OSM, no de una revisión manual (muestra de control: pendiente).
