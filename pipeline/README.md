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
python 01_osm_overpass.py --solo-comuna3   # solo la consulta de la comuna (con y sin nombre); no toca el Valle
python 02_constelaciones.py   # -> public/firmamento/constelaciones.json
python 03_clasificador.py     # -> public/modelo_categoria.json + reporte_modelo.md
# luego, desde la raíz: node scripts/exportar-evaluacion-modelo.mjs  -> public/firmamento/modelo_evaluacion.json (F1 por categoría y matriz que dibuja el sitio)
python 05_centralidades.py    # -> public/firmamento/centralidades.json (cruce con el POT; --descargar consulta el servicio de la Alcaldía)
python verificar_salidas.py   # revisa los JSON públicos (sale con código != 0 si algo falla)
```

Los pasos 2 y 3 leen el CSV más reciente de `pipeline/datos/`, así que **funcionan sin internet**
con los CSV que ya están en el repo. Solo el paso 1 necesita red. Semilla fija: `42` (`comun.py`).
Las versiones exactas están en `requirements.txt`.

## Corrida de referencia

- Fecha de la descarga del Valle (entrenamiento): **2026-10-02**, snapshot de OSM **2026-10-02T04:40:06Z**
  (`overpass-api.de`). Las descargas anteriores (`*_2026-10-01.*`) se conservan. La del 2026-10-01 había
  caído al espejo `overpass.kumi.systems` (snapshot 2026-05-06): la diferencia entre ambas es una base más
  reciente, no crecimiento del comercio.
- Comuna 3 con y sin nombre (constelaciones): **2026-10-02**, snapshot **2026-10-02T17:01:31Z**
  (`overpass-api.de`), archivos `osm_comuna3todos_2026-10-02.csv` y `osm_meta_comuna3todos_2026-10-02.json`.
- Si Overpass da 504, espera unos minutos y reintenta: es un servicio público compartido. No la dispares en bucle.

### Cuántos comercios hay: la misma cuenta que la asesoría

Hay **320 establecimientos de OpenStreetMap dentro del polígono de Manrique, 201 con nombre y 119 sin
nombre** (snapshot 2026-10-02T17:01:31Z). Se cuentan todos los elementos con etiqueta de comercio
(`shop`, `craft`, `amenity` de la lista, `healthcare`, gimnasios) cuyo punto cae dentro de `lib/geo/manrique.json`,
exigiendo o no `name`. «Sin nombre» incluye los 4 elementos cuyo `name` en OSM es literalmente «Sin nombre»
(un marcador, no un nombre): en el JSON salen con `nombre: null`.

| | Pipeline (2026-10-02 17:01Z) | Asesoría (snapshot propio) |
|---|---|---|
| Establecimientos en el polígono | 320 | 312 |
| Con nombre | 201 | 198 |
| Sin nombre | 119 | 114 |
| Constelaciones | 20 | 15 |
| Sueltos | 107 | 91 |

Las cifras no son idénticas porque son **snapshots distintos de OSM** (el mapa cambia a diario) y, para
constelaciones y sueltos, además HDBSCAN con parámetros que pueden diferir; no se pudo comprobar los de la
asesoría. Por eso no se afirma que uno esté «bien» y el otro «mal»: miden el mismo territorio en fechas distintas.
Antes de este cambio el pipeline solo contaba los locales con nombre (205 en el snapshot de la mañana: 12 constelaciones, 125 agrupados, 80 sueltos).
Con el criterio de la asesoría son 320 y 20 constelaciones. El conjunto de entrenamiento del clasificador NO cambió.

## Qué hace cada paso

1. **`01_osm_overpass.py`** hace dos consultas. La del Valle exige `name` (el clasificador aprende de nombres;
   su conjunto de entrenamiento no cambia). La de la Comuna 3 pide la caja del polígono SIN exigir `name`
   y recorta con shapely: es la entrada de las constelaciones. Descarga los elementos con etiqueta de
   comercio (`shop`, `craft`, algunos `amenity`, `healthcare`, gimnasios) de los 10 municipios del Valle
   de Aburrá. Guarda el Valle completo (insumo del clasificador) y el recorte de la Comuna 3 (punto
   dentro de `lib/geo/manrique.json`). Asigna la categoría del sitio con el mapeo etiqueta OSM -> categoría de
   `comun.py`.
2. **`02_constelaciones.py`** proyecta a metros (UTM 18N, EPSG:32618) y corre
   `sklearn.cluster.HDBSCAN(min_cluster_size=6, min_samples=3)` sobre los 320 comercios (con y sin nombre).
   Selección `leaf`. Ojo: con los 205 con nombre, `eom` metía 171 en un solo cúmulo (inservible); con los 320
   ya no (`eom`: 18 constelaciones, mayor de 29, radio 111 m; `leaf`: 20, mayor de 19, radio 101 m). `leaf` se
   mantiene por consistencia con la entrega anterior y porque da grupos más finos, pero el argumento
   «`eom` colapsa» ya no se sostiene con estos datos; la comparación completa está en `comparacion_eom_leaf` y
   `sensibilidad_min_cluster_size` del JSON. Cada constelación lleva `codigo` («C01»…) y un `nombre` legible:
   «<vía más frecuente> · <categoría dominante>» (la vía sale de `addr:street` de OSM, solo «Calle/Carrera N»; si
   ningún local la trae, el barrio: «Barrio <X> · <categoría>», con el barrio más frecuente entre sus comercios; solo si tampoco hay barrio queda «Sin calle registrada»; el nombre puede repetirse y el código las distingue). 7 de 20 no tenían calle y hoy se llaman por su barrio (las 7 caen enteras en un solo barrio). Cada comercio lleva `barrio` (los 320 caen en alguno de los 15 oficiales; null si cayera en un hueco entre polígonos). Calcula centroide, radio máximo y p90, mezcla de
   categorías y MST (scipy) por constelación. Cada estrella y punto suelto lleva `nombre` (null si OSM no lo tiene), `categoria` y
   `detalle` (solo las claves presentes: `direccion`, `horario`, `cocina`, `web`; la descripción de OSM queda solo en el CSV crudo, por privacidad). El paso 1
   conserva únicamente esas etiquetas de OSM: nunca `phone`, `contact:*` ni `email`.
3. **`03_clasificador.py`** entrena con los comercios del Valle que tienen categoría mapeada y evalúa con
   holdout agrupado por nombre (ver el reporte para el porqué), línea base, holdout geográfico y comparación con
   `referencia/`.

   Si existe `pipeline/datos/ejemplos_constelaciones.json` (ver «Ciclo de aprendizaje»), suma esas fichas con peso 5
   y solo publica el modelo nuevo con al menos 30 fichas propias (`MIN_PROPIOS`) y si el F1 macro del holdout de OSM no baja. Sin ese archivo hace lo de siempre.

## Ciclo de aprendizaje del sugeridor

Las fichas aprobadas del sitio (nombre, descripción y la categoría que dejó el moderador) son ejemplos del dominio
exacto. Se reentrena así, desde la raíz del repo:

```bash
# 1. Exportar ejemplos (solo SELECT; sin contactos, direcciones, coordenadas ni ids). DATABASE_URL del entorno;
#    si no, la de .env.local, que puede ser PRODUCCIÓN: para una rama de Neon, pásala inline.
node scripts/exportar-ejemplos-entrenamiento.mjs        # -> pipeline/datos/ejemplos_constelaciones.json (en .gitignore)
# 2. Reentrenar (semilla 42; con el archivo suma los propios, sin él es el de siempre)
cd pipeline && python 03_clasificador.py && cd ..       # -> reporte_modelo.md (+ modelo_categoria.json solo con 30+ fichas propias y si el F1 de OSM no bajó)
# 3. Verificar y regenerar lo derivado
node scripts/exportar-evaluacion-modelo.mjs             # -> public/firmamento/modelo_evaluacion.json
python pipeline/verificar_salidas.py
node --experimental-strip-types scripts/verificar-sugeridor.mjs   # falla si cambió una probabilidad: regenerar CASOS con la función `inferir` de verificar_salidas.py
node --experimental-strip-types scripts/verificar-evaluacion-modelo.mjs
# 4. Publicar: revisar `git diff` (modelo, reporte, evaluación, casos) y hacer commit; el despliegue sirve el JSON nuevo.
```

El reporte separa dos cosas: (a) F1 macro en el holdout de OSM, contra el modelo solo-OSM de la misma corrida, y
(b) los propios con validación dejando fuera un nombre por vez. Con pocos ejemplos (b) es anecdótico y un cambio
de centésimas en (a) es ruido de clases chicas: la regla de publicación evita regresiones, no demuestra mejora.

## Validaciones incluidas

| Validación | Dónde | Resultado de la corrida |
|---|---|---|
| Nulos en lat/lon (el nombre puede faltar a propósito) | paso 1 | 0 descartados |
| Duplicados por id OSM | pasos 1 y 2 | 0 |
| Duplicados por nombre + posición (~1 m) | paso 1 | 3 eliminados en el Valle; 1 en la consulta de la comuna (ninguno sin nombre) |
| `con_nombre + sin_nombre = total`, `agrupados + sueltos = total`, `nombre` null o texto real | `verificar_salidas.py` | ok |
| Coordenadas fuera del polígono | pasos 1 y 2 | 0 (aborta si hay) |
| Categorías desconocidas / nombres vacíos al entrenar | paso 3 | aborta si hay |
| Trazabilidad (fuente, licencia, fecha) | `verificar_salidas.py` | presente en ambos JSON |
| El MST tiene n-1 aristas, ids sin repetir, inferencia reproducible desde el JSON | `verificar_salidas.py` | ok |

## Barrios oficiales

`lib/geo/barrios-manrique.json` trae los 15 barrios de la Comuna 3 (códigos 301–315), recortados por
`scripts/extraer-barrios.mjs` desde el GeoJSON de barrios de Medellín (329 polígonos) y con el nombre en la
grafía de `BARRIOS_COMUNA_3`. **Fuente: Alcaldía de Medellín** (archivo entregado al equipo); viaja en `metadata.fuente` y en `barrios.fuente` de `constelaciones.json`.
La unión de los 15 cubre el 99,9 % del polígono de la comuna (el 0,1 % restante son ~5000 m² de sliver en el borde).
El paso 2 lo usa para el barrio de cada comercio y para nombrar las constelaciones sin calle; la app calcula lo
mismo con `barrioDe` (`lib/geo/barrioOficial.ts`).

## Centralidades del POT (paso 5)

`05_centralidades.py` cruza las constelaciones con el subsistema de centralidades del POT de Medellín
(Acuerdo 48 de 2014). **Fuente:** servicio ArcGIS REST de la Alcaldía de Medellín,
`https://www.medellin.gov.co/servidormapas/rest/services/ordenamiento_ter/VM_20_Subs_Centralidades/MapServer/1`
(«Centralidades urbanas», 78 polígonos en la ciudad; la capa 9 trae las mismas). Se consulta con
`f=geojson`, `outSR=4326` y la caja de la comuna; el crudo queda en `pipeline/datos/centralidades_pot_<fecha>.geojson`
(corrida de referencia: 2026-10-03, 7 polígonos en la caja). Campos: `nombre`, `jerarquia` (Metropolitana,
Ciudad, Zonal, Barrial), `orden`, `caracter`, `estado`, `accion`, `fecha_adopcion`, `fecha_actualizacion`.
El servidor responde vacío si el pedido no lleva un User-Agent de navegador.
**Licencia: no la declara el servicio** (solo `copyrightText` de Planeación); no se afirmó ninguna. Pendiente de
confirmar los términos de datos abiertos de la Alcaldía antes de redistribuir el polígono.
Solo cuatro tocan la comuna: Gaitán, Santa Inés y San Blas (barriales, adentro) y «Campo Valdés - Manrique»
(zonal, 6,9 % de su área adentro, el resto en la comuna vecina). No existe una capa llamada «Manrique Central».
Límite: el comercio de OSM solo cubre la comuna; de lo que una centralidad tenga afuera no se midió.

## Vigía de convocatorias (paso 4)

`04_vigia_convocatorias.py` (solo biblioteca estándar) revisa las páginas de
`fuentes_convocatorias.json` y manda las candidatas a `/api/ingesta/convocatorias` (siempre `pendiente`).
Desde la migración 036 también manda UN informe de corrida a `/api/ingesta/vigia`: por fuente, si respondió,
el código HTTP, la huella de sus enlaces, candidatas y nuevas; el servidor decide `cambio` / `sin_cambio`
(el runner de Actions no guarda estado). Se ve en el panel del equipo › Convocatorias › «Fuentes del vigía».

```bash
python pipeline/04_vigia_convocatorias.py --seco     # no envía nada
INGESTA_URL=https://<dominio>/api/ingesta/convocatorias INGESTA_SECRETO=... python pipeline/04_vigia_convocatorias.py
# --fuentes otro.json: probar con otras fuentes (p. ej. una URL muerta para ver el fallo)
# INGESTA_VIGIA_URL: si el informe va a otra URL; por defecto es INGESTA_URL con «/vigia» al final
```

Cada fuente del JSON lleva un `id` slug estable (es la llave del historial en la base: no se cambia). Reglas
de buena vecindad: respeta `robots.txt`, una página por fuente por día, User-Agent propio, pausa entre fuentes,
solo páginas públicas de entidades, nada se publica sin moderación humana.

## Licencia y atribución (ODbL)

Los datos vienen de **OpenStreetMap** © colaboradores de OpenStreetMap, bajo la licencia
[ODbL 1.0](https://www.openstreetmap.org/copyright). Los CSV de `pipeline/datos/` y las constelaciones
son bases de datos derivadas: se redistribuyen con esta atribución y bajo la misma licencia (ODbL). Los
pesos de `modelo_categoria.json` derivan de nombres de OSM; el JSON lo declara en `licencia`.
Mostrar «© colaboradores de OpenStreetMap» en el sitio donde se publique el mapa o los datos es
responsabilidad de la capa de UI.

## Límites que conviene decir en voz alta

- OSM no es el censo de comercios: el recorte de la Comuna 3 trae **320** establecimientos (201 con nombre,
  119 sin), una fracción del comercio real. Las constelaciones describen lo que está **mapeado**, no todo lo que existe. Una zona
  sin constelación puede ser una zona sin mapear.
- `categoria_dominante` puede ser débil (varios locales sin categoría mapeada); mira `mezcla_categorias`
  antes de nombrar una constelación por su categoría.
- Hay constelaciones con radio grande (`c03`, ~306 m, 16 locales; `c18`, ~462 m, 6 locales): son locales dispersos, no un núcleo compacto. Mira `radio_p90_m`.
- `detalle.direccion` copia `addr:street` + número tal como viene de OSM y a veces trae basura («Cr 23 cl 90A - 24  171»);
  el nombre de la constelación sí la filtra, la ficha no.
- El modelo cubre 12 de las categorías del sitio; las demás no tienen etiqueta OSM fiable.
- Las etiquetas del clasificador salen de OSM, no de una revisión manual (muestra de control: pendiente).
