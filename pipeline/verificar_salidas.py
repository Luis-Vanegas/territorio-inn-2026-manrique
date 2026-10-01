"""Verifica los JSON públicos sin reentrenar nada.

1. public/modelo_categoria.json: re-implementa la inferencia SOLO con lo que hay
   en el JSON (lo que hará el navegador) y la compara con casos fijos.
2. public/firmamento/constelaciones.json: trazabilidad, coordenadas dentro del
   polígono, aristas coherentes y sin duplicados.

Sale con código != 0 si algo falla, para poder colgarlo de un verificador luego.
"""
from __future__ import annotations

import json
import sys
import unicodedata

import numpy as np
from shapely import contains_xy

from comun import PUBLICO, cargar_poligono

CASOS = {  # nombres inventados a propósito: no salen de los datos de entrenamiento
    "Panadería La Espiga Dorada": "panaderia",
    "Veterinaria Patitas Felices": "mascotas",
    "Droguería San Rafael": "salud_bienestar",
    "Repuestos y Motos El Tornillo": "mecanica_motos",
    "Restaurante Sabor Paisa": "comidas",
}


def inferir(modelo: dict, nombre: str) -> tuple[str, float]:
    t = unicodedata.normalize("NFD", nombre.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = " ".join(t.split())
    indice = {g: i for i, g in enumerate(modelo["vocab"])}
    x = np.zeros(len(indice))
    for palabra in t.split():
        w = f" {palabra} "
        for n in (2, 3, 4):
            for i in range(len(w) - n + 1):
                j = indice.get(w[i : i + n])
                if j is not None:
                    x[j] += 1
    x *= np.array(modelo["idf"])
    norma = np.linalg.norm(x)
    x = x / norma if norma else x
    z = np.array(modelo["coef"]) @ x + np.array(modelo["intercepto"])
    p = np.exp(z - z.max())
    p /= p.sum()
    k = int(p.argmax())
    return modelo["clases"][k], float(p[k])


def main() -> int:
    errores = []
    m = json.loads((PUBLICO / "modelo_categoria.json").read_text(encoding="utf-8"))
    for campo in ("fuente", "fecha_corrida", "licencia", "metricas"):
        if not m.get(campo):
            errores.append(f"modelo sin {campo}")
    for nombre, esperado in CASOS.items():
        cat, prob = inferir(m, nombre)
        marca = "ok " if cat == esperado else "MAL"
        print(f"{marca} {nombre!r} -> {cat} ({prob:.2f}) esperado {esperado}")
        if cat != esperado:
            errores.append(f"caso {nombre!r}: {cat} != {esperado}")

    c = json.loads((PUBLICO / "firmamento" / "constelaciones.json").read_text(encoding="utf-8"))
    for campo in ("fuente", "fecha_corrida", "licencia", "metodo", "validaciones"):
        if not c.get(campo):
            errores.append(f"constelaciones sin {campo}")
    poligono = cargar_poligono()
    todos = [e for k in c["constelaciones"] for e in k["estrellas"]] + c["puntos_sueltos"]
    osm = [e["osm"] for e in todos]
    if len(osm) != len(set(osm)):
        errores.append("ids OSM duplicados en constelaciones.json")
    lon = np.array([e["lon"] for e in todos])
    lat = np.array([e["lat"] for e in todos])
    if not contains_xy(poligono, lon, lat).all():
        errores.append("hay puntos fuera del polígono")
    for k in c["constelaciones"]:
        n = len(k["estrellas"])
        if k["tamano"] != n or n < c["metodo"]["min_cluster_size"]:
            errores.append(f"{k['id']}: tamaño incoherente")
        if len(k["aristas"]) != n - 1:  # un árbol de n nodos tiene n-1 aristas
            errores.append(f"{k['id']}: el MST no tiene n-1 aristas")
    if c["resumen"]["total_comercios"] != len(todos):
        errores.append("el resumen no suma los puntos")

    print(f"{len(todos)} puntos revisados, {len(c['constelaciones'])} constelaciones")
    for e in errores:
        print("ERROR:", e, file=sys.stderr)
    return 1 if errores else 0


if __name__ == "__main__":
    sys.exit(main())
