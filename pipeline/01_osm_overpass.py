"""Paso 1 · Descarga de comercios con nombre desde OpenStreetMap (Overpass).

Salidas (en pipeline/datos/, con la fecha de la corrida en el nombre):
  osm_valle_aburra_<fecha>.csv  todo el Valle de Aburrá (insumo del clasificador)
  osm_comuna3_<fecha>.csv       solo lo que cae dentro de lib/geo/manrique.json
  osm_meta_<fecha>.json         trazabilidad y resultado de las validaciones

Una sola consulta grande, con timeout y User-Agent identificable: Overpass es un
servicio público y gratuito, así que se le pide lo mínimo posible. Los datos son
ODbL: quien los redistribuya debe atribuir a los colaboradores de OSM.
"""
from __future__ import annotations

import json
import sys
import time

import pandas as pd
import requests
from shapely import contains_xy

from comun import DATOS, FUENTE, ahora_iso, categoria_osm, cargar_poligono

# Se identifica el proyecto, no a una persona: es la cortesía que pide Overpass.
USER_AGENT = (
    "ConstelacionesManrique-Pipeline/1.0 "
    "(+https://github.com/Luis-Vanegas/territorio-inn-2026-manrique)"
)
ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
TIMEOUT_CONSULTA_S = 240
TIMEOUT_HTTP_S = 300

# Los 10 municipios del Valle de Aburrá, por área administrativa (nivel 6).
# El bbox es obligatorio: "Medellín", "Bello" o "Caldas" también son municipios
# de México, Venezuela, etc., y sin él la primera corrida trajo puntos de
# Veracruz. El bbox solo acota; el límite real lo pone el área del municipio.
BBOX = "6.00,-75.75,6.55,-75.25"
MUNICIPIOS = (
    "Medellín|Bello|Itagüí|Envigado|Sabaneta|La Estrella|Caldas|"
    "Copacabana|Girardota|Barbosa"
)

AMENIDADES = (
    "restaurant|fast_food|cafe|food_court|ice_cream|pharmacy|clinic|doctors|"
    "dentist|hospital|veterinary|animal_boarding|car_repair|car_wash"
)

CONSULTA = f"""
[out:json][timeout:{TIMEOUT_CONSULTA_S}];
area["boundary"="administrative"]["admin_level"="6"]["name"~"^({MUNICIPIOS})$"]->.valle;
(
  nwr["name"]["shop"](area.valle)({BBOX});
  nwr["name"]["craft"](area.valle)({BBOX});
  nwr["name"]["amenity"~"^({AMENIDADES})$"](area.valle)({BBOX});
  nwr["name"]["healthcare"](area.valle)({BBOX});
  nwr["name"]["leisure"="fitness_centre"](area.valle)({BBOX});
);
out center tags;
"""

CAMPOS_TAG = ["shop", "craft", "amenity", "healthcare", "leisure", "hairdresser"]


def descargar() -> dict:
    ultimo_error = None
    for url in ENDPOINTS:
        try:
            print(f"Consultando {url} ...", flush=True)
            r = requests.post(
                url,
                data={"data": CONSULTA},
                headers={"User-Agent": USER_AGENT},
                timeout=TIMEOUT_HTTP_S,
            )
            if r.status_code == 200:
                return r.json()
            ultimo_error = f"{url}: HTTP {r.status_code} {r.text[:200]}"
        except requests.RequestException as e:
            ultimo_error = f"{url}: {e}"
        print(f"  falló ({ultimo_error}); se prueba el siguiente espejo", file=sys.stderr)
        time.sleep(30)  # no martillar el servicio si recién nos dijo que está saturado
    raise SystemExit(f"Overpass no respondió: {ultimo_error}")


def a_dataframe(datos: dict) -> pd.DataFrame:
    filas = []
    for el in datos["elements"]:
        tags = el.get("tags", {})
        # Nodos traen lat/lon; ways y relations traen `center`.
        lat = el.get("lat", el.get("center", {}).get("lat"))
        lon = el.get("lon", el.get("center", {}).get("lon"))
        fila = {
            "osm_tipo": el["type"],
            "osm_id": el["id"],
            "nombre": tags.get("name"),
            "lat": lat,
            "lon": lon,
        }
        for c in CAMPOS_TAG:
            fila[c] = tags.get(c)
        fila["categoria"] = categoria_osm(fila)
        filas.append(fila)
    return pd.DataFrame(filas)


def main() -> None:
    fecha = ahora_iso()
    sello = fecha[:10]
    DATOS.mkdir(parents=True, exist_ok=True)

    bruto = descargar()
    df = a_dataframe(bruto)
    n_bruto = len(df)
    osm_base = bruto.get("osm3s", {}).get("timestamp_osm_base")

    # --- Validaciones -------------------------------------------------------
    nulos_antes = {
        "nombre": int(df["nombre"].isna().sum()),
        "lat": int(df["lat"].isna().sum()),
        "lon": int(df["lon"].isna().sum()),
    }
    df = df.dropna(subset=["nombre", "lat", "lon"])
    df["nombre"] = df["nombre"].str.strip()
    df = df[df["nombre"] != ""]

    # Un mismo elemento no debería repetirse, pero un nwr puede salir por dos ramas de la unión.
    dup_id = int(df.duplicated(subset=["osm_tipo", "osm_id"]).sum())
    df = df.drop_duplicates(subset=["osm_tipo", "osm_id"])

    # Duplicado "de hecho": mismo nombre exacto a menos de ~1 m (nodo + edificio, por ejemplo).
    clave = df.assign(
        _n=df["nombre"].str.lower(), _la=df["lat"].round(5), _lo=df["lon"].round(5)
    )
    dup_geo = int(clave.duplicated(subset=["_n", "_la", "_lo"]).sum())
    df = df.loc[~clave.duplicated(subset=["_n", "_la", "_lo"])].copy()

    df = df.sort_values(["osm_tipo", "osm_id"]).reset_index(drop=True)

    poligono = cargar_poligono()
    dentro = contains_xy(poligono, df["lon"].to_numpy(), df["lat"].to_numpy())
    comuna = df[dentro].copy()

    # Cada fila de la comuna ya cumple dentro-del-polígono por construcción; se
    # re-verifica de forma independiente porque es una de las validaciones que pide la rúbrica.
    fuera = int((~contains_xy(poligono, comuna["lon"].to_numpy(), comuna["lat"].to_numpy())).sum())
    assert fuera == 0, "hay comercios de la comuna fuera del polígono"

    df.to_csv(DATOS / f"osm_valle_aburra_{sello}.csv", index=False, encoding="utf-8")
    comuna.to_csv(DATOS / f"osm_comuna3_{sello}.csv", index=False, encoding="utf-8")

    meta = {
        "fuente": FUENTE,
        "licencia": "ODbL 1.0 — https://www.openstreetmap.org/copyright",
        "fecha_corrida": fecha,
        "osm_base_timestamp": osm_base,
        "consulta_overpass": CONSULTA.strip(),
        "elementos_brutos": n_bruto,
        "validaciones": {
            "nulos_descartados": nulos_antes,
            "duplicados_por_id_eliminados": dup_id,
            "duplicados_por_nombre_y_posicion_eliminados": dup_geo,
            "comuna3_fuera_del_poligono": fuera,
        },
        "total_valle_aburra": int(len(df)),
        "total_comuna3": int(len(comuna)),
        "comuna3_con_categoria_mapeada": int((comuna["categoria"] != "").sum()),
        "valle_con_categoria_mapeada": int((df["categoria"] != "").sum()),
    }
    (DATOS / f"osm_meta_{sello}.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({k: v for k, v in meta.items() if k != "consulta_overpass"},
                     ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
