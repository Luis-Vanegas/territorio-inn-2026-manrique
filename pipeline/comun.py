"""Utilidades compartidas por los scripts del pipeline.

Se separan acá para que la semilla, las rutas y la carga del polígono sean una
sola decisión y no tres copias que se desincronicen.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from shapely.geometry import shape

RAIZ = Path(__file__).resolve().parent.parent
DATOS = RAIZ / "pipeline" / "datos"
PUBLICO = RAIZ / "public"
POLIGONO = RAIZ / "lib" / "geo" / "manrique.json"
BARRIOS = RAIZ / "lib" / "geo" / "barrios-manrique.json"

# Semilla única: el split y el entrenamiento deben dar lo mismo en cada corrida.
SEMILLA = 42

# Las 12 categorías del sitio (ids de la tabla `categorias`, migración 012) que
# el clasificador sabe predecir. Las otras (modistería, línea blanca, transporte,
# educación, fotografía, lavandería, reciclaje, otros) casi no tienen etiqueta
# OSM confiable y quedan fuera: se anota en el reporte, no se inventan.
CATEGORIAS = {
    "comidas": "Comidas y almuerzos",
    "panaderia": "Panadería y repostería",
    "tienda_viveres": "Tienda y víveres",
    "ropa_calzado": "Ropa y calzado",
    "belleza_peluqueria": "Belleza y peluquería",
    "barberia": "Barbería",
    "construccion": "Plomería, electricidad y construcción",
    "mecanica_motos": "Mecánica y motos",
    "tecnologia_celulares": "Tecnología y celulares",
    "papeleria": "Papelería y misceláneas",
    "salud_bienestar": "Salud y bienestar",
    "mascotas": "Mascotas",
    "diseno_publicidad": "Diseño, publicidad e impresiones",
}

FUENTE = "OpenStreetMap contributors (ODbL 1.0), vía Overpass API"

# Etiqueta OSM -> categoría del sitio. Se evalúa en este orden de claves y gana
# la primera que calce. El orden importa: `shop` es la señal más específica de
# lo que vende un local; `amenity` y `healthcare` completan los servicios.
# La etiqueta sale de los TAGS de OSM, nunca del nombre: si saliera del nombre,
# el clasificador solo aprendería a repetir la regla con que se etiquetó.
MAPEO_OSM = {
    "shop": {
        "bakery": "panaderia", "pastry": "panaderia", "confectionery": "panaderia",
        "cake": "panaderia",
        "supermarket": "tienda_viveres", "convenience": "tienda_viveres",
        "greengrocer": "tienda_viveres", "butcher": "tienda_viveres",
        "grocery": "tienda_viveres", "general": "tienda_viveres",
        "beverages": "tienda_viveres", "deli": "tienda_viveres",
        "seafood": "tienda_viveres", "farm": "tienda_viveres",
        "dairy": "tienda_viveres", "kiosk": "tienda_viveres",
        "alcohol": "tienda_viveres", "food": "tienda_viveres",
        "clothes": "ropa_calzado", "shoes": "ropa_calzado",
        "boutique": "ropa_calzado", "bag": "ropa_calzado",
        "fashion_accessories": "ropa_calzado", "underwear": "ropa_calzado",
        "jewelry": "ropa_calzado", "fashion": "ropa_calzado",
        "hairdresser": "belleza_peluqueria", "beauty": "belleza_peluqueria",
        "cosmetics": "belleza_peluqueria", "nails": "belleza_peluqueria",
        "hardware": "construccion", "doityourself": "construccion",
        "electrical": "construccion", "paint": "construccion",
        "trade": "construccion", "building_materials": "construccion",
        "plumbing": "construccion", "glaziery": "construccion",
        "car_repair": "mecanica_motos", "motorcycle": "mecanica_motos",
        "motorcycle_repair": "mecanica_motos", "tyres": "mecanica_motos",
        "car_parts": "mecanica_motos", "car": "mecanica_motos",
        "mobile_phone": "tecnologia_celulares", "computer": "tecnologia_celulares",
        "electronics": "tecnologia_celulares",
        "telecommunication": "tecnologia_celulares", "hifi": "tecnologia_celulares",
        "stationery": "papeleria", "books": "papeleria",
        "gift": "papeleria", "variety_store": "papeleria", "newsagent": "papeleria",
        "art": "papeleria",
        "copyshop": "diseno_publicidad",
        "printing": "diseno_publicidad",
        "signmaker": "diseno_publicidad",
        "graphic_designer": "diseno_publicidad",
        "chemist": "salud_bienestar", "optician": "salud_bienestar",
        "herbalist": "salud_bienestar", "medical_supply": "salud_bienestar",
        "massage": "salud_bienestar", "nutrition_supplements": "salud_bienestar",
        "pet": "mascotas", "pet_grooming": "mascotas",
    },
    "craft": {
        "plumber": "construccion", "electrician": "construccion",
        "carpenter": "construccion", "builder": "construccion",
        "painter": "construccion", "welder": "construccion",
        "glaziery": "construccion", "roofer": "construccion",
        "hvac": "construccion", "plasterer": "construccion",
        "tiler": "construccion", "metal_construction": "construccion",
        "bakery": "panaderia", "confectionery": "panaderia",
        "hairdresser": "belleza_peluqueria",
        "shoemaker": "ropa_calzado",
        "electronics_repair": "tecnologia_celulares",
        "mechanic": "mecanica_motos", "car_repair": "mecanica_motos",
        "printer": "diseno_publicidad",
        "signmaker": "diseno_publicidad",
        "photographic_laboratory": "diseno_publicidad",
    },
    "amenity": {
        "restaurant": "comidas", "fast_food": "comidas", "cafe": "comidas",
        "food_court": "comidas", "ice_cream": "comidas",
        "pharmacy": "salud_bienestar", "clinic": "salud_bienestar",
        "doctors": "salud_bienestar", "dentist": "salud_bienestar",
        "hospital": "salud_bienestar",
        "veterinary": "mascotas", "animal_boarding": "mascotas",
        "car_repair": "mecanica_motos", "car_wash": "mecanica_motos",
    },
    "leisure": {"fitness_centre": "salud_bienestar"},
    # Solo lo trae 06_ampliacion_clases.py: las consultas del Valle no piden `office`.
    "office": {"advertising_agency": "diseno_publicidad", "graphic_design": "diseno_publicidad"},
}


def categoria_osm(fila) -> str:
    """Categoría del sitio para una fila con columnas shop/craft/amenity/...

    Devuelve "" si la etiqueta no calza con ninguna de las 12 (el local se
    conserva para las constelaciones, pero no entra al entrenamiento).
    `healthcare` sin otra etiqueta cuenta como salud; `barberia` solo sale de
    `hairdresser=barber`, que es el tag que OSM documenta para eso.
    """
    def v(k):
        x = fila.get(k, "")
        return x if isinstance(x, str) else ""

    if v("hairdresser") == "barber" or v("shop") == "barber":
        return "barberia"
    for clave in ("shop", "craft", "amenity", "leisure", "office"):
        cat = MAPEO_OSM[clave].get(v(clave))
        if cat:
            return cat
    if v("healthcare"):
        return "salud_bienestar"
    return ""


def ahora_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def cargar_poligono():
    """Polígono de Manrique en lon/lat (EPSG:4326)."""
    gj = json.loads(POLIGONO.read_text(encoding="utf-8"))
    return shape(gj["features"][0]["geometry"])


def cargar_barrios() -> tuple[list[tuple[str, object]], dict]:
    """Los 15 barrios oficiales (nombre en la grafía de BARRIOS_COMUNA_3, polígono) y su metadata.

    Los genera scripts/extraer-barrios.mjs; la fuente (Alcaldía de Medellín) viaja
    en la metadata para citarla tal cual.
    """
    gj = json.loads(BARRIOS.read_text(encoding="utf-8"))
    return [(f["properties"]["nombre"], shape(f["geometry"])) for f in gj["features"]], gj["metadata"]


def ultimo_csv(prefijo: str) -> Path:
    """CSV crudo más reciente (el nombre lleva la fecha, ordena lexicográfico)."""
    archivos = sorted(DATOS.glob(f"{prefijo}_*.csv"))
    if not archivos:
        raise SystemExit(f"No hay {prefijo}_*.csv en {DATOS}; corre 01_osm_overpass.py")
    return archivos[-1]
