# Firmamento: módulos, datos y rutas

Diseño acordado el 2-oct-2026 a partir de la asesoría v2 (`ASESORIA_Constelaciones_Reto2_Comuna3_v2.docx`
y el prototipo `firmamento-app/`). Fuente de verdad para Claude Code y Antigravity.

## Las dos caras

| | Constelaciones | Firmamento |
|---|---|---|
| Para quién | Vecinos y visitantes, sin cuenta | Quien tiene sesión: negocio, equipo, entidad |
| Qué hay | Vitrina, mapa, fichas, guías, asesor, `/firmamento` público | Paneles por rol y el registro de negocios |
| Entrada | Pública | `/firmamento/entrar`, una pantalla con 3 pestañas |

Una sola app de Next, un deploy, una base (Neon).

## Decisiones

1. **Base: se queda en Neon.** Uso al 2-oct: ~33 MB de 1 GB del plan gratis. Lo que viene son
   2 tablas y 3 columnas; las fotos están en Vercel Blob y el ML en `public/`. Supabase no
   agrega capacidad (su plan gratis es más chico) y su Auth/RLS chocan con las sesiones a mano
   y el control de acceso en el `where`. Se revisa en el piloto 2027, no antes.
2. **La edición del dueño publica directo**, y el equipo corrige desde su panel guiado por la
   bitácora y las alertas de calidad. Es un CAMBIO de comportamiento: hasta la 033,
   `actualizarPorToken` devolvía la ficha a `pendiente` en cada edición. También se aparta del
   prototipo (`app.js:333` encolaba los cambios). Por eso no existe la tabla `cambios_ficha`.
3. **Las alertas de calidad no se guardan:** se calculan al vuelo con `dentroDeManrique`,
   `barrioDe` y la categoría «Otros». Guardarlas duplicaría un dato derivable.
4. **No hay cookie nueva.** La entidad entra con Google (`sesion_usuario`) y la autoriza su fila
   en `miembros_entidad`, no un rol dentro de la cookie. El equipo sigue con `admin_session`.
   Se mantiene la regla de AGENTS.md: dos poblaciones, dos cookies.

## Rutas

```
/firmamento                  público (ya existe): tablero agregado k = 5
/firmamento/entrar           login: Mi negocio (Google) · Equipo · Entidad (Google)
/firmamento/negocio          inicio · ficha · para-ti · constelacion · registro   ← hoy /mi-cuenta
                             registro ← /aliados/registro (3-oct: el registro sale del sitio público)
/firmamento/equipo           resumen · moderacion · convocatorias · territorio · datos · modelos
                             + aliados, registro (en campo, asistido), campos, guías, asesor, empleo  ← hoy /admin
/firmamento/entidad          observatorio · convocatorias · datos
```

- Carpetas: `app/(firmamento)/firmamento/{entrar,negocio,equipo,entidad}/` con su layout
  oscuro propio. El público sigue en `app/(site)/firmamento/`. **Antes de crearlas hay que
  verificar en `node_modules/next/dist/docs/`** que dos route groups puedan compartir el
  segmento `firmamento` sin chocar.
- `/admin/*` y `/mi-cuenta` redirigen con `redirects()` de `next.config.mjs`, y los enlaces
  viejos siguen funcionando.
- Las Server Actions y los repos no se mueven: siguen en `lib/actions/` y `lib/db/`. Solo
  cambian las pantallas.

## Datos

### Hoy (no cambia)

```
usuarios (google_sub) ──1:N── portafolios ──N:1── categorias
                                 ├─1:N─ interacciones_portafolio  → «Tu negocio en números»
                                 ├─1:1─ aliados_investigacion     privada (formalidad, dolor)
                                 ├─1:N─ aliados_consentimiento    Ley 1581
                                 ├─1:N─ clientes_negocio          CRM, filtra por usuario_id
                                 └─1:N─ sugerencias_categoria     reentrenamiento del sugeridor
admins (email) ──1:N── convocatorias.revisada_por
constelaciones → public/firmamento/constelaciones.json, calculadas al vuelo (constelacionDe)
```

### Migración 033

Diseño completo, hallazgos de producción y SQL en [`docs/base-de-datos.md`](base-de-datos.md).

### Quién ve qué

| Rol | Lee | Escribe |
|---|---|---|
| Negocio | Su ficha, sus interacciones, «Para ti», su constelación (OSM) | Su ficha (directo), sus clientes |
| Equipo | Todo | Moderación, correcciones, convocatorias, entidades y miembros, dueño de cada negocio, invitaciones y moderadores (035) |
| Entidad | **Solo agregados k = 5** (`obtenerDatosAbiertos`) y convocatorias aprobadas | Proponer una convocatoria → entra `pendiente`, `origen = 'entidad'` |

Una entidad nunca lee `portafolios` fila por fila: lo mismo que `/firmamento` público, más sus
propuestas.

## Orden de trabajo

1. 033 + el código que la acompaña, en una **rama de Neon** (la `dev` está archivada; `.env.local` apunta a producción).
2. `/firmamento/entrar` + layout del panel (diseño del prototipo, tokens de `DESIGN.md`).
3. Panel negocio (mover `/mi-cuenta`). Hecho: ver AGENTS.md › Panel del negocio.
4. Panel equipo (mover `/admin` + resumen y alertas de calidad).
5. Panel entidad + alta de miembros desde el equipo.
6. Redirecciones, `sitemap`, enlaces del menú, AGENTS.md.
