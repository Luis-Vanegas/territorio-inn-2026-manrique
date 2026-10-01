"""Paso 2 · Constelaciones: HDBSCAN sobre los comercios de la Comuna 3.

Entrada: el CSV más reciente osm_comuna3_*.csv (paso 1).
Salida:  public/firmamento/constelaciones.json (lat/lon, listo para el mapa).

Decisiones que conviene no olvidar:
- HDBSCAN corre en METROS (UTM zona 18N, EPSG:32618), no en grados. En grados
  la distancia euclídea mezcla escalas (un grado de longitud mide menos que uno
  de latitud) y el radio de un cúmulo no significaría nada. Medellín cae en la
  zona 18N (75°30'W está entre 78°W y 72°W).
- min_cluster_size=6 y min_samples=3 vienen del plan del reto. Con 6 se exige
  que una "constelación" sea de verdad un grupo, no una pareja de vecinos.
- cluster_selection_method="leaf" y no el "eom" por defecto: con los 192 locales
  de OSM en Manrique, "eom" (mismos 6 y 3) fusiona 168 locales (88 %) en un solo
  cúmulo de ~730 m de radio, que no dice nada del territorio; "leaf" devuelve
  los grupos finos (decenas de metros) que sí se pueden dibujar como constelación.
  La comparación queda en `sensibilidad` dentro del JSON.
- HDBSCAN no tiene azar propio en este modo, pero se fija la semilla igual por
  si cambia la implementación de sklearn.
- El árbol de expansión mínima (MST) une cada estrella con su vecina más cercana
  sin cerrar ciclos: es el dibujo "de constelación" de las líneas del mapa.
"""
from __future__ import annotations

import json

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
    nulos = int(df[["nombre", "lat", "lon"]].isna().sum().sum())
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


def punto(fila) -> dict:
    return {
        "osm": f"{fila.osm_tipo[0]}{fila.osm_id}",
        "nombre": fila.nombre,
        "lat": round(float(fila.lat), 6),
        "lon": round(float(fila.lon), 6),
        "categoria": fila.categoria or None,
    }


def main() -> None:
    np.random.seed(SEMILLA)
    entrada = ultimo_csv("osm_comuna3")
    df = pd.read_csv(entrada, keep_default_na=False, dtype={"categoria": str}).reset_index(drop=True)
    df["categoria"] = df["categoria"].fillna("")
    validacion = validar(df)

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
        mezcla = [
            {
                "categoria": c,
                "nombre": CATEGORIAS.get(c, "Sin categoría mapeada"),
                "n": int(n),
                "proporcion": round(float(n) / len(idx), 3),
            }
            for c, n in conteo.items()
        ]
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
                "mezcla_categorias": mezcla,
                "estrellas": [punto(f) for f in sub.itertuples()],
                "aristas": aristas,  # índices sobre `estrellas`
            }
        )

    # Orden estable: las más grandes primero; desempate por latitud para no depender del orden de HDBSCAN.
    constelaciones.sort(key=lambda c: (-c["tamano"], -c["centroide"]["lat"]))
    for i, c in enumerate(constelaciones, start=1):
        c["id"] = f"c{i:02d}"
        c["nombre"] = f"Constelación {i}"
    constelaciones = [
        {k: c[k] for k in ("id", "nombre", *[k for k in c if k not in ("id", "nombre")])}
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

    n_en_cumulos = int((etq != -1).sum())
    salida = {
        "fuente": FUENTE,
        "licencia": "ODbL 1.0 — https://www.openstreetmap.org/copyright",
        "fecha_corrida": ahora_iso(),
        "datos_de_entrada": entrada.name,
        "metodo": {
            "algoritmo": "sklearn.cluster.HDBSCAN",
            "min_cluster_size": MIN_CLUSTER_SIZE,
            "min_samples": MIN_SAMPLES,
            "cluster_selection_method": METODO_SELECCION,
            "crs_distancias": EPSG_METROS,
            "semilla": SEMILLA,
            "mst": "scipy.sparse.csgraph.minimum_spanning_tree sobre distancias en metros",
        },
        "validaciones": validacion,
        "resumen": {
            "total_comercios": int(len(df)),
            "constelaciones": len(constelaciones),
            "comercios_en_constelaciones": n_en_cumulos,
            "puntos_sueltos": len(sueltos),
            "proporcion_en_constelaciones": round(n_en_cumulos / len(df), 3),
        },
        "sensibilidad_min_cluster_size": sensibilidad,
        "constelaciones": constelaciones,
        "puntos_sueltos": sueltos,
    }

    destino = PUBLICO / "firmamento" / "constelaciones.json"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(
        json.dumps(salida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    print(json.dumps({"resumen": salida["resumen"], "sensibilidad": sensibilidad},
                     ensure_ascii=False, indent=2))
    print(f"{destino} ({destino.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
