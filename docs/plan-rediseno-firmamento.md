# Plan: rediseño de Firmamento «Ventana al cielo»

Aprobado por Luis el 3-oct-2026. Reemplaza la estética del primer Firmamento, que copió el
prototipo de la asesoría (azul de noche en todo, foto a la izquierda, mucho texto).

## Decisiones

1. **Dirección A · Ventana al cielo.** Regla de `DESIGN.md`: el día es para hacer cosas y la
   noche para leer datos. Login y paneles van en día (`hueso`/`tinta`, acentos de marca),
   con el `SiteHeader` de siempre (el enlace al espacio público sale gratis). La noche
   aparece solo como «ventana»: bandas de cifras, mapas, observatorio.
2. **Login = menú de roles.** Tres filas (✦ negocio · ● equipo · ■ entidad) que se despliegan
   en el lugar. Sin foto, sin beneficios, sin cifras.
3. **Panel sin barra lateral.** Pestañas arriba con indicador animado (`layoutId`), barra
   inferior en móvil. Bloques plegables (`<details>` + `AnimatePresence`) para ahorrar alto.
   El equipo pasa de 16 entradas a pestañas agrupadas con subpestañas.
4. **DM Mono solo en cifras grandes.** Fuentes y fechas en DM Sans pequeña; una sola línea de
   fuente por grupo de cifras con la misma fuente y fecha.
5. **Sin librerías nuevas.** Lo que ofrecen React Bits, Magic UI, bklit y Anime.js ya existe en
   el repo (`NumeroAnimado`, `ScrollReveal`, `CieloConstelaciones`, Leaflet). React Bits
   (MIT + Commons Clause) queda fuera por la cesión al ITM. Si se copia algún componente MIT,
   se cambia `motion/react` por `framer-motion` (no se instala `motion` 12).
   **Enmienda (Luis, Ola 2):** Anime.js v4 (MIT) entra SOLO para la Constelación viva
   (`components/firmamento/AnimadorConstelacion.tsx`), una coreografía de cinco fases sobre
   cientos de elementos SVG; se carga por módulos y bajo demanda. Ver DESIGN.md ›
   Movimiento y › Constelación viva.
6. **Sin duplicados:** una tarjeta (`Tarjeta`, con variante plegable), una cifra (`Kpi` +
   `GrupoCifras`), unas barras (`BarrasCategoria`), un mapa + lista.

## Brechas de la asesoría que entran

1. Moderación: el sugeridor en un clic («Usar X» / «Mantener») en cada registro pendiente y
   en las fichas en «Otros», guardando la decisión como ejemplo de reentrenamiento.
2. Mapa en Territorio y mapa de los 15 barrios coloreado (Leaflet + `barrios-manrique.json`;
   colorear por comercios OSM, que son públicos; la cobertura de aliados respeta k = 5).
3. Modelos: F1 por categoría y matriz de confusión (`pipeline/reporte_modelo.md`).
4. Estrellas OSM con su grupo de categoría (forma y color de `lib/categorias/grupos.ts`).
5. «Únete como aliado» en el tablero público.

## Olas

| Ola | Bloque | Modelo |
|---|---|---|
| 1 | **Base**: DESIGN.md, `Tarjeta`/`Kpi`/`GrupoCifras`, armazón del panel (pestañas), navegación, login menú | opus |
| 1 | **Moderación con sugeridor** | opus |
| 1 | **Visualización de datos**: `BarrasCategoria`, mapa + lista único, mapa de barrios, estrellas OSM por grupo, F1 y matriz, CTA | sonnet |
| 1 | **Documento del concurso** al día con lo que está en producción | sonnet (documentador) |
| 2 | Rediseño de los paneles negocio, equipo y entidad sobre la base | sonnet ×3 |
| 3 | QA visual y funcional | sonnet |

Base de prueba: rama de Neon `prueba-rediseno`. Nada se aplica a producción sin pasar por ahí.
