"""Paso 5 · Constelaciones vs centralidades del POT de Medellín.

Pregunta: ¿los grupos de comercio que encuentra HDBSCAN coinciden con los nodos
de actividad que la planeación oficial ya reconoce (subsistema de centralidades
del POT, Acuerdo 48 de 2014)? ¿Hay comercio agrupado que la planeación no ve?

Entrada:
  - Capa «Centralidades urbanas» del servicio ArcGIS REST de la Alcaldía
    (VM_20_Subs_Centralidades, capa 1). Con `--descargar` se consulta el servicio
    y se guarda el crudo en pipeline/datos/; sin la bandera se usa el crudo más
    reciente, así la corrida funciona sin internet como los pasos 2 y 3.
  - public/firmamento/constelaciones.json (paso 2) y el CSV de comercios (paso 1).
Salida: public/firmamento/centralidades.json. NO se toca constelaciones.json: el
cruce vive aparte para no cambiar un contrato que la app ya consume.

Decisiones que conviene no olvidar:
- Todas las distancias y áreas se calculan en METROS (UTM 18N, EPSG:32618), igual
  que HDBSCAN; en grados un «100 m» no significaría lo mismo al norte y al este.
- Se conservan las centralidades que se superponen con la comuna al menos
  UMBRAL_AREA_M2: una que apenas la roza por el borde (la «Metropolitana» del
  centro, 0 m² adentro) no es un nodo de Manrique. El polígono se publica ENTERO,
  no recortado: «Campo Valdés - Manrique» es 93 % de Comuna 4, y recortarlo haría
  creer que el nodo oficial es un parche de 1,2 ha.
- Límite de los datos: el comercio de OSM que tenemos está solo dentro del
  polígono de la comuna. Para una centralidad que se sale de ella, lo de afuera no
  se midió; por eso se publica `pct_dentro_comuna` y los conteos son «dentro de la
  comuna».
- Una constelación se relaciona con una centralidad así: `dentro` si su centroide
  cae en el polígono, `borde` si el centroide queda a <= RADIO_BORDE_M del polígono,
  `fuera` si no. 100 m es del orden del radio p90 de una constelación típica; el
  cruce a 50 y 200 m queda en `sensibilidad_radio_borde` para que nadie crea que
  100 es un hecho de la naturaleza.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import requests
from pyproj import Transformer
from shapely.geometry import Point, mapping, shape
from shapely.ops import transform, unary_union

from comun import (
    DATOS,
    PUBLICO,
    SEMILLA,
    ahora_iso,
    cargar_barrios,
    cargar_poligono,
    ultimo_csv,
)

URL_SERVICIO = (
    "https://www.medellin.gov.co/servidormapas/rest/services/ordenamiento_ter/"
    "VM_20_Subs_Centralidades/MapServer"
)
CAPA = 1  # «Centralidades urbanas» (la capa 9 trae exactamente las mismas 78 filas)
EPSG_METROS = "EPSG:32618"
RADIO_BORDE_M = 100
RADIOS_SENSIBILIDAD_M = (50, 100, 200)
UMBRAL_AREA_M2 = 1000

A_METROS = Transformer.from_crs("EPSG:4326", EPSG_METROS, always_xy=True).transform

# El servicio no declara licencia en sus metadatos (solo el `copyrightText`). No se
# afirma una que no se pudo verificar: queda dicho y la decisión es de quien publique.
LICENCIA = (
    "No declarada en el servicio ArcGIS REST (solo copyrightText: «Alcaldía de Medellín - "
    "Departamento Administrativo de Planeación - Subdirección de Planeación Territorial y "
    "Estratégica de Ciudad - Unidad de Planificación Territorial»). Pendiente de confirmar "
    "los términos de uso de los datos abiertos de la Alcaldía antes de redistribuir."
)


def descargar() -> str:
    """Consulta el servicio con la caja de la comuna y guarda el crudo; devuelve el nombre."""
    minx, miny, maxx, maxy = cargar_poligono().bounds
    params = {
        "where": "1=1",
        "geometry": f"{minx},{miny},{maxx},{maxy}",
        "geometryType": "esriGeometryEnvelope",
        "inSR": 4326,
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": "*",
        "outSR": 4326,
        "f": "geojson",
    }
    # Sin User-Agent de navegador el servidor devuelve cuerpo vacío.
    r = requests.get(
        f"{URL_SERVICIO}/{CAPA}/query", params=params, headers={"User-Agent": "Mozilla/5.0"}, timeout=90
    )
    r.raise_for_status()
    gj = r.json()
    if "features" not in gj:
        raise SystemExit(f"Respuesta inesperada del servicio: {str(gj)[:300]}")
    if gj.get("exceededTransferLimit") or gj.get("properties", {}).get("exceededTransferLimit"):
        raise SystemExit("El servicio truncó la respuesta (exceededTransferLimit); reduce la caja")
    hoy = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    nombre = f"centralidades_pot_{hoy}.geojson"
    DATOS.mkdir(parents=True, exist_ok=True)
    (DATOS / nombre).write_text(json.dumps(gj, ensure_ascii=False), encoding="utf-8")
    return nombre


def ultimo_crudo():
    archivos = sorted(DATOS.glob("centralidades_pot_*.geojson"))
    if not archivos:
        raise SystemExit("No hay centralidades_pot_*.geojson en pipeline/datos; corre con --descargar")
    return archivos[-1]


def slug(texto: str) -> str:
    base = unicodedata.normalize("NFD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "_", base.lower()).strip("_")


def fecha(ms) -> str | None:
    return datetime.fromtimestamp(ms / 1000, timezone.utc).strftime("%Y-%m-%d") if ms else None


def redondear(geom) -> dict:
    """GeoJSON con 6 decimales (~0,1 m): suficiente para dibujar y 40 % más liviano."""
    def r(c):
        return [round(c[0], 6), round(c[1], 6)] if isinstance(c[0], float) else [r(x) for x in c]
    g = mapping(geom)
    return {"type": g["type"], "coordinates": r(g["coordinates"])}


def cruce(centro_m: Point, poligonos_m: dict, radio: float) -> tuple[str | None, str, float]:
    """(id, relacion, distancia) de la centralidad más cercana al centroide."""
    if not poligonos_m:
        return None, "fuera", float("inf")
    mejor = min(poligonos_m, key=lambda i: (poligonos_m[i].distance(centro_m), i))
    d = float(poligonos_m[mejor].distance(centro_m))
    if d == 0:
        return mejor, "dentro", 0.0
    return (mejor, "borde", d) if d <= radio else (None, "fuera", d)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--descargar", action="store_true", help="consulta el servicio de la Alcaldía y guarda el crudo")
    args = ap.parse_args()
    np.random.seed(SEMILLA)

    crudo_nombre = descargar() if args.descargar else ultimo_crudo().name
    crudo = json.loads((DATOS / crudo_nombre).read_text(encoding="utf-8"))
    fecha_descarga = re.search(r"(\d{4}-\d{2}-\d{2})", crudo_nombre).group(1)

    comuna = cargar_poligono()
    comuna_m = transform(A_METROS, comuna)
    barrios_m = [(n, transform(A_METROS, p)) for n, p in cargar_barrios()[0]]

    # --- centralidades que tocan la comuna ---
    cen = []
    for f in crudo["features"]:
        g = shape(f["geometry"]).buffer(0)  # buffer(0) arregla anillos mal cerrados sin mover el contorno
        gm = transform(A_METROS, g)
        dentro = gm.intersection(comuna_m).area
        if dentro < UMBRAL_AREA_M2:
            continue
        p = f["properties"]
        cen.append({"p": p, "g": g, "gm": gm, "dentro_m2": dentro})
    cen.sort(key=lambda c: (-c["dentro_m2"] / c["gm"].area, c["p"]["nombre"]))  # las más propias de la comuna primero

    usados: set[str] = set()
    for c in cen:
        base = f"cen_{slug(c['p']['nombre'])}"
        c["id"] = base
        if base in usados:
            raise SystemExit(f"Dos centralidades con el mismo nombre: {base}")
        usados.add(base)
    poligonos_m = {c["id"]: c["gm"] for c in cen}

    # --- comercios (paso 1) y constelaciones (paso 2) ---
    ruta_csv = ultimo_csv("osm_comuna3todos")
    df = pd.read_csv(ruta_csv, keep_default_na=False, dtype={"categoria": str}).reset_index(drop=True)
    cs = json.loads((PUBLICO / "firmamento" / "constelaciones.json").read_text(encoding="utf-8"))
    if cs["datos_de_entrada"] != ruta_csv.name:
        raise SystemExit(
            f"constelaciones.json salió de {cs['datos_de_entrada']} y el CSV más reciente es {ruta_csv.name}: "
            "corre 02_constelaciones.py antes de este paso"
        )
    if len(df) != cs["resumen"]["total_comercios"]:
        raise SystemExit("El CSV y constelaciones.json no tienen el mismo número de comercios")

    x, y = A_METROS(df["lon"].to_numpy(), df["lat"].to_numpy())
    puntos_m = [Point(a, b) for a, b in zip(x, y)]
    sin_nombre = (df["nombre"].str.strip() == "") | df["nombre"].str.strip().str.match(r"(?i)^sin\s+nombre\.?$")
    # Mismo criterio que 02: «Sin nombre» escrito a mano en OSM es ausencia de nombre.
    estrellas_en_constel = {e["osm"] for k in cs["constelaciones"] for e in k["estrellas"]}
    osm_ids = [f"{t[0]}{i}" for t, i in zip(df["osm_tipo"], df["osm_id"])]

    unidad = unary_union([c["gm"] for c in cen])
    area_comuna_km2 = comuna_m.area / 1e6
    area_cen_en_comuna_km2 = unidad.intersection(comuna_m).area / 1e6

    salida_cen = []
    for c in cen:
        gm = c["gm"]
        dentro = np.array([gm.covers(pt) for pt in puntos_m])
        cerca = np.array([gm.distance(pt) <= RADIO_BORDE_M for pt in puntos_m])
        sub = df[dentro]
        conteo = sub["categoria"].replace("", "sin_categoria").value_counts()
        mezcla = [{"categoria": k, "n": int(n)} for k, n in sorted(conteo.items(), key=lambda t: (-t[1], t[0]))]
        area_dentro = c["dentro_m2"]
        p = c["p"]
        salida_cen.append(
            {
                "id": c["id"],
                "nombre": p["nombre"],
                "jerarquia": p["jerarquia"],
                "orden": p["orden"],
                "caracter": p["caracter"],
                "estado": p["estado"],
                "accion": p["accion"],
                "fecha_adopcion": fecha(p.get("fecha_adopcion")),
                "area_m2": round(gm.area),
                "area_dentro_comuna_m2": round(area_dentro),
                "pct_dentro_comuna": round(100 * area_dentro / gm.area, 1),
                "barrios": sorted(n for n, b in barrios_m if gm.intersection(b).area >= 1),
                "comercios_dentro": int(dentro.sum()),
                "comercios_dentro_sin_nombre": int((dentro & sin_nombre.to_numpy()).sum()),
                "comercios_a_borde": int((cerca & ~dentro).sum()),
                "comercios_por_km2_dentro_comuna": round(float(dentro.sum()) / (area_dentro / 1e6), 1),
                "mezcla_categorias": mezcla,
                "geometry": redondear(c["g"]),
            }
        )

    # --- cada constelación contra las centralidades ---
    rel_cs = []
    for k in cs["constelaciones"]:
        centro = Point(*A_METROS(k["centroide"]["lon"], k["centroide"]["lat"]))
        cid, rel, d = cruce(centro, poligonos_m, RADIO_BORDE_M)
        n_dentro = sum(
            1 for e in k["estrellas"] if cid and poligonos_m[cid].covers(Point(*A_METROS(e["lon"], e["lat"])))
        )
        rel_cs.append(
            {
                "id": k["id"],
                "codigo": k["codigo"],
                "tamano": k["tamano"],
                "relacion": rel,
                "centralidad": cid,
                "distancia_m": round(d, 1) if d != float("inf") else None,
                "estrellas_dentro": n_dentro,
            }
        )
    for c, s in zip(cen, salida_cen):
        s["constelaciones"] = [r["id"] for r in rel_cs if r["centralidad"] == c["id"]]

    # Sensibilidad: cuántas constelaciones coinciden (dentro o borde) según el radio.
    sensibilidad = []
    for radio in RADIOS_SENSIBILIDAD_M:
        rs = [cruce(Point(*A_METROS(k["centroide"]["lon"], k["centroide"]["lat"])), poligonos_m, radio)[1] for k in cs["constelaciones"]]
        sensibilidad.append(
            {"radio_borde_m": radio, "dentro": rs.count("dentro"), "borde": rs.count("borde"), "fuera": rs.count("fuera")}
        )

    # --- comercio: dentro/cerca/fuera de las centralidades, y en constelación o suelto ---
    dentro_alguna = np.array([unidad.covers(pt) for pt in puntos_m])
    cerca_alguna = np.array([unidad.distance(pt) <= RADIO_BORDE_M for pt in puntos_m]) & ~dentro_alguna
    en_constel = np.array([i in estrellas_en_constel for i in osm_ids])
    fuera_alguna = ~dentro_alguna & ~cerca_alguna
    comercios_fuera_en_constel = int((fuera_alguna & en_constel).sum())

    area_fuera_km2 = area_comuna_km2 - area_cen_en_comuna_km2
    cs_fuera = [r for r in rel_cs if r["relacion"] == "fuera"]
    resumen = {
        "centralidades_en_servicio": len(crudo["features"]),
        "centralidades_que_tocan_la_comuna": len(salida_cen),
        "por_jerarquia": {j: sum(1 for s in salida_cen if s["jerarquia"] == j) for j in sorted({s["jerarquia"] for s in salida_cen})},
        "area_comuna_km2": round(area_comuna_km2, 3),
        "area_centralidades_en_comuna_km2": round(area_cen_en_comuna_km2, 3),
        "pct_area_comuna_en_centralidades": round(100 * area_cen_en_comuna_km2 / area_comuna_km2, 1),
        "total_comercios": int(len(df)),
        "comercios_dentro_de_centralidad": int(dentro_alguna.sum()),
        "comercios_a_borde_de_centralidad": int(cerca_alguna.sum()),
        "comercios_fuera_de_centralidad": int(fuera_alguna.sum()),
        "pct_comercios_dentro_de_centralidad": round(100 * dentro_alguna.sum() / len(df), 1),
        "comercios_por_km2_dentro": round(float(dentro_alguna.sum()) / area_cen_en_comuna_km2, 1),
        "comercios_por_km2_fuera": round(float((~dentro_alguna).sum()) / area_fuera_km2, 1),
        "constelaciones": len(rel_cs),
        "constelaciones_dentro": sum(1 for r in rel_cs if r["relacion"] == "dentro"),
        "constelaciones_borde": sum(1 for r in rel_cs if r["relacion"] == "borde"),
        "constelaciones_fuera": len(cs_fuera),
        "comercios_en_constelaciones_fuera_de_centralidad": comercios_fuera_en_constel,
        "centralidades_sin_constelacion": sum(1 for s in salida_cen if not s["constelaciones"]),
    }

    salida = {
        "fuente": "Alcaldía de Medellín, Departamento Administrativo de Planeación: POT (Acuerdo 48 de 2014), "
        "mapa protocolizado VM_20_Subs_Centralidades, capa «Centralidades urbanas»; comercio: OpenStreetMap contributors (ODbL 1.0)",
        "licencia": LICENCIA,
        "licencia_comercio_osm": "ODbL 1.0 — https://www.openstreetmap.org/copyright",
        "fecha_corrida": ahora_iso(),
        "servicio": f"{URL_SERVICIO}/{CAPA}",
        "descarga": {"archivo": crudo_nombre, "fecha": fecha_descarga, "registros_en_la_caja_de_la_comuna": len(crudo["features"])},
        "datos_de_entrada": {"comercios": ruta_csv.name, "constelaciones": "public/firmamento/constelaciones.json"},
        "metodo": {
            "crs_distancias": EPSG_METROS,
            "radio_borde_m": RADIO_BORDE_M,
            "umbral_area_m2": UMBRAL_AREA_M2,
            "relacion": "dentro = centroide en el polígono; borde = centroide a <= radio_borde_m; fuera = el resto",
            "semilla": SEMILLA,
        },
        "limites": [
            "El comercio de OSM solo cubre el polígono de la comuna: de una centralidad que se sale de ella no se midió lo de afuera.",
            "Las centralidades son del POT 2014 (vigente hasta la revisión de mediano plazo); OSM es de 2026 y no es un censo.",
        ],
        "resumen": resumen,
        "sensibilidad_radio_borde": sensibilidad,
        "centralidades": salida_cen,
        "constelaciones": rel_cs,
    }
    destino = PUBLICO / "firmamento" / "centralidades.json"
    destino.write_text(json.dumps(salida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps({"resumen": resumen, "sensibilidad": sensibilidad}, ensure_ascii=False, indent=2))
    for s in salida_cen:
        print(f"{s['nombre']:28} {s['jerarquia']:9} dentro_comuna={s['pct_dentro_comuna']:5}%  comercios={s['comercios_dentro']:3}  borde={s['comercios_a_borde']:3}  cons={s['constelaciones']}")
    print(f"{destino} ({destino.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
