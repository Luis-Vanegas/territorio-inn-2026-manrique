"""Paso 3 · Clasificador de categoría a partir del nombre del negocio.

Entrena con los comercios de OSM del Valle de Aburrá (paso 1), cuya etiqueta sale
de los tags de OSM mapeados a las 12 categorías del sitio. NO se entrena con los
registros propios del sitio (son 7): el modelo se aplica a ellos, no aprende de ellos.

Salidas:
  public/modelo_categoria.json   pesos para inferir en el navegador (sin API ni servidor)
  pipeline/reporte_modelo.md     métricas medidas, línea base y matriz de confusión

Rigor de la evaluación (por qué no basta un train_test_split):
- Los nombres se repiten (cadenas: "Farmacia Cruz Verde", "D1", "Ara"). Con un
  split al azar el mismo nombre cae en train y en test y el F1 se infla. El
  holdout agrupa por nombre normalizado, así que en test solo hay nombres que el
  modelo nunca vio. Se reporta también el split ingenuo, para que se vea la diferencia.
- Se mide además en la Comuna 3 con el modelo entrenado SIN ningún local de la
  Comuna 3 (holdout geográfico): es lo más parecido a usarlo en un barrio nuevo.
- El modelo de referencia (pipeline/referencia/) se evalúa sobre el mismo holdout.
  Ojo: su entrenamiento fue sobre una descarga del mismo día de OSM, así que
  probablemente vio parte de estos nombres; su número está sesgado a su favor.
"""
from __future__ import annotations

import json

import numpy as np
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_recall_fscore_support,
)
from sklearn.model_selection import StratifiedGroupKFold, train_test_split

from comun import (
    CATEGORIAS,
    DATOS,
    FUENTE,
    PUBLICO,
    RAIZ,
    SEMILLA,
    ahora_iso,
    ultimo_csv,
)

CLASES = list(CATEGORIAS)
UMBRAL_CONFIANZA = 0.45  # mismo umbral del plan: por debajo se muestran las 3 mejores
MAX_NGRAMAS = 4000       # tamaño del JSON que viaja al navegador (~0,4 MB)
MIN_DF = 3               # un n-grama visto en 1-2 negocios es memoria, no señal
GRILLA_C = [0.5, 1, 3, 10, 30]
REFERENCIA = RAIZ / "pipeline" / "referencia" / "modelo_categoria.json"


def normalizar_grupo(nombre: str) -> str:
    """Clave para agrupar el mismo negocio/cadena escrito con pequeñas variantes."""
    import unicodedata

    s = unicodedata.normalize("NFKD", nombre.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return " ".join("".join(c if c.isalnum() else " " for c in s).split())


def vectorizador() -> TfidfVectorizer:
    # strip_accents + lowercase: el JS replica esto con normalize('NFD') y quitando
    # marcas combinantes; así "Panadería" y "panaderia" son el mismo texto.
    return TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(2, 4),
        lowercase=True,
        strip_accents="unicode",
        min_df=MIN_DF,
        max_features=MAX_NGRAMAS,
    )


def modelo(c: float) -> LogisticRegression:
    # class_weight="balanced": barbería tiene ~10 ejemplos y comidas ~1.600;
    # sin él el F1 macro lo hunde la clase pequeña.
    return LogisticRegression(
        C=c, max_iter=2000, class_weight="balanced", random_state=SEMILLA
    )


def entrenar(textos_tr, y_tr, c):
    vec = vectorizador()
    X = vec.fit_transform(textos_tr)
    clf = modelo(c).fit(X, y_tr)
    return vec, clf


def predecir(vec, clf, textos):
    P = clf.predict_proba(vec.transform(textos))
    return clf.classes_[P.argmax(axis=1)], P


def f1m(y, p):
    return float(f1_score(y, p, labels=CLASES, average="macro", zero_division=0))


def elegir_c(textos, y, grupos) -> tuple[float, dict]:
    """Elige C por validación cruzada SOLO sobre el conjunto de entrenamiento."""
    cv = StratifiedGroupKFold(n_splits=4, shuffle=True, random_state=SEMILLA)
    resultados = {}
    for c in GRILLA_C:
        puntajes = []
        for tr, va in cv.split(textos, y, grupos):
            vec, clf = entrenar(textos[tr], y[tr], c)
            p, _ = predecir(vec, clf, textos[va])
            puntajes.append(f1m(y[va], p))
        resultados[c] = float(np.mean(puntajes))
    mejor = max(resultados, key=resultados.get)
    return mejor, resultados


def evaluar_referencia(textos, y):
    """Aplica el modelo de referencia (otro entrenamiento) a un conjunto dado."""
    ref = json.loads(REFERENCIA.read_text(encoding="utf-8"))
    cv = CountVectorizer(
        analyzer="char_wb", ngram_range=(2, 4), lowercase=True,
        strip_accents="unicode", vocabulary=ref["vocab"],
    )
    X = cv.transform(textos).astype(float).toarray() * np.array(ref["idf"])
    norma = np.linalg.norm(X, axis=1, keepdims=True)
    X = X / np.where(norma == 0, 1, norma)
    logits = X @ np.array(ref["coef"]).T + np.array(ref["intercepto"])
    logits -= logits.max(axis=1, keepdims=True)
    P = np.exp(logits)
    P /= P.sum(axis=1, keepdims=True)
    pred = np.array(ref["clases"])[P.argmax(axis=1)]
    return pred, P, ref


def tabla_md(cabeza, filas):
    out = ["| " + " | ".join(cabeza) + " |", "|" + "|".join("---" for _ in cabeza) + "|"]
    out += ["| " + " | ".join(str(x) for x in f) + " |" for f in filas]
    return "\n".join(out)


def matriz_md(y, p):
    m = confusion_matrix(y, p, labels=CLASES)
    return tabla_md(["real \\ predicho"] + CLASES, [[c] + list(map(int, fila)) for c, fila in zip(CLASES, m)])


def por_clase_md(y, p):
    pr, rc, f1, sop = precision_recall_fscore_support(y, p, labels=CLASES, zero_division=0)
    return tabla_md(
        ["categoría", "precisión", "recall", "F1", "soporte"],
        [[c, f"{a:.3f}", f"{b:.3f}", f"{d:.3f}", int(s)] for c, a, b, d, s in zip(CLASES, pr, rc, f1, sop)],
    )


def main() -> None:
    entrada = ultimo_csv("osm_valle_aburra")
    comuna = ultimo_csv("osm_comuna3")
    df = pd.read_csv(entrada, keep_default_na=False)
    df = df[df["categoria"] != ""].reset_index(drop=True)
    textos = df["nombre"].to_numpy()
    y = df["categoria"].to_numpy()
    grupos = df["nombre"].map(normalizar_grupo).to_numpy()
    n_grupos = len(set(grupos))
    ids_comuna = set(pd.read_csv(comuna, keep_default_na=False)["osm_id"])

    # --- Validaciones del conjunto de entrenamiento ------------------------
    assert not pd.isna(df["nombre"]).any() and (df["nombre"].str.len() > 0).all()
    assert set(y) <= set(CLASES), f"categorías desconocidas: {set(y) - set(CLASES)}"
    assert not df.duplicated(subset=["osm_tipo", "osm_id"]).any()

    # --- Holdout agrupado y estratificado (80/20) --------------------------
    sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEMILLA)
    tr, te = next(sgkf.split(textos, y, grupos))
    c_mejor, cv_c = elegir_c(textos[tr], y[tr], grupos[tr])
    vec, clf = entrenar(textos[tr], y[tr], c_mejor)
    pred, P = predecir(vec, clf, textos[te])

    f1_modelo = f1m(y[te], pred)
    acc_modelo = float(accuracy_score(y[te], pred))
    seguro = P.max(axis=1) >= UMBRAL_CONFIANZA
    cobertura = float(seguro.mean())
    acc_seguro = float(accuracy_score(y[te][seguro], pred[seguro])) if seguro.any() else float("nan")
    top3 = float(np.mean([y[te][i] in clf.classes_[np.argsort(-P[i])[:3]] for i in range(len(te))]))

    # --- Líneas base --------------------------------------------------------
    base = {}
    for nombre, estrategia in (("clase mayoritaria", "most_frequent"), ("azar según frecuencias", "stratified")):
        d = DummyClassifier(strategy=estrategia, random_state=SEMILLA).fit(textos[tr], y[tr])
        pb = d.predict(textos[te])
        base[nombre] = (f1m(y[te], pb), float(accuracy_score(y[te], pb)))

    # --- Referencia sobre el mismo holdout ---------------------------------
    pred_ref, _, ref = evaluar_referencia(textos[te], y[te])
    f1_ref, acc_ref = f1m(y[te], pred_ref), float(accuracy_score(y[te], pred_ref))

    # --- Split ingenuo (solo para mostrar el sesgo de las cadenas) ---------
    tr_n, te_n = train_test_split(np.arange(len(df)), test_size=0.2, stratify=y, random_state=SEMILLA)
    v_n, c_n = entrenar(textos[tr_n], y[tr_n], c_mejor)
    f1_ingenuo = f1m(y[te_n], predecir(v_n, c_n, textos[te_n])[0])

    # --- Holdout geográfico: entrena sin Comuna 3, prueba en Comuna 3 ------
    es_comuna = df["osm_id"].isin(ids_comuna).to_numpy()
    nombres_comuna = set(grupos[es_comuna])
    # También se sacan del entrenamiento los nombres iguales (cadenas) de la comuna.
    train_geo = ~es_comuna & ~np.isin(grupos, list(nombres_comuna))
    v_g, c_g = entrenar(textos[train_geo], y[train_geo], c_mejor)
    pred_g = predecir(v_g, c_g, textos[es_comuna])[0]
    f1_geo = f1m(y[es_comuna], pred_g)
    acc_geo = float(accuracy_score(y[es_comuna], pred_g))
    pred_ref_g = evaluar_referencia(textos[es_comuna], y[es_comuna])[0]
    f1_ref_geo = f1m(y[es_comuna], pred_ref_g)

    # --- Modelo final: se re-entrena con TODO y se exporta -----------------
    # Las métricas de arriba son de un modelo entrenado sin el holdout; el que
    # se publica ve los datos completos (más datos, mismo C). No se evalúa a sí mismo.
    vec_f, clf_f = entrenar(textos, y, c_mejor)
    orden = [list(clf_f.classes_).index(c) for c in CLASES]  # mismo orden que CATEGORIAS
    vocab = [t for t, _ in sorted(vec_f.vocabulary_.items(), key=lambda kv: kv[1])]
    fecha = ahora_iso()
    metricas = {
        "f1_macro_holdout": round(f1_modelo, 4),
        "accuracy_holdout": round(acc_modelo, 4),
        "f1_macro_linea_base_mayoritaria": round(base["clase mayoritaria"][0], 4),
        "f1_macro_holdout_geografico_comuna3": round(f1_geo, 4),
        "n_holdout": int(len(te)),
        "n_holdout_geografico": int(es_comuna.sum()),
    }
    salida = {
        "tipo": "tfidf_char_wb_2_4+logreg",
        "version": fecha[:10],
        "clases": CLASES,
        "nombres": [CATEGORIAS[c] for c in CLASES],
        "preprocesado": (
            "minúsculas, quitar tildes (NFD y borrar marcas combinantes), colapsar "
            "espacios; por palabra: ' '+palabra+' ' y n-gramas de 2 a 4 caracteres"
        ),
        "tf": "conteo crudo; luego x*idf y normalización L2",
        "vocab": vocab,
        "idf": [round(float(v), 4) for v in vec_f.idf_],
        "coef": [[round(float(w), 4) for w in clf_f.coef_[i]] for i in orden],
        "intercepto": [round(float(clf_f.intercept_[i]), 4) for i in orden],
        "salida": "softmax(coef·x + intercepto); sugerir la mejor si prob >= umbral_confianza, si no mostrar las 3 mejores",
        "umbral_confianza": UMBRAL_CONFIANZA,
        "hiperparametros": {"C": c_mejor, "class_weight": "balanced", "min_df": MIN_DF, "max_features": MAX_NGRAMAS},
        "entrenado_con": int(len(df)),
        "fuente": f"{FUENTE}, Valle de Aburrá, datos {entrada.name}",
        "licencia": "ODbL 1.0 — los pesos derivan de nombres de OpenStreetMap",
        "fecha_corrida": fecha,
        "semilla": SEMILLA,
        "metricas": metricas,
    }
    destino = PUBLICO / "modelo_categoria.json"
    destino.write_text(json.dumps(salida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    # --- Reporte ------------------------------------------------------------
    dist = df["categoria"].value_counts()
    sin_mapa = int(len(pd.read_csv(entrada, keep_default_na=False)) - len(df))
    texto = f"""# Reporte del clasificador de categoría

Fecha de corrida: {fecha} · semilla {SEMILLA} · generado por `pipeline/03_clasificador.py`.
Datos: `{entrada.name}` (fuente: {FUENTE}). Etiqueta = tag de OSM mapeado a una de las
12 categorías del sitio (`pipeline/comun.py › MAPEO_OSM`), no el nombre del local.

## Resultado principal

Holdout estratificado y **agrupado por nombre** (20 %, {len(te)} locales, ningún nombre visto en entrenamiento).
C elegido por validación cruzada interna: **{c_mejor}**.

| Modelo | F1 macro | Exactitud |
|---|---|---|
| **TF-IDF char_wb 2-4 + LogReg (este pipeline)** | **{f1_modelo:.3f}** | {acc_modelo:.3f} |
| Línea base: clase mayoritaria | {base['clase mayoritaria'][0]:.3f} | {base['clase mayoritaria'][1]:.3f} |
| Línea base: azar según frecuencias | {base['azar según frecuencias'][0]:.3f} | {base['azar según frecuencias'][1]:.3f} |
| Referencia (`pipeline/referencia/`, ver advertencia) | {f1_ref:.3f} | {acc_ref:.3f} |

- Con umbral {UMBRAL_CONFIANZA}: el modelo sugiere una sola categoría en el **{cobertura:.1%}** de los casos
  y acierta el **{acc_seguro:.1%}** de ellos; en el resto muestra 3 opciones.
- La categoría correcta está entre las 3 primeras en el **{top3:.1%}** del holdout.
- Split ingenuo (al azar, sin agrupar por nombre): F1 macro {f1_ingenuo:.3f}. Es la cifra inflada por
  cadenas repetidas; **no es la que se debe citar**.

Selección de C (F1 macro medio, validación cruzada de 4 pliegues agrupada, solo sobre entrenamiento):
{', '.join(f'C={k}: {v:.3f}' for k, v in cv_c.items())}.

### Advertencia sobre la referencia

El modelo de referencia declara haberse entrenado con {ref['entrenado_con']} locales de una descarga de OSM del
Valle de Aburrá del 2026-10-01 17:17. Esta corrida usa otra descarga ({entrada.name}); se desconoce con qué mapeo
de etiquetas se entrenó la referencia y qué nombres vio: su F1 sobre este holdout probablemente
está **sesgado a su favor** y la comparación no es un duelo limpio. Su código de entrenamiento no es
reproducible, por eso no se cita su F1 original.

## Holdout geográfico (Comuna 3)

Entrenado **sin** ningún local de la Comuna 3 (ni nombres repetidos de ahí) y probado en sus
{int(es_comuna.sum())} locales con categoría mapeada: F1 macro **{f1_geo:.3f}**, exactitud {acc_geo:.3f}.
Referencia sobre los mismos locales: F1 macro {f1_ref_geo:.3f}. Con tan pocas filas (varias clases con 2-8
ejemplos) el F1 macro tiene mucha varianza; tómalo como orden de magnitud, no como cifra fina.

## Detalle por categoría (holdout agrupado)

{por_clase_md(y[te], pred)}

## Matriz de confusión (holdout agrupado; filas = real, columnas = predicho)

{matriz_md(y[te], pred)}

## Datos de entrenamiento

- Locales con nombre en el Valle de Aburrá: {len(df) + sin_mapa}; con categoría mapeada (usados): **{len(df)}**
  ({n_grupos} nombres distintos); sin categoría mapeada (descartados): {sin_mapa}.
- Distribución: {', '.join(f'{k} {v}' for k, v in dist.items())}.
- Categorías del sitio que el modelo NO cubre (sin etiqueta OSM fiable): modistería, reparación de
  electrodomésticos, transporte y domicilios, educación y cuidado infantil, fotografía y eventos,
  lavandería, reciclaje, otros.

## Limitaciones conocidas (medidas o por medir)

- Etiquetas "débiles": OSM puede estar mal etiquetado; no hay verificación manual de una muestra (**pendiente**).
- `barberia` tiene muy pocos ejemplos ({int(dist.get('barberia', 0))}); su F1 es poco fiable.
- No se ha medido contra los registros reales del sitio (hay 7, insuficiente para una métrica) (**pendiente**).
- El modelo publicado (`public/modelo_categoria.json`, {destino.stat().st_size / 1024:.0f} KB) se re-entrena
  con todos los datos tras evaluar; las métricas de arriba son del modelo entrenado sin el holdout.
"""
    (RAIZ / "pipeline" / "reporte_modelo.md").write_text(texto, encoding="utf-8")
    print(json.dumps(metricas, ensure_ascii=False, indent=2))
    print(f"referencia: f1={f1_ref:.4f} acc={acc_ref:.4f} | geo ref f1={f1_ref_geo:.4f} | ingenuo f1={f1_ingenuo:.4f}")
    print(f"cobertura={cobertura:.3f} acc_seguro={acc_seguro:.3f} top3={top3:.3f} C={c_mejor} cv={cv_c}")
    print(f"{destino} ({destino.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
