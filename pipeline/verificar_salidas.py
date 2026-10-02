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

from shapely.geometry import Point

from comun import PUBLICO, cargar_barrios, cargar_poligono

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
        if not k.get("codigo") or k["codigo"].lower() != k["id"]:
            errores.append(f"{k['id']}: codigo ausente o no calza con el id")
        if k["mezcla_categorias"] != sorted(k["mezcla_categorias"], key=lambda m: (-m["n"], m["categoria"])):
            errores.append(f"{k['id']}: mezcla_categorias no está ordenada por conteo desc")
        if sum(m["n"] for m in k["mezcla_categorias"]) != n or not all(m["nombre"] for m in k["mezcla_categorias"]):
            errores.append(f"{k['id']}: mezcla_categorias sin nombre legible o no suma el tamaño")
        if len(k["aristas"]) != n - 1:  # un árbol de n nodos tiene n-1 aristas
            errores.append(f"{k['id']}: el MST no tiene n-1 aristas")
    r = c["resumen"]
    if r["total_comercios"] != len(todos):
        errores.append("el resumen no suma los puntos")
    # `nombre` puede ser null (comercio sin nombre en OSM) pero nunca "" ni un texto
    # inventado tipo «Sin nombre»: así la app sabe que es ausencia, no un nombre.
    for e in todos:
        n = e.get("nombre", "")
        if n is not None and (not isinstance(n, str) or not n.strip() or n.strip().lower().startswith("sin nombre")):
            errores.append(f"{e['osm']}: nombre inválido {n!r} (debe ser texto real o null)")
    sin_nombre = sum(1 for e in todos if e.get("nombre") is None)
    if r["sin_nombre"] != sin_nombre or r["con_nombre"] != len(todos) - sin_nombre:
        errores.append("con_nombre/sin_nombre del resumen no cuadran con los puntos")
    if r["con_nombre"] + r["sin_nombre"] != r["total_comercios"]:
        errores.append("con_nombre + sin_nombre != total_comercios")
    en_cumulos = sum(len(k["estrellas"]) for k in c["constelaciones"])
    if r["agrupados"] != en_cumulos or r["comercios_en_constelaciones"] != en_cumulos:
        errores.append("agrupados no cuadra con las estrellas de las constelaciones")
    if r["sueltos"] != len(c["puntos_sueltos"]) or r["puntos_sueltos"] != len(c["puntos_sueltos"]):
        errores.append("sueltos no cuadra con puntos_sueltos")
    if r["agrupados"] + r["sueltos"] != r["total_comercios"]:
        errores.append("agrupados + sueltos != total_comercios")
    if r["constelaciones"] != len(c["constelaciones"]):
        errores.append("el resumen cuenta mal las constelaciones")
    if not c.get("osm_base"):
        errores.append("constelaciones sin osm_base")
    if any("descripcion" in e.get("detalle", {}) for e in todos):
        errores.append("detalle publica descripcion (privacidad)")

    # Barrios: el campo existe en todos, calza con el polígono oficial y el nombre de
    # una constelación sin calle sale del barrio, no del rótulo viejo.
    barrios, _ = cargar_barrios()
    poligonos = dict(barrios)
    if not c.get("barrios", {}).get("fuente"):
        errores.append("constelaciones sin barrios.fuente")
    for e in todos:
        if "barrio" not in e:
            errores.append(f"{e['osm']}: sin campo barrio")
            continue
        b = e["barrio"]
        if b is not None and (b not in poligonos or not poligonos[b].covers(Point(e["lon"], e["lat"]))):
            errores.append(f"{e['osm']}: barrio {b!r} no contiene al punto")
        if b is None and any(p.covers(Point(e["lon"], e["lat"])) for p in poligonos.values()):
            errores.append(f"{e['osm']}: barrio null pero cae en un barrio")
    con_barrio = sum(1 for e in todos if e.get("barrio"))
    if r["comercios_con_barrio"] != con_barrio or r["comercios_sin_barrio"] != len(todos) - con_barrio:
        errores.append("comercios_con_barrio/comercios_sin_barrio no cuadran con los puntos")
    for k in c["constelaciones"]:
        lugar = k["nombre"].split(" · ")[0]
        if lugar == "Sin calle registrada" and any(e.get("barrio") for e in k["estrellas"]):
            errores.append(f"{k['id']}: sin calle pero con barrio; debería llamarse «Barrio …»")
        if lugar.startswith("Barrio ") and lugar[7:] not in poligonos:
            errores.append(f"{k['id']}: barrio {lugar[7:]!r} del nombre no existe")

    # El código identifica la constelación; el nombre descriptivo puede repetirse.
    codigos = [k.get("codigo") for k in c["constelaciones"]]
    if len(codigos) != len(set(codigos)):
        errores.append("códigos de constelación repetidos")
    print(f"{len(todos)} puntos revisados, {len(c['constelaciones'])} constelaciones")
    for e in errores:
        print("ERROR:", e, file=sys.stderr)
    return 1 if errores else 0


if __name__ == "__main__":
    sys.exit(main())
