"""Vigía de convocatorias: revisa páginas de listado y manda lo nuevo a la plataforma.

Qué hace, en una línea: lee las páginas de `fuentes_convocatorias.json`, saca los
enlaces que parecen convocatorias abiertas y los envía a
`POST /api/ingesta/convocatorias`, donde entran SIEMPRE como `pendiente`. Una
persona (moderación) decide si se publica. El vigía no publica nada.

Al final de cada corrida manda UN informe a `POST /api/ingesta/vigia`: por fuente,
si respondió, el código HTTP, la huella de su contenido, cuántas candidatas y cuántas
nuevas trajo. Así se sabe si una fuente murió o cambió sin abrir los logs. El
runner de Actions nace limpio cada día, así que el vigía no guarda estado: manda la
huella y el servidor la compara con la anterior.

Solo biblioteca estándar de Python: el workflow no instala dependencias, así que
corre en segundos y no hay nada que se rompa por una versión.

Uso:
    python pipeline/04_vigia_convocatorias.py --seco        # imprime, no envía
    INGESTA_URL=https://<dominio>/api/ingesta/convocatorias \\
    INGESTA_SECRETO=... python pipeline/04_vigia_convocatorias.py
    # el informe va a INGESTA_VIGIA_URL; sin ella, a INGESTA_URL cambiando
    # «/convocatorias» por «/vigia»

Buenas maneras con las páginas ajenas: se identifica con un User-Agent propio,
respeta robots.txt, pide una página por fuente y espera entre fuentes. Si una
fuente falla, las demás siguen; el código de salida es 1 solo si NO se pudo
enviar a la plataforma.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import socket
import sys
import time
import urllib.error
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone
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


def _pedir(url: str) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.status, r.read()


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
        rp.parse(_decodificar(_pedir(f"{p.scheme}://{p.netloc}/robots.txt")[1]).splitlines())
    except (urllib.error.URLError, TimeoutError, OSError):
        return True  # sin robots.txt legible no hay restricción declarada
    return rp.can_fetch(USER_AGENT, url)


def _es_timeout(e: BaseException) -> bool:
    if isinstance(e, (TimeoutError, socket.timeout)):
        return True
    return isinstance(e, urllib.error.URLError) and isinstance(e.reason, (TimeoutError, socket.timeout))


def _error_corto(e: BaseException) -> str:
    """Una frase corta en español «tú» para el panel del equipo (la base la limita a
    200 caracteres). El detalle técnico no se guarda: ya sale por stderr en el log."""
    if _es_timeout(e):
        return "No respondió a tiempo"
    if isinstance(e, urllib.error.HTTPError):
        c = e.code
        if c in (404, 410):
            return f"La página no existe ({c})"
        if c >= 500:
            return f"El servidor falló ({c})"
        if c in (401, 403):
            return f"La página no permite el acceso ({c})"
        return f"La página respondió con error ({c})"
    return "No se pudo conectar"


def revisar_fuente(fuente: dict) -> dict:
    """Revisa una fuente y devuelve su resultado, sin lanzar por fallos de red.

    `items` son las candidatas (sin duplicar por URL) y `informe` lo que va al
    informe de corrida. La huella es el sha256 de TODOS los enlaces de la página
    (texto + destino, ordenados): el HTML crudo trae tokens que cambian solos y
    daría «cambió» todos los días.
    """
    url = fuente["url"]
    informe = {
        "id": fuente["id"],
        "entidad": fuente["entidad"],
        "url": url,
        "estado": "responde",
        "http_status": None,
        "huella": None,
        "candidatas": 0,
        "nuevas": 0,
        "error": None,
    }
    resultado: dict = {"items": [], "informe": informe}

    if not _permitido_por_robots(url):
        print(f"  robots.txt no permite revisar {url}: se omite", file=sys.stderr)
        informe.update(estado="bloqueada_robots", error="Su robots.txt no permite revisarla")
        return resultado

    try:
        status, cuerpo = _pedir(url)
    except urllib.error.HTTPError as e:
        print(f"  no se pudo leer: HTTP {e.code}", file=sys.stderr)
        informe.update(estado="error_http", http_status=e.code, error=_error_corto(e))
        return resultado
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        print(f"  no se pudo leer: {e}", file=sys.stderr)
        informe.update(estado="timeout" if _es_timeout(e) else "error_http", error=_error_corto(e))
        return resultado

    parser = _Enlaces()
    parser.feed(_decodificar(cuerpo))
    informe["http_status"] = status

    todos = sorted({f"{t}\t{urljoin(url, h)}" for t, h in parser.enlaces if h})
    informe["huella"] = hashlib.sha256("\n".join(todos).encode("utf-8")).hexdigest()

    incluir = [re.compile(p, re.I) for p in fuente.get("incluir", [])]
    excluir = [re.compile(p, re.I) for p in fuente.get("excluir", [])]

    vistos: set[str] = set()
    salida: list[dict] = resultado["items"]
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
                # A quién aplica (categorías, formalidad) lo decide el moderador al
                # aprobar (migración 033); `entidad` se resuelve por nombre en la ingesta.
            }
        )
    informe["candidatas"] = len(salida[:MAX_POR_ENVIO])
    return resultado


class _SinRedirecciones(urllib.request.HTTPRedirectHandler):
    """No seguir redirecciones al enviar: urllib reenvía el header Authorization
    a donde apunte el 3xx, y el secreto no debe viajar a otro host."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise urllib.error.HTTPError(req.full_url, code, f"redirección a {newurl} no permitida", headers, fp)


def _post(url_api: str, secreto: str, cuerpo: dict) -> dict:
    datos = json.dumps(cuerpo, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url_api,
        data=datos,
        method="POST",
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": f"Bearer {secreto}",
            "User-Agent": USER_AGENT,
        },
    )
    with urllib.request.build_opener(_SinRedirecciones).open(req, timeout=TIMEOUT) as r:
        return json.loads(r.read().decode("utf-8"))


def enviar(url_api: str, secreto: str, fuente: str, items: list[dict]) -> dict:
    return _post(url_api, secreto, {"fuente": fuente, "items": items})


def url_del_informe(url_api: str) -> str:
    explicita = os.environ.get("INGESTA_VIGIA_URL", "")
    if explicita:
        return explicita
    return re.sub(r"/convocatorias/?$", "/vigia", url_api)


def _ahora() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--seco", action="store_true", help="imprime los candidatos y no envía nada")
    ap.add_argument("--fuentes", type=Path, default=FUENTES, help="otro JSON de fuentes (para probar fallos); por defecto el del repo")
    args = ap.parse_args()

    url_api = os.environ.get("INGESTA_URL", "")
    secreto = os.environ.get("INGESTA_SECRETO", "")
    if not args.seco and not (url_api and secreto):
        print("Faltan INGESTA_URL e INGESTA_SECRETO (o usa --seco).", file=sys.stderr)
        return 1
    # El Bearer viaja en claro por http: se rechaza antes de mandarlo. Salvo un
    # servidor de desarrollo en esta misma máquina (localhost), donde no sale a la red.
    destino = urlparse(url_api)
    local = destino.scheme == "http" and destino.hostname in ("localhost", "127.0.0.1")
    if not args.seco and not (url_api.startswith("https://") or local):
        print("INGESTA_URL debe empezar con https://", file=sys.stderr)
        return 1

    fuentes = json.loads(args.fuentes.read_text(encoding="utf-8"))["fuentes"]
    fallo_envio = False
    iniciada = _ahora()
    informes = []

    for i, fuente in enumerate(fuentes):
        if i:
            time.sleep(ESPERA_ENTRE_FUENTES)
        print(f"{fuente['nombre']}")
        r = revisar_fuente(fuente)
        items = r["items"][:MAX_POR_ENVIO]
        informes.append(r["informe"])

        print(f"  {r['informe']['estado']} · {len(items)} candidata(s)")
        if args.seco:
            for it in items:
                print(f"   - {it['titulo']}\n     {it['url']}")
            continue
        if not items:
            continue
        try:
            resp = enviar(url_api, secreto, fuente["nombre"], items)
            r["informe"]["nuevas"] = resp["nuevas"]
            print(f"  enviado: {resp['nuevas']} nueva(s), {resp['repetidas']} repetida(s), {resp['vencidas']} vencida(s)")
        except urllib.error.HTTPError as e:
            # 503 = falta INGESTA_SECRETO en el servidor; 401 = el secreto no coincide.
            print(f"  la plataforma respondió {e.code}", file=sys.stderr)
            fallo_envio = True
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            print(f"  no se pudo enviar: {e}", file=sys.stderr)
            fallo_envio = True

    print("Informe: " + ", ".join(f"{x['id']}={x['estado']}" for x in informes))
    if args.seco:
        return 0

    informe = {
        "origen": "actions" if os.environ.get("GITHUB_ACTIONS") == "true" else "manual",
        "iniciada_en": iniciada,
        "terminada_en": _ahora(),
        "fuentes": informes,
    }
    try:
        resp = _post(url_del_informe(url_api), secreto, informe)
        print(f"Informe de corrida guardado: {resp['respondieron']}/{resp['fuentes']} respondieron, {resp['nuevas']} nueva(s)")
    except urllib.error.HTTPError as e:
        print(f"el informe de corrida fue rechazado ({e.code})", file=sys.stderr)
        fallo_envio = True
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        print(f"no se pudo enviar el informe de corrida: {e}", file=sys.stderr)
        fallo_envio = True

    return 1 if fallo_envio else 0


if __name__ == "__main__":
    sys.exit(main())
