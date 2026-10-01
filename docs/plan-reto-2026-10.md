# Plan de alineación con el Reto #2 — Constelaciones · Manrique

> Fuente: asesoría del 1-oct-2026 (`ASESORIA_Constelaciones_Reto2_Comuna3_v2.docx`),
> audio de la asesora (WhatsApp, Diplomado Manrique) y revisión del repo hecha el mismo día.
> Entrega del concurso: **11 de octubre de 2026**. Este archivo lo lee el orquestador
> (sesión principal de Claude Code) y cada subagente de `.claude/agents/`.

## 0. El diagnóstico en una línea

La plataforma está sólida, pero **no muestra el trabajo de investigación** que hicimos con
los negocios ni entrega el **producto de datos + ML** que piden los términos (punto vi).
El jurado ve un directorio; tiene que ver un **sistema que lee el territorio**.

Lo que pidió la asesora en el audio, traducido a producto:

| Lo que dijo | Qué se construye |
|---|---|
| «La web no refleja la investigación de los negocios» | `/firmamento`: tablero público con resultados agregados (k ≥ 5) |
| «Constelaciones = agrupación de estrellas; agrupar los locales en el mapa» | Constelaciones reales (HDBSCAN) dibujadas en el mapa de Aliados |
| «El panel como filtro: cuántos hay, dónde, cómo llegar, oferta institucional» | Filtros por constelación/categoría/barrio + vigía de convocatorias + «Para ti» |
| «La web como pasarela de resultados» | Firmamento + «Tu negocio en números» + datos abiertos `/api/datos` |
| «Pensarlo económicamente (pautas)» | Solo en la sección 8 del documento, **condicionado** a la cesión de derechos al ITM (A4) |

## 1. Decisiones tomadas (no se reabren sin hablar con Luis)

- **Base de datos: se queda en Neon.** Migrar a Supabase no suma puntos en la rúbrica, cuesta
  días y rompe convenciones (SQL crudo, runner propio, sin RLS a propósito). Se anota como
  posible decisión del piloto, no del concurso.
- **Prioridad: reto primero, diseño después** (el diseño corre en paralelo solo donde no pisa).
- **Ningún dato sensible nuevo a los negocios.** Todo lo nuevo sale de datos abiertos o de
  contadores que ya existen. Celdas con < 5 negocios se publican como «<5».
- **No se entrena con nuestros 7 registros.** Se entrena con datos abiertos (OSM) y se aplica
  a los nuestros.
- **Cifras: solo con fuente.** Se usan las de la sección 6 de la asesoría; las que no tienen
  fuente (IMCV 39,97, 13.125 votos, 1.716.787, 16,2 % …) salen.

## 2. Hallazgos verificados en el repo (1-oct)

Confirmado en código, no supuesto:

- `lib/geo/constantes.ts` lista `Campo Valdés No. 1` (es de la Comuna 4) → A1 real.
- `ip_registro` en claro en `001_inicial.sql` y `005_peticiones.sql`; `011` sí usa `ip_hash` → A2 real.
- `definiciones_campo` no tiene marca `publico` (`003_campos_personalizados.sql`) → A2 real.
- **No existen** en el repo: migración 032, `/api/datos`, `/api/ingesta`, `lib/ml/`,
  `.github/workflows/`, carpeta `pipeline/`. La asesoría los describe (manual.html) pero el
  código no llegó: **hay que construirlos**.
- `Firmamento-Data.html` sí trae el **modelo entrenado incrustado** (TF-IDF char 2-4 + regresión
  logística, 12 clases, 4.000 n-gramas, umbral 0,45). Ya se extrajo a
  `Asesoria/extraido/modelo_categoria.json`. Sirve de **línea de comparación**, pero no es
  reproducible sin el código de entrenamiento → lo reentrenamos nosotros (F1 hay que medirlo
  de nuevo, no copiar el 0,63).
- Los 312 puntos del tablero están como círculos SVG **ya proyectados** (no lat/lon): no se
  reutilizan; se regeneran con Overpass.
- `git status` marca 222 archivos modificados, **todos por fin de línea (CRLF)**; con
  `--ignore-cr-at-eol` el diff queda vacío. Resolver antes de que los subagentes hagan commits.

## 3. Fases y responsables

Cada fase tiene un subagente dueño de un **conjunto de archivos que no se cruza** con el de los
demás. Trabajos en paralelo van en worktree (`isolation: worktree`) y entran por PR a `main`.

### Fase 0 · Higiene (orquestador, 1-oct)
- [ ] Crear `.gitattributes` (`* text=auto eol=lf`) y normalizar; commit aparte.
- [ ] Rama `reto/alineacion`.
- [ ] Copiar `Asesoria/extraido/modelo_categoria.json` a `pipeline/referencia/` (comparación).
- [ ] Guardar en engram las decisiones de la sección 1 (ver sección 6).

### Fase 1 · Datos y ML (`datos-ml`, 2–4 oct)
Archivos: `pipeline/**`, `public/firmamento/**`, `public/modelo_categoria.json`.
- [ ] `pipeline/01_osm_overpass.py`: comercios con nombre del Valle de Aburrá + los de la
      Comuna 3 dentro de `lib/geo/manrique.json`. Guarda CSV crudo con fecha.
- [ ] `pipeline/02_constelaciones.py`: HDBSCAN en metros (EPSG:3116 o UTM 18N),
      `min_cluster_size=6`, `min_samples=3`; centroides, radio, mezcla de categorías, árbol de
      expansión mínima por nodo → `public/firmamento/constelaciones.json`.
- [ ] `pipeline/03_clasificador.py`: mapeo etiqueta OSM → 12 categorías del sitio, TF-IDF
      char_wb 2-4 + LogisticRegression, split estratificado, F1 macro vs línea base,
      matriz de confusión → `public/modelo_categoria.json` + `pipeline/reporte_modelo.md`.
- [ ] `pipeline/README.md`: cómo reproducir, versiones, licencia ODbL, fecha de corrida.
- [ ] Validaciones que pide la rúbrica: duplicados, coordenadas fuera del polígono, nulos,
      trazabilidad (fuente + fecha en cada salida).

### Fase 2 · Backend e integración (`integrador`, 3–7 oct)
Archivos: `lib/db/migrations/032_*.sql`, `lib/db/datos.repo.ts`, `lib/db/convocatorias.repo.ts`,
`app/api/datos/`, `app/api/ingesta/`, `lib/ml/`, `lib/actions/` nuevas, `.github/workflows/`.
- [ ] Migración 032: `portafolios.barrio_oficial`, `portafolios.constelacion`,
      `definiciones_campo.publico boolean default false`, `sugerencias_categoria`,
      `convocatorias` (estado pendiente/aprobada/descartada/vencida, `aplica_a`),
      hash + purga de `ip_registro`.
- [ ] `lib/ml/categoria.ts`: inferencia en el navegador con `public/modelo_categoria.json`
      (≥ 45 % sugiere una; si no, top 3). Sin API ni costo.
- [ ] `GET /api/datos`: solo aprobados, agregados, k = 5, caché 1 h, rate limit compartido,
      CORS abierto. Búsquedas guardadas como categoría inferida, nunca el texto.
- [ ] Vigía: `pipeline/04_vigia_convocatorias.py` + workflow diario → `POST /api/ingesta/convocatorias`
      con secreto; todo entra `pendiente`. **Verificar** que Actions sea gratis para este repo
      público antes de prometerlo (CLAUDE.md dice que la cuenta tiene $0 en Actions).
- [ ] Corregir A1 (barrios: quitar Campo Valdés No. 1, agregar No. 2, citar fuente) y calcular
      `barrio_oficial` por punto-en-polígono.
- [ ] A2: vitrina publica solo campos `publico = true`.
- [ ] A3: nombrar proveedores de IA en la política y subir `VERSION_TERMINOS`.
- [ ] Verificadores nuevos: `verificar-datos-k.mjs` (ninguna celda < 5 sale con número),
      `verificar-sugeridor.mjs` (casos fijos de nombres).

### Fase 3 · Producto visible (`diseno-ui`, 5–9 oct)
Detalle completo, hallazgos y criterios de aceptación: `docs/plan-diseno-2026-10.md`.
Archivos: `app/(site)/firmamento/**`, componentes nuevos en `components/firmamento/`,
ajustes en Aliados, Mi cuenta, Formalización, Hero.
- [ ] `/firmamento`: portar el tablero de la asesoría al design system (modo noche de
      `manual.html`: Fraunces + DM Sans, tokens noche en `tailwind.config.ts`), leyendo
      `/api/datos` y `constelaciones.json`. Agregar la sección a `DESIGN.md` primero.
- [ ] Mapa de Aliados: capa de constelaciones (líneas + halo), filtro por constelación.
- [ ] Registro: sugeridor de categoría con botón «Usar esta».
- [ ] Ficha: «Otros negocios de tu constelación».
- [ ] Mi cuenta: «Para ti» (convocatorias aprobadas que aplican) y «Tu negocio en números».
- [ ] Animaciones con `framer-motion` (ya instalado): entrada de estrellas, trazado de
      líneas, contadores; todo con `prefers-reduced-motion`. Resolver el pendiente del
      titular en `opacity: 0` (DESIGN.md › Movimiento).
- [ ] Accesibilidad: contraste 4,5:1 en noche, paleta segura para daltonismo, foco visible,
      objetivos táctiles ≥ 44 px, revisión en 320 px.
- Skills a usar: `design:design-critique`, `design:accessibility-review`, `dataviz`,
  `design:ux-copy` (textos en «tú», sin voseo).

### Fase 4 · Documento y video (`documentador`, 7–10 oct)
Archivos: `docs/concurso/**` (no toca código).
- [ ] Llenar 4.2, 4.3, 5, 6, 7, 8, resumen ejecutivo y 5–6 palabras clave con las preguntas
      de la sección 4 de la asesoría.
- [ ] Rehacer el árbol de problema (un problema central, causas izq., efectos der., sin cifras).
- [ ] Reemplazar cifras sin fuente; referencias en APA sin `utm_source`.
- [ ] Versión de 3–5 hojas (Arial 12, interlineado 1,5); datos personales los completan ustedes.
- [ ] Guion del video (≤ 3 min) mostrando mapa estelar y sugeridor funcionando.
- [ ] Preguntar al ITM por la cesión de derechos (A4) antes de hablar de pautas.

### Fase 5 · QA (`qa-verificador`, 10 oct, y antes de cada merge)
- [ ] `npm run typecheck && npm run lint && npm run verificar` limpio.
- [ ] Recorrido a mano en producción: registro → moderación → vitrina → Firmamento.
- [ ] Revisar que `/api/datos` no filtre nada personal (pruebas con celdas pequeñas).

## 4. Calendario

| Fecha | Hito |
|---|---|
| 1 oct | Fase 0 |
| 2–4 oct | Pipeline + modelos reproducibles |
| 3–7 oct | Migración 032, API, sugeridor, vigía, fixes A1–A3 |
| 5–9 oct | Firmamento, mapa de constelaciones, Mi cuenta, animaciones |
| 7–10 oct | Documento completo + versión 3–5 hojas + video |
| 10 oct | QA final y despliegue |
| 11 oct | Entrega |

## 5. Cómo orquestar los subagentes

1. El orquestador lee este archivo, `TASKS.md`, `AGENTS.md` y `DESIGN.md`.
2. Lanza `datos-ml` y `documentador` en paralelo (no comparten archivos).
3. Cuando `datos-ml` entrega `public/modelo_categoria.json` y `constelaciones.json`,
   lanza `integrador`. `diseno-ui` arranca con Firmamento sobre JSON fijos y cambia a
   `/api/datos` cuando exista.
4. Antes de cada merge, `qa-verificador`.
5. Al cerrar cada fase: actualizar `TASKS.md` y guardar en engram.

## 6. Qué guardar en engram

Al cerrar cada fase, `mem_save` con: decisión tomada, por qué, archivos tocados y
lo que quedó pendiente. Mínimo:
- Decisión Neon vs Supabase y motivo.
- Regla k = 5 y lista de campos que nunca salen en `/api/datos`.
- Métricas reales del clasificador y de HDBSCAN (con fecha de corrida).
- Cifras con fuente que van en el documento.
