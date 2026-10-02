"""Vigía de convocatorias: revisa páginas de listado y manda lo nuevo a la plataforma.

Qué hace, en una línea: lee las páginas de `fuentes_convocatorias.json`, saca los
enlaces que parecen convocatorias abiertas y los envía a
`POST /api/ingesta/convocatorias`, donde entran SIEMPRE como `pendiente`. Una
persona (moderación) decide si se publica. El vigía no publica nada.

Solo biblioteca estándar de Python: el workflow no instala dependencias, así que
corre en segundos y no hay nada que se rompa por una versión.

Uso:
    python pipeline/04_vigia_convocatorias.py --seco        # imprime, no envía
    INGESTA_URL=https://<dominio>/api/ingesta/convocatorias \\
    INGESTA_SECRETO=... python pipeline/04_vigia_convocatorias.py

Buenas maneras con las páginas ajenas: se identifica con un User-Agent propio,
respeta robots.txt, pide una página por fuente y espera entre fuentes. Si una
fuente falla, las demás siguen; el código de salida es 1 solo si NO se pudo
enviar a la plataforma.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
import urllib.robotparser
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

FUENTES = Path(__file__).resolve().parent / "fuentes_convocatorias.json"
USER_AGENT = "ConstelacionesVigia/1.0 (+https://github.com/Luis-Vanegas/territorio-inn-2026-manrique)"
TIMEOUT = 30
ESPERA_ENTRE_FUENTES = 2  # segundos
MAX_POR_ENVIO = 50  # el endpoint rechaza más


class _Enlaces(HTMLParser):
    """Junta (texto, href) de cada <a>."""

    def __init__(self) -> None:
        super().__init__()
        self._href: str | None = None
        self._texto: list[str] = []
        self.enlaces: list[tuple[str, str]] = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self._href = dict(attrs).get("href")
            self._texto = []

    def handle_data(self, data):
        if self._href is not None:
            self._texto.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._href is not None:
            texto = " ".join(" ".join(self._texto).split())
            self.enlaces.append((texto, self._href))
            self._href = None


def _pedir(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.read()


def _decodificar(cuerpo: bytes) -> str:
    # Algunas páginas viejas del Estado salen en Windows-1252 sin declararlo.
    try:
        return cuerpo.decode("utf-8")
    except UnicodeDecodeError:
        return cuerpo.decode("cp1252", errors="replace")


def _permitido_por_robots(url: str) -> bool:
    p = urlparse(url)
    rp = urllib.robotparser.RobotFileParser()
    try:
        rp.parse(_decodificar(_pedir(f"{p.scheme}://{p.netloc}/robots.txt")).splitlines())
    except (urllib.error.URLError, TimeoutError, OSError):
        return True  # sin robots.txt legible no hay restricción declarada
    return rp.can_fetch(USER_AGENT, url)


def revisar_fuente(fuente: dict) -> list[dict]:
    """Devuelve las convocatorias candidatas de una fuente, sin duplicar por URL."""
    url = fuente["url"]
    if not _permitido_por_robots(url):
        print(f"  robots.txt no permite revisar {url}: se omite", file=sys.stderr)
        return []

    parser = _Enlaces()
    parser.feed(_decodificar(_pedir(url)))

    incluir = [re.compile(p, re.I) for p in fuente.get("incluir", [])]
    excluir = [re.compile(p, re.I) for p in fuente.get("excluir", [])]

    vistos: set[str] = set()
    salida = []
    for texto, href in parser.enlaces:
        if not (3 <= len(texto) <= 200):
            continue
        destino = urljoin(url, href)
        if urlparse(destino).scheme not in ("http", "https") or destino in vistos:
            continue
        if incluir and not any(p.search(texto) for p in incluir):
            continue
        if any(p.search(texto) for p in excluir):
            continue
        vistos.add(destino)
        salida.append(
            {
                "titulo": texto,
                "entidad": fuente["entidad"],
                "url": destino,
                "aplica_a": [],
            }
        )
    return salida


class _SinRedirecciones(urllib.request.HTTPRedirectHandler):
    """No seguir redirecciones al enviar: urllib reenvía el header Authorization
    a donde apunte el 3xx, y el secreto no debe viajar a otro host."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise urllib.error.HTTPError(req.full_url, code, f"redirección a {newurl} no permitida", headers, fp)


def enviar(url_api: str, secreto: str, fuente: str, items: list[dict]) -> dict:
    cuerpo = json.dumps({"fuente": fuente, "items": items}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url_api,
        data=cuerpo,
        method="POST",
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": f"Bearer {secreto}",
            "User-Agent": USER_AGENT,
        },
    )
    with urllib.request.build_opener(_SinRedirecciones).open(req, timeout=TIMEOUT) as r:
        return json.loads(r.read().decode("utf-8"))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--seco", action="store_true", help="imprime los candidatos y no envía nada")
    args = ap.parse_args()

    url_api = os.environ.get("INGESTA_URL", "")
    secreto = os.environ.get("INGESTA_SECRETO", "")
    if not args.seco and not (url_api and secreto):
        print("Faltan INGESTA_URL e INGESTA_SECRETO (o usa --seco).", file=sys.stderr)
        return 1
    if not args.seco and not url_api.startswith("https://"):
        # El Bearer viaja en claro por http: se rechaza antes de mandarlo.
        print("INGESTA_URL debe empezar con https://", file=sys.stderr)
        return 1

    fuentes = json.loads(FUENTES.read_text(encoding="utf-8"))["fuentes"]
    fallo_envio = False

    for i, fuente in enumerate(fuentes):
        if i:
            time.sleep(ESPERA_ENTRE_FUENTES)
        print(f"{fuente['nombre']}")
        try:
            items = revisar_fuente(fuente)[:MAX_POR_ENVIO]
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            print(f"  no se pudo leer: {e}", file=sys.stderr)
            continue

        print(f"  {len(items)} candidata(s)")
        if args.seco:
            for it in items:
                print(f"   - {it['titulo']}\n     {it['url']}")
            continue
        if not items:
            continue
        try:
            r = enviar(url_api, secreto, fuente["nombre"], items)
            print(f"  enviado: {r['nuevas']} nueva(s), {r['repetidas']} repetida(s), {r['vencidas']} vencida(s)")
        except urllib.error.HTTPError as e:
            # 503 = falta INGESTA_SECRETO en el servidor; 401 = el secreto no coincide.
            print(f"  la plataforma respondió {e.code}", file=sys.stderr)
            fallo_envio = True
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            print(f"  no se pudo enviar: {e}", file=sys.stderr)
            fallo_envio = True

    return 1 if fallo_envio else 0


if __name__ == "__main__":
    sys.exit(main())
