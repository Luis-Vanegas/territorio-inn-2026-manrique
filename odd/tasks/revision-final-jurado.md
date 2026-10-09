# Revisión final para el jurado (entrega 11-oct-2026)

Rama: `feat/revision-final-jurado` (desde `main` 31dbf6b).

## Objetivo

Que el sitio y los paneles se expliquen solos, se adapten a 320–375 px, el CRM
«Mis clientes» funcione sin trampas y la base quede bien estructurada. El jurado
entra como **Equipo con correo y contraseña** (decisión de Luis, 9-oct); la cuenta
la crea Luis con `npm run db:admin` (la contraseña no pasa por el agente).

## Evidencia de partida (9-oct)

- typecheck, lint y los 23 verificadores: PASS.
- Auditorías read-only: CRM + base, explicación + adaptativo (hallazgos en las tareas).

## Tareas

- [x] **T1 · Páginas que se explican solas** (delegada: 2+ archivos no triviales).
  `descripcion` por ítem en `lib/firmamento/navegacion.ts` + `TituloPanel`; textos
  de Resumen, moderación (sugeridor, historial, sub-pestañas cortas), vigía vacío sin
  instrucciones técnicas, modelos (F1, holdout, línea base, HDBSCAN), constelación
  definida en el inicio y la leyenda, jerga k = 5 / POT / bitácora, pestaña Equipo
  de la puerta con su línea.
- [x] **T2 · Adaptativo y consistencia de diseño** (delegada). `AprendizajeSugeridor`
  en una columna bajo 400 px, toques ≥ 44 px, tablas con `overflow-x-auto`,
  `GraficoSemanas` con tokens del tema, `Metrica` → `Kpi`, botones con
  `CLASE_BOTON_PANEL`, error de `FichaModeracion` sin azul, ancho de panel único.
- [x] **T3 · CRM «Mis clientes»** (delegada). Valores de vuelta en error, mensaje
  para errores de campos ocultos, cerrado ≠ atrasado, negocio archivado, borrar con
  estado y errores, WhatsApp solo con celular, fecha imposible, copy.
- [x] **T4 · Base: migración 038** (inline). Trigger que borra los clientes al
  cambiar el dueño (Ley 1581), índices de FK faltantes, índice duplicado, docs.
  **No se aplica en producción sin OK explícito de Luis.**
- [ ] **T5 · Verificación en navegador** a 1280 y 375 px y cierre.

## Checks

`npm run typecheck && npm run lint && npm run verificar` por tarea; navegador al final.

## Progreso

- T4 inline · `411f18c` · 038 probada en la rama de Neon `prueba-038` (trigger: editar otra columna conserva, cambiar dueño borra). NO aplicada en producción.
- T1+T2 delegada (diseno-ui) · `60b3496` · 44 archivos; `CifrasBarrio` sin jerga a mano.
- T3 delegada · `4e28740` · `esCelularColombiano` con casos en verificar-clientes; flag strip-types en package.json.
- T5 · typecheck + lint + 23 verificadores PASS en `4e28740`. Navegador a 375 px: inicio, aliados, nosotros,
  formalización, marca, contacto y puerta sin scroll horizontal. Paneles con sesión NO vistos en navegador
  (el agente no entra con contraseñas reales contra producción): pendiente que Luis los recorra.

## Siguiente paso

Luis: crear la cuenta del jurado (`npm run db:admin`), OK para aplicar 038 en producción (con respaldo),
recorrer los paneles y decidir merge/push.
