"""Paso 1 · Descarga de comercios desde OpenStreetMap (Overpass).

Salidas (en pipeline/datos/, con la fecha de la corrida en el nombre):
  osm_valle_aburra_<fecha>.csv  todo el Valle de Aburrá, SOLO con nombre (insumo del clasificador)
  osm_comuna3_<fecha>.csv       lo anterior que cae dentro de lib/geo/manrique.json
  osm_meta_<fecha>.json         trazabilidad y resultado de las validaciones
  osm_comuna3todos_<fecha>.csv  Comuna 3 con y SIN nombre (insumo de las constelaciones)
  osm_meta_comuna3todos_<fecha>.json  trazabilidad de esa segunda consulta

Dos consultas con propósitos distintos. El clasificador aprende de nombres, así que
el Valle sigue exigiendo `name`. Las constelaciones describen el comercio mapeado:
igual que la asesoría, cuentan también los locales que en OSM no tienen nombre.
`--solo-comuna3` salta la consulta del Valle: el conjunto de entrenamiento queda
intacto (no se reescribe el CSV del Valle ni el de la comuna con nombre).
Además de la categoría, cada fila guarda etiquetas de detalle (dirección,
horario, cocina, descripción, web) y NUNCA contactos de personas.

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

def bbox_comuna3() -> str:
    """Caja del polígono en el orden de Overpass (sur,oeste,norte,este).

    Se pide solo la caja, no un área administrativa: la Comuna 3 no es un
    municipio y el recorte fino lo hace shapely contra manrique.json.
    """
    oeste, sur, este, norte = cargar_poligono().bounds
    return f"{sur:.5f},{oeste:.5f},{norte:.5f},{este:.5f}"


def consulta_comuna3() -> str:
    # Mismas etiquetas que CONSULTA, sin exigir ["name"].
    caja = bbox_comuna3()
    return f"""
[out:json][timeout:{TIMEOUT_CONSULTA_S}];
(
  nwr["shop"]({caja});
  nwr["craft"]({caja});
  nwr["amenity"~"^({AMENIDADES})$"]({caja});
  nwr["healthcare"]({caja});
  nwr["leisure"="fitness_centre"]({caja});
);
out center tags;
"""


CAMPOS_TAG = ["shop", "craft", "amenity", "healthcare", "leisure", "hairdresser"]

# Etiquetas de detalle para mostrar al tocar una estrella. Lista cerrada A
# PROPÓSITO: no se conserva phone, contact:*, email ni nada de personas (regla
# del proyecto: ningún contacto nuevo; Ley 1581). Si OSM trae más, se descarta.
# columna del CSV -> etiqueta OSM
CAMPOS_DETALLE = {
    "addr_street": "addr:street",
    "addr_housenumber": "addr:housenumber",
    "opening_hours": "opening_hours",
    "cuisine": "cuisine",
    "description": "description",
    "website": "website",
}
# Un párrafo largo no cabe en la ficha del mapa; se corta con elipsis.
MAX_DESCRIPCION = 140


def recortar(texto: str, maximo: int) -> str:
    texto = " ".join(texto.split())
    return texto if len(texto) <= maximo else texto[: maximo - 1].rstrip() + "…"


def descargar(consulta: str = CONSULTA) -> tuple[dict, str]:
    ultimo_error = None
    for url in ENDPOINTS:
        try:
            print(f"Consultando {url} ...", flush=True)
            r = requests.post(
                url,
                data={"data": consulta},
                headers={"User-Agent": USER_AGENT},
                timeout=TIMEOUT_HTTP_S,
            )
            if r.status_code == 200:
                return r.json(), url
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
        for col, etiqueta in CAMPOS_DETALLE.items():
            valor = tags.get(etiqueta)
            if valor is not None and valor.strip():
                fila[col] = recortar(valor, MAX_DESCRIPCION) if col == "description" else valor.strip()
            else:
                fila[col] = None
        fila["categoria"] = categoria_osm(fila)
        filas.append(fila)
    return pd.DataFrame(filas)


def descargar_valle(fecha: str, sello: str) -> None:
    bruto, servidor = descargar()
    df = a_dataframe(bruto)
    n_bruto = len(df)
    osm_base = bruto.get("osm3s", {}).get("timestamp_osm_base")
    if not osm_base:
        raise SystemExit("La respuesta de Overpass no trae osm3s.timestamp_osm_base")

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
        "timestamp_osm_base": osm_base,
        "osm_base_timestamp": osm_base,  # nombre anterior, se deja para no romper lectores viejos
        "servidor": servidor,
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




def descargar_comuna3(fecha: str, sello: str) -> None:
    """Todos los comercios de la caja de la comuna, con o sin nombre."""
    consulta = consulta_comuna3()
    bruto, servidor = descargar(consulta)
    osm_base = bruto.get("osm3s", {}).get("timestamp_osm_base")
    if not osm_base:
        raise SystemExit("La respuesta de Overpass no trae osm3s.timestamp_osm_base")
    df = a_dataframe(bruto)
    n_bruto = len(df)

    nulos_antes = {"lat": int(df["lat"].isna().sum()), "lon": int(df["lon"].isna().sum())}
    df = df.dropna(subset=["lat", "lon"]).copy()
    # Sin nombre se guarda como "" (no "Sin nombre"): la app decide cómo mostrarlo.
    df["nombre"] = df["nombre"].fillna("").str.strip()

    dup_id = int(df.duplicated(subset=["osm_tipo", "osm_id"]).sum())
    df = df.drop_duplicates(subset=["osm_tipo", "osm_id"])

    # Duplicado de hecho: igual criterio que el Valle (mismo nombre a ~1 m). Solo para los
    # sin nombre se agrega la etiqueta OSM, porque dos locales sin nombre pegados
    # pero de rubro distinto son dos comercios, no uno repetido.
    clave = df.assign(
        _n=df["nombre"].str.lower(),
        _t=df[["shop", "craft", "amenity", "healthcare", "leisure"]]
        .fillna("").agg("|".join, axis=1).where(df["nombre"] == "", ""),
        _la=df["lat"].round(5),
        _lo=df["lon"].round(5),
    )
    dup_geo = clave.duplicated(subset=["_n", "_t", "_la", "_lo"])
    dup_geo_sin_nombre = int((dup_geo & (clave["nombre"] == "")).sum())
    df = df.loc[~dup_geo].copy()

    poligono = cargar_poligono()
    dentro = contains_xy(poligono, df["lon"].to_numpy(), df["lat"].to_numpy())
    en_caja_fuera = int((~dentro).sum())
    comuna = df[dentro].sort_values(["osm_tipo", "osm_id"]).reset_index(drop=True)
    fuera = int((~contains_xy(poligono, comuna["lon"].to_numpy(), comuna["lat"].to_numpy())).sum())
    assert fuera == 0, "hay comercios de la comuna fuera del polígono"

    comuna.to_csv(DATOS / f"osm_comuna3todos_{sello}.csv", index=False, encoding="utf-8")
    sin_nombre = int((comuna["nombre"] == "").sum())
    meta = {
        "fuente": FUENTE,
        "licencia": "ODbL 1.0 — https://www.openstreetmap.org/copyright",
        "fecha_corrida": fecha,
        "timestamp_osm_base": osm_base,
        "osm_base_timestamp": osm_base,
        "servidor": servidor,
        "consulta_overpass": consulta.strip(),
        "elementos_brutos": n_bruto,
        "validaciones": {
            "nulos_descartados": nulos_antes,
            "duplicados_por_id_eliminados": dup_id,
            "duplicados_por_nombre_categoria_y_posicion_eliminados": int(dup_geo.sum()),
            "de_ellos_sin_nombre": dup_geo_sin_nombre,
            "en_la_caja_pero_fuera_del_poligono": en_caja_fuera,
            "comuna3_fuera_del_poligono": fuera,
        },
        "total_comuna3": int(len(comuna)),
        "comuna3_con_nombre": int(len(comuna) - sin_nombre),
        "comuna3_sin_nombre": sin_nombre,
        "comuna3_con_categoria_mapeada": int((comuna["categoria"] != "").sum()),
    }
    (DATOS / f"osm_meta_comuna3todos_{sello}.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({k: v for k, v in meta.items() if k != "consulta_overpass"},
                     ensure_ascii=False, indent=2))


def main() -> None:
    fecha = ahora_iso()
    sello = fecha[:10]
    DATOS.mkdir(parents=True, exist_ok=True)
    if "--solo-comuna3" not in sys.argv:
        descargar_valle(fecha, sello)
        # Pausa entre consultas: Overpass reparte cupo por IP y la del Valle es pesada.
        time.sleep(30)
    descargar_comuna3(fecha, sello)


if __name__ == "__main__":
    main()
