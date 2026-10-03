# Plan: Firmamento (login por rol y paneles) + base reorganizada

Aprobado por Luis el 2-oct-2026. Diseño: `docs/firmamento-modulos.md` (rutas y roles) y
`docs/base-de-datos.md` (datos, migración 033). Rama base: `reto/alineacion`.
Base de prueba: rama de Neon `prueba-033-firmamento` (`br-falling-tooth-ayx4yncn`). Nada se
aplica a producción sin pasar por ahí.

## Ola 1 (en paralelo, cada una en su worktree)

| Bloque | Qué | Agente · modelo | Por qué ese modelo |
|---|---|---|---|
| **A · Datos** | Migración 033 + seed; repos/schemas/acciones de convocatorias, ingesta, «Para ti», `/formalizacion` y panel; `barrio_oficial` y `bitacora` en registro y ediciones; `portafolio_id` en sugerencias; script de relleno de `barrio_oficial`; repos de `entidades`/`miembros_entidad`/`bitacora`. Aplicar y probar en la rama de Neon. | `integrador` · **opus** | Toca el esquema, borra columnas y cruza muchos módulos: un error rompe producción |
| **B · Puerta** | `app/(firmamento)/firmamento/entrar` (3 pestañas, como `01_entrar.png`), layout del panel (barra lateral, barra inferior móvil, tarjeta «La cara de la red»), guardas de sesión por rol, sesión de entidad (Google + membresía, con un stub hasta que llegue A) | `diseno-ui` · **sonnet** | UI con reglas claras (DESIGN.md + prototipo); no toca datos |

## Ola 2 (después de integrar A y B)

| Bloque | Qué | Agente · modelo |
|---|---|---|
| **C · Panel negocio** | Inicio (números, ficha al %), Mi ficha (edición directa + sugeridor), Para ti, Mi constelación. `/mi-cuenta` redirige | `diseno-ui` · sonnet |
| **D · Panel equipo** | Mover `/admin` a `/firmamento/equipo`; Resumen, alertas de calidad al vuelo, historial (bitácora), Territorio, Datos abiertos, Modelos; alta de entidades y miembros | `diseno-ui` · sonnet |
| **E · Panel entidad** | Observatorio (k = 5), convocatorias aprobadas + proponer, datos abiertos | `diseno-ui` · sonnet |

C, D y E van en paralelo: cada uno vive en su carpeta.

## Ola 3

- **QA** (`qa-verificador` · sonnet): typecheck, lint, `npm run verificar`, privacidad (la entidad
  nunca lee filas de `portafolios`), recorrido de los tres roles.
- **Cierre** (orquestador): AGENTS.md, sitemap, redirects, TASKS.md, migrar producción con OK de Luis.

## Reglas para todos los agentes

- AGENTS.md manda: SQL crudo, Zod, `server-only`, español de dominio, texto visible en «tú».
- Next 16: leer `node_modules/next/dist/docs/` antes de usar una API.
- Verificación = `npm run typecheck && npm run lint && npm run verificar`. No hay runner de tests. No se hace build.
- Commits convencionales, sin atribución de IA.
