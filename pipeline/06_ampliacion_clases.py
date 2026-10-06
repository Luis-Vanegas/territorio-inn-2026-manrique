"""Paso 6 · Ampliación de clases escasas con comercios reales de OSM en Colombia.

Salidas (en pipeline/datos/):
  osm_ampliacion_<fecha>.csv        nombre + etiquetas + categoría (sin coordenadas)
  osm_meta_ampliacion_<fecha>.json  trazabilidad

Por qué: en el Valle de Aburrá hay ~16 locales de diseño, publicidad e impresiones
con nombre; con eso el modelo no aprende la clase y «Diseño gráfico y publicidad»
salía como celulares. Se amplía SOLO esa clase al país, con etiquetas reales de OSM
(nada escrito a mano). `03_clasificador.py` suma estas filas solo al entrenamiento:
el holdout sigue siendo el del Valle, así que el F1 que se reporta es comparable.

ponytail: una sola clase. Si otra queda corta (lavandería, reciclaje...), se suman
sus etiquetas a CONSULTA; el resto del flujo no cambia.
"""
from __future__ import annotations

import importlib
import json

import pandas as pd

from comun import DATOS, FUENTE, ahora_iso, categoria_osm

paso1 = importlib.import_module("01_osm_overpass")

CONSULTA = f"""
[out:json][timeout:{paso1.TIMEOUT_CONSULTA_S}];
area["ISO3166-1"="CO"][admin_level=2]->.co;
(
  nwr["name"]["shop"~"^(copyshop|printing)$"](area.co);
  nwr["name"]["craft"~"^(signmaker|printer)$"](area.co);
  nwr["name"]["office"~"^(advertising_agency|graphic_design)$"](area.co);
);
out tags;
"""


def main() -> None:
    fecha = ahora_iso()
    sello = fecha[:10]
    bruto, servidor = paso1.descargar(CONSULTA)
    filas = []
    for el in bruto["elements"]:
        tags = el.get("tags", {})
        fila = {
            "osm_tipo": el["type"],
            "osm_id": el["id"],
            "nombre": (tags.get("name") or "").strip(),
            "shop": tags.get("shop"),
            "craft": tags.get("craft"),
            "office": tags.get("office"),
        }
        fila["categoria"] = categoria_osm(fila)
        filas.append(fila)
    df = pd.DataFrame(filas)
    n_bruto = len(df)
    df = df[(df["nombre"] != "") & (df["categoria"] != "")]
    df = df.drop_duplicates(subset=["osm_tipo", "osm_id"]).sort_values(["osm_tipo", "osm_id"])
    df.to_csv(DATOS / f"osm_ampliacion_{sello}.csv", index=False, encoding="utf-8")

    meta = {
        "fuente": FUENTE,
        "licencia": "ODbL 1.0 — https://www.openstreetmap.org/copyright",
        "fecha_corrida": fecha,
        "timestamp_osm_base": bruto.get("osm3s", {}).get("timestamp_osm_base"),
        "servidor": servidor,
        "consulta_overpass": CONSULTA.strip(),
        "elementos_brutos": n_bruto,
        "filas": int(len(df)),
        "por_categoria": df["categoria"].value_counts().to_dict(),
    }
    (DATOS / f"osm_meta_ampliacion_{sello}.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({k: v for k, v in meta.items() if k != "consulta_overpass"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
