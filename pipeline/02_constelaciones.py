"""Paso 2 · Constelaciones: HDBSCAN sobre los comercios de la Comuna 3.

Entrada: el CSV más reciente osm_comuna3todos_*.csv (paso 1): TODOS los comercios
de OSM dentro del polígono, con y sin nombre. Igual que la asesoría, un local sin
nombre en OSM sigue siendo un comercio mapeado y cuenta para el territorio; en el
JSON su `nombre` es null (no se inventa «Sin nombre», eso lo decide la app).
Salida:  public/firmamento/constelaciones.json (lat/lon, listo para el mapa).

Decisiones que conviene no olvidar:
- HDBSCAN corre en METROS (UTM zona 18N, EPSG:32618), no en grados. En grados
  la distancia euclídea mezcla escalas (un grado de longitud mide menos que uno
  de latitud) y el radio de un cúmulo no significaría nada. Medellín cae en la
  zona 18N (75°30'W está entre 78°W y 72°W).
- min_cluster_size=6 y min_samples=3 vienen del plan del reto. Con 6 se exige
  que una "constelación" sea de verdad un grupo, no una pareja de vecinos.
- cluster_selection_method="leaf" y no el "eom" por defecto: con todos los
  comercios de OSM en Manrique, "eom" (mismos 6 y 3) fusiona la mayoría en un solo
  cúmulo enorme, que no dice nada del territorio; "leaf" devuelve los grupos finos
  (decenas de metros) que sí se pueden dibujar como constelación. Las cifras de la
  comparación quedan en `sensibilidad_min_cluster_size` y `comparacion_eom_leaf`
  dentro del JSON (no se copian acá para que no se desactualicen).
- HDBSCAN no tiene azar propio en este modo, pero se fija la semilla igual por
  si cambia la implementación de sklearn.
- El barrio sale del polígono oficial (lib/geo/barrios-manrique.json, que genera
  scripts/extraer-barrios.mjs; fuente: Alcaldía de Medellín): cada
  comercio lleva `barrio` (null si cae en un hueco entre polígonos, ~0,1 % de la comuna)
  y una constelación sin calle se nombra «Barrio <X> · <categoría>» con el barrio más
  frecuente entre sus comercios. Se calcula por posición, igual que la app (`barrioDe`).
- El árbol de expansión mínima (MST) une cada estrella con su vecina más cercana
  sin cerrar ciclos: es el dibujo "de constelación" de las líneas del mapa.
"""
from __future__ import annotations

import json
import re

import numpy as np
import pandas as pd
from pyproj import Transformer
from scipy.sparse.csgraph import minimum_spanning_tree
from scipy.spatial.distance import cdist
from shapely import contains_xy
from sklearn.cluster import HDBSCAN

from comun import (
    CATEGORIAS,
    FUENTE,
    PUBLICO,
    SEMILLA,
    ahora_iso,
    cargar_barrios,
    cargar_poligono,
    ultimo_csv,
)

MIN_CLUSTER_SIZE = 6
MIN_SAMPLES = 3
METODO_SELECCION = "leaf"
EPSG_METROS = "EPSG:32618"

A_METROS = Transformer.from_crs("EPSG:4326", EPSG_METROS, always_xy=True)
A_GRADOS = Transformer.from_crs(EPSG_METROS, "EPSG:4326", always_xy=True)


def validar(df: pd.DataFrame) -> dict:
    """Validaciones de la rúbrica; aborta si algo está roto en vez de publicar basura."""
    # El nombre puede faltar a propósito (comercios sin nombre); lat/lon no.
    nulos = int(df[["lat", "lon"]].isna().sum().sum())
    dup = int(df.duplicated(subset=["osm_tipo", "osm_id"]).sum())
    poligono = cargar_poligono()
    fuera = int((~contains_xy(poligono, df["lon"].to_numpy(), df["lat"].to_numpy())).sum())
    if nulos or dup or fuera:
        raise SystemExit(f"Datos inválidos: nulos={nulos} duplicados={dup} fuera_poligono={fuera}")
    return {"nulos": nulos, "duplicados": dup, "fuera_del_poligono": fuera}


def etiquetas(
    xy: np.ndarray,
    min_cluster_size: int = MIN_CLUSTER_SIZE,
    metodo: str = METODO_SELECCION,
) -> np.ndarray:
    # copy=True fija hoy el comportamiento que sklearn hará por defecto en 1.10
    # y evita el FutureWarning.
    return HDBSCAN(
        min_cluster_size=min_cluster_size,
        min_samples=MIN_SAMPLES,
        metric="euclidean",
        cluster_selection_method=metodo,
        copy=True,
    ).fit_predict(xy)


def _texto(fila, columna: str) -> str:
    # keep_default_na=False deja "" donde OSM no trae la etiqueta.
    v = getattr(fila, columna, "")
    return v.strip() if isinstance(v, str) else ""


def detalle(fila) -> dict:
    """Solo las claves presentes: la app muestra lo que hay, sin rellenar vacíos.

    `description` NO se publica: es texto libre de encuestas de campo y a veces
    habla de personas identificables (Ley 1581). Queda solo en el CSV crudo.
    """
    calle, numero = _texto(fila, "addr_street"), _texto(fila, "addr_housenumber")
    claves = {
        "direccion": f"{calle} {numero}".strip() if calle else "",  # un número sin calle no ubica a nadie
        "horario": _texto(fila, "opening_hours"),
        "cocina": _texto(fila, "cuisine"),
        "web": _texto(fila, "website"),
    }
    return {k: v for k, v in claves.items() if v}


SIN_CATEGORIA = "Sin categoría"  # mismo rótulo que usa la app (nombreCategoriaOsm(null))
SIN_CALLE = "Sin calle registrada"


# En OSM `addr:street` a veces trae la placa pegada («Calle 71A #31-14») o basura
# («Cr 23 cl 90A - 24  171»). Solo se conserva la vía con su número y letra.
_VIA = re.compile(
    r"^(Calle|Carrera|Avenida|Transversal|Diagonal|Circular)\s*(\d+)\s*([A-Za-z])?(?![A-Za-z])", re.I
)


def via(texto: str) -> str | None:
    m = _VIA.match(texto.strip())
    if not m:
        return None  # sin patrón reconocible: mejor sin calle que una calle mal copiada
    tipo, numero, letra = m.groups()
    return f"{tipo.capitalize()} {numero}{letra.upper() if letra else ''}"


def calle_mas_frecuente(sub: pd.DataFrame) -> str | None:
    """Vía más repetida entre los comercios del grupo (solo `addr:street`, sin número).

    Sale de lo que OSM trae, nunca se infiere de la posición: un nombre de calle
    equivocado en el mapa sería peor que decir que no hay. Empate: orden alfabético,
    para que la corrida sea reproducible.
    """
    calles = sub["addr_street"].map(via).dropna()
    if calles.empty:
        return None
    conteo = calles.value_counts()
    return sorted(conteo[conteo == conteo.max()].index)[0]


def asignar_barrios(df: pd.DataFrame) -> pd.Series:
    """Barrio oficial de cada comercio ("" si no cae en ninguno)."""
    barrios, _ = cargar_barrios()
    lon, lat = df["lon"].to_numpy(), df["lat"].to_numpy()
    resultado = np.full(len(df), "", dtype=object)
    for nombre, poligono in barrios:
        # Un punto justo en la frontera puede caer en dos: gana el primero (orden por código).
        resultado[(resultado == "") & contains_xy(poligono, lon, lat)] = nombre
    return pd.Series(resultado, index=df.index)


def barrio_mas_frecuente(sub: pd.DataFrame) -> str | None:
    """Barrio más repetido entre los comercios del grupo; empate: orden alfabético (corrida reproducible)."""
    barrios = sub["barrio"][sub["barrio"] != ""]
    if barrios.empty:
        return None
    conteo = barrios.value_counts()
    return sorted(conteo[conteo == conteo.max()].index)[0]


def punto(fila) -> dict:
    return {
        "osm": f"{fila.osm_tipo[0]}{fila.osm_id}",
        # null, no "": un nombre vacío se confunde con texto; null obliga a quien consume a decidir.
        "nombre": (fila.nombre.strip() or None) if isinstance(fila.nombre, str) else None,
        "lat": round(float(fila.lat), 6),
        "lon": round(float(fila.lon), 6),
        "categoria": fila.categoria or None,
        "barrio": fila.barrio or None,
        "detalle": detalle(fila),
    }


def main() -> None:
    np.random.seed(SEMILLA)
    entrada = ultimo_csv("osm_comuna3todos")
    df = pd.read_csv(entrada, keep_default_na=False, dtype={"categoria": str}).reset_index(drop=True)
    df["categoria"] = df["categoria"].fillna("")
    # Algunos mapeadores escribieron «Sin nombre» como si fuera el name. Es la
    # ausencia de nombre, no un nombre: se trata como null para que el conteo
    # con/sin nombre sea honesto y la app no muestre un falso nombre propio.
    placeholder = df["nombre"].str.strip().str.match(r"(?i)^sin\s+nombre\.?$")
    n_placeholder = int(placeholder.sum())
    df.loc[placeholder, "nombre"] = ""
    validacion = validar(df)
    df["barrio"] = asignar_barrios(df)
    validacion["nombres_placeholder_tratados_como_null"] = n_placeholder

    # La fecha del snapshot sale del meta que escribió el paso 1 junto al CSV,
    # no se escribe a mano: así la app siempre cita la base que de verdad usó.
    meta = json.loads(entrada.with_name(entrada.name.replace("osm_comuna3todos_", "osm_meta_comuna3todos_").replace(".csv", ".json")).read_text(encoding="utf-8"))
    osm_base = meta.get("timestamp_osm_base") or meta.get("osm_base_timestamp")
    if not osm_base:
        raise SystemExit("El meta del paso 1 no trae timestamp_osm_base")

    x, y = A_METROS.transform(df["lon"].to_numpy(), df["lat"].to_numpy())
    xy = np.column_stack([x, y])
    etq = etiquetas(xy)

    constelaciones = []
    for k in sorted(set(etq) - {-1}):
        idx = np.where(etq == k)[0]
        pts = xy[idx]
        centro = pts.mean(axis=0)
        dist_centro = np.linalg.norm(pts - centro, axis=1)
        clon, clat = A_GRADOS.transform(centro[0], centro[1])

        # MST sobre la matriz densa de distancias (n es de decenas: no necesita índice espacial).
        d = cdist(pts, pts)
        mst = minimum_spanning_tree(d).tocoo()
        aristas = [
            {"de": int(i), "a": int(j), "metros": round(float(m), 1)}
            for i, j, m in zip(mst.row, mst.col, mst.data)
        ]

        sub = df.iloc[idx]
        conteo = sub["categoria"].replace("", "sin_categoria").value_counts()
        # Orden explícito (n desc, id asc): no depender del desempate interno de pandas.
        mezcla = [
            {
                "categoria": c,
                "nombre": CATEGORIAS.get(c, SIN_CATEGORIA),
                "n": int(n),
                "proporcion": round(float(n) / len(idx), 3),
            }
            for c, n in sorted(conteo.items(), key=lambda t: (-t[1], t[0]))
        ]
        calle = calle_mas_frecuente(sub)
        barrio = barrio_mas_frecuente(sub)
        dominante = next((m for m in mezcla if m["categoria"] != "sin_categoria"), None)

        constelaciones.append(
            {
                "tamano": int(len(idx)),
                "centroide": {"lat": round(clat, 6), "lon": round(clon, 6)},
                # Máximo y p90: el máximo lo estira un solo local lejano; el p90 es el halo "típico".
                "radio_m": round(float(dist_centro.max()), 1),
                "radio_p90_m": round(float(np.percentile(dist_centro, 90)), 1),
                "longitud_mst_m": round(float(sum(a["metros"] for a in aristas)), 1),
                "categoria_dominante": dominante["categoria"] if dominante else None,
                "_calle": calle,
                "_barrio": barrio,
                "_cat_nombre": dominante["nombre"] if dominante else SIN_CATEGORIA,
                "mezcla_categorias": mezcla,
                "estrellas": [punto(f) for f in sub.itertuples()],
                "aristas": aristas,  # índices sobre `estrellas`
            }
        )

    # Orden estable: las más grandes primero; desempate por latitud para no depender del orden de HDBSCAN.
    constelaciones.sort(key=lambda c: (-c["tamano"], -c["centroide"]["lat"]))
    for i, c in enumerate(constelaciones, start=1):
        c["id"] = f"c{i:02d}"
        c["codigo"] = f"C{i:02d}"
        # Con calle, la calle; sin calle, el barrio; sin ninguno de los dos, el rótulo viejo.
        lugar = c["_calle"] or (f"Barrio {c['_barrio']}" if c["_barrio"] else SIN_CALLE)
        c["nombre"] = f"{lugar} · {c['_cat_nombre']}"
    # Dos grupos en la misma calle y rubro pueden llamarse igual: los distingue `codigo`,
    # que la interfaz siempre antepone («C05 · …»). Repetirlo en el nombre lo mostraba dos veces.
    sin_calle = sum(1 for c in constelaciones if not c["_calle"])
    nombradas_por_barrio = sum(1 for c in constelaciones if not c["_calle"] and c["_barrio"])
    constelaciones = [
        {k: c[k] for k in ("id", "codigo", "nombre", *[k for k in c if k not in ("id", "codigo", "nombre", "_calle", "_barrio", "_cat_nombre")])}
        for c in constelaciones
    ]

    sueltos = [punto(f) for f in df[etq == -1].itertuples()]

    # Sensibilidad: cuánto cambia el resultado si se mueve el parámetro principal.
    # Se publica para que nadie crea que "6" es un hecho de la naturaleza.
    sensibilidad = []
    for metodo in ("leaf", "eom"):
        for mcs in (4, 5, 6, 8, 10):
            e = etiquetas(xy, mcs, metodo)
            tamanos = [int((e == k).sum()) for k in sorted(set(e) - {-1})]
            sensibilidad.append(
                {
                    "seleccion": metodo,
                    "min_cluster_size": mcs,
                    "constelaciones": len(tamanos),
                    "puntos_sueltos": int((e == -1).sum()),
                    "cumulo_mayor": max(tamanos, default=0),
                }
            )

    # Comparación puntual con los parámetros del plan (6 y 3): es la justificación de usar leaf.
    comparacion = {}
    for metodo in ("leaf", "eom"):
        e = etiquetas(xy, MIN_CLUSTER_SIZE, metodo)
        ks = sorted(set(e) - {-1})
        mayor = max(ks, key=lambda k: int((e == k).sum()), default=None)
        if mayor is None:
            comparacion[metodo] = {"constelaciones": 0}
            continue
        pts = xy[e == mayor]
        radio = float(np.linalg.norm(pts - pts.mean(axis=0), axis=1).max())
        comparacion[metodo] = {
            "constelaciones": len(ks),
            "puntos_sueltos": int((e == -1).sum()),
            "cumulo_mayor": int(len(pts)),
            "proporcion_en_cumulo_mayor": round(len(pts) / len(df), 3),
            "radio_cumulo_mayor_m": round(radio, 1),
        }

    n_en_cumulos = int((etq != -1).sum())
    _, meta_barrios = cargar_barrios()
    n_sin_nombre = int((df["nombre"].str.strip() == "").sum())
    salida = {
        "fuente": FUENTE,
        "licencia": "ODbL 1.0 — https://www.openstreetmap.org/copyright",
        "fecha_corrida": ahora_iso(),
        "datos_de_entrada": entrada.name,
        "osm_base": osm_base,
        "metodo": {
            "algoritmo": "sklearn.cluster.HDBSCAN",
            "min_cluster_size": MIN_CLUSTER_SIZE,
            "min_samples": MIN_SAMPLES,
            "cluster_selection_method": METODO_SELECCION,
            "crs_distancias": EPSG_METROS,
            "semilla": SEMILLA,
            "mst": "scipy.sparse.csgraph.minimum_spanning_tree sobre distancias en metros",
        },
        "barrios": {
            "fuente": meta_barrios["fuente"],
            "archivo": "lib/geo/barrios-manrique.json",
            "generado_en": meta_barrios["generadoEn"],
        },
        "validaciones": validacion,
        "resumen": {
            "total_comercios": int(len(df)),
            "con_nombre": int(len(df)) - n_sin_nombre,
            "sin_nombre": n_sin_nombre,
            "constelaciones": len(constelaciones),
            "constelaciones_sin_calle": sin_calle,
            "constelaciones_nombradas_por_barrio": nombradas_por_barrio,
            "comercios_con_barrio": int((df["barrio"] != "").sum()),
            "comercios_sin_barrio": int((df["barrio"] == "").sum()),
            "comercios_en_constelaciones": n_en_cumulos,
            "agrupados": n_en_cumulos,  # mismo dato que la clave anterior, con el nombre que usa la asesoría
            "puntos_sueltos": len(sueltos),
            "sueltos": len(sueltos),
            "proporcion_en_constelaciones": round(n_en_cumulos / len(df), 3),
        },
        "comparacion_eom_leaf": comparacion,
        "sensibilidad_min_cluster_size": sensibilidad,
        "constelaciones": constelaciones,
        "puntos_sueltos": sueltos,
    }

    destino = PUBLICO / "firmamento" / "constelaciones.json"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(
        json.dumps(salida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    print(json.dumps({"resumen": salida["resumen"], "comparacion_eom_leaf": comparacion,
                      "sensibilidad": sensibilidad},
                     ensure_ascii=False, indent=2))
    print(f"{destino} ({destino.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
