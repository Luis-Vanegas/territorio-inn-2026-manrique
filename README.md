# Constelaciones — Manrique

Directorio público de negocios y oficios de la **Comuna 3 de Medellín (Manrique)**, con mapa,
constelaciones de comercios cercanos, registro con moderación humana y **Firmamento**: paneles con
sesión para cada negocio, para el equipo y para las entidades del territorio.

Presentado en la convocatoria de **Presupuesto Participativo Comuna 3 + Instituto Tecnológico
Metropolitano (ITM)**. Reto **#2 — Empleo y Desarrollo Económico**.

**Sitio en producción:** https://territorio-inn-2026-manrique.vercel.app

### Para el jurado

1. Entra por **https://territorio-inn-2026-manrique.vercel.app/firmamento/entrar?rol=equipo**
   (pestaña «Equipo») con el correo y la contraseña que te entregó el equipo.
2. Llegas al **Resumen** del panel del equipo. Cada página del menú tiene una línea que explica
   para qué sirve.
3. Con esa cuenta ves datos reales de vecinos (Ley 1581): **mira, pero no apruebes ni rechaces
   fichas reales**.

Lo público se recorre sin cuenta: el inicio (buscador, mapa y cifras del barrio), `/aliados`,
`/nosotros` y los datos abiertos en [`/api/datos`](https://territorio-inn-2026-manrique.vercel.app/api/datos).

---

## De qué se trata

Manrique tiene un tejido económico real —unidades productivas informales, oficios heredados,
negocios de barrio— que casi nunca aparece en los indicadores oficiales. Sin información local
y actualizada, cualquier política de reactivación económica se diseña a ciegas.

Este proyecto es una primera capa concreta contra ese problema: **una vitrina pública donde
cualquier vecino registra su negocio gratis y queda visible en un mapa para todo el barrio**, y una
red que lo acompaña: formación, convocatorias que le aplican y contacto con los comercios vecinos.

No es una landing de presentación. Es un sistema en funcionamiento con base de datos,
moderación humana y consentimiento informado.

### Qué hay

| Parte | Qué hace |
|---|---|
| **Inicio** (público) | Buscador y mapa de la comuna: aliados de la red (estrellas grandes) y comercios de OpenStreetMap (estrellas pequeñas), agrupados en **constelaciones** de comercios cercanos. «Qué tengo cerca», ficha de cada negocio y «El barrio en cifras». |
| **Aliados, guías y formalización** (público) | Vitrina de negocios aprobados, guías de marca y ventas, pasos para formalizarse. |
| **Datos abiertos** (`/api/datos`) | Solo conteos de negocios aprobados; toda cifra menor que 5 sale como «<5» (regla k = 5). |
| **Firmamento · Mi negocio** | Registro y edición de la ficha, cifras de visitas y contactos, «Para ti» (convocatorias y guías según el negocio), «Mi constelación» y **Mis clientes**, un CRM sencillo con contacto por WhatsApp. |
| **Firmamento · Equipo** | Moderación (aprobar o rechazar, alertas de calidad, historial de cambios), registro asistido en campo, convocatorias, territorio, modelos y datos. |
| **Firmamento · Entidad** | JAL, CEDEZO y oferentes: solo cifras agregadas (k = 5) y convocatorias que pueden proponer. |
| **Sugeridor de categoría** | Modelo (TF-IDF + regresión logística) que corre **en el navegador**: lo que la persona escribe no sale de su pantalla. |
| **Vigía de convocatorias** | Revisa cada mañana las páginas de entidades y deja las nuevas `pendiente` para que el equipo decida. |
| **Asesor de formalización** | Asistente con modelo de lenguaje, solo para personas con sesión. |

Los módulos de empleo e inventario están detrás de un flag: apagados devuelven **404 real** y no
aparecen ni en el menú ni en el sitemap.

### Cómo funciona un registro

1. La persona toca «Entrar», elige «Mi negocio» y entra con su cuenta de Google.
2. Llena el formulario en Firmamento y acepta de forma expresa el tratamiento de datos (Ley 1581).
   Quien no maneja tecnología puede ser registrado en campo por el equipo (registro asistido),
   con su consentimiento.
3. El registro queda **pendiente**. No se publica solo.
4. El equipo lo aprueba o lo rechaza desde el panel. Un rechazo exige motivo.
5. Ya aprobado, el dueño edita su ficha desde su panel o desde su enlace personal, y cada cambio
   queda en el historial.

---|---|---|
| **Aliados** | en vivo | Directorio de negocios con dirección y contacto directo, sobre un mapa real de la comuna. Registro abierto, sin cuenta. |
| **Inventario predictivo** | próximamente | Seguimiento de unidades productivas en el tiempo. Todavía es un stub. |

Los módulos apagados devuelven **404 real**: no aparecen en el menú ni en el sitemap.

### Cómo funciona un registro

1. Un vecino llena el formulario público. No necesita cuenta.
2. Acepta términos y tratamiento de datos (Ley 1581 de habeas data) de forma expresa.
3. El registro queda **pendiente**. No se publica solo.
4. El equipo lo aprueba o lo rechaza desde el panel de moderación. Un rechazo exige motivo.
5. La persona recibe un enlace privado para ver, corregir o borrar su ficha cuando quiera.

---

## Datos personales

El proyecto maneja datos de vecinos reales, así que esto no es un detalle de pie de página:

- **No hay cookies de seguimiento ni huella de navegador.** Las cookies son de sesión
  (`admin_session` para el equipo, `sesion_usuario` para vecinos), de un solo uso para el ingreso
  con Google (`oauth_*`) y la preferencia del negocio activo. `localStorage` guarda solo el tema
  claro u oscuro.
- La identidad de un vecino es el `sub` de Google, **nunca el correo**. Nadie gana acceso por
  coincidir un correo: los accesos se dan por invitación o desde el panel del equipo.
- La ubicación del visitante (`navigator.geolocation`) **nunca sale del navegador**: se usa para
  ordenar la lista por cercanía y no se envía a ningún endpoint.
- Las métricas son agregados por día. El dato individual no se guarda, así que no hay forma de
  reconstruir el recorrido de una persona.
- Los datos de investigación (tipo de negocio, dificultades, formación) **nunca se publican**:
  alimentan el diagnóstico, no la vitrina. Una entidad solo ve agregados con k = 5.
- Los clientes que cada negocio guarda en «Mis clientes» son datos de terceros: lo mínimo (nombre,
  teléfono, nota) y, si el negocio cambia de dueño, se borran.
- Los datasets fuente (DANE, cámara de comercio) **no están en este repositorio** — `data/`
  está en `.gitignore`.

El detalle completo está en [`docs/seguridad.md`](docs/seguridad.md) y
[`docs/analitica.md`](docs/analitica.md), con la lista honesta de lo que todavía falta.

---

## Stack

- **Next.js 16** (App Router) + React + TypeScript
- **Neon** (Postgres serverless) — SQL crudo vía repositorios, sin ORM
- **Zod** para validar todo input externo
- **Vercel Blob** para las fotos · **Leaflet** para los mapas
- **Tailwind CSS** · Framer Motion
- Fuentes: Fraunces (títulos), DM Sans (todo lo demás), DM Mono (solo la cifra grande de un indicador)
- Ingreso con **Google OAuth 2.0 a mano** (PKCE), sin NextAuth; el equipo también entra con correo y contraseña
- **Pipeline en Python** (`pipeline/`): OpenStreetMap, constelaciones con HDBSCAN, clasificador y vigía
- Node >= 20.9.0 · el paquete es ESM (`"type": "module"`)

Las convenciones de código (estructura de carpetas, patrones, idioma del dominio) están en
[`AGENTS.md`](AGENTS.md). **Léelo antes de tocar código.**

---

## Correr en local

Necesitas una base Neon: el sitio consulta la base en casi todas las rutas y no arranca sin
`DATABASE_URL`.

```bash
npm install
cp .env.example .env.local   # y llenar los valores (ver la tabla de abajo)
npm run db:migrar            # aplica las 38 migraciones
npm run db:admin             # crea un usuario del panel de moderación
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

> **Usa una rama de desarrollo de Neon, no la de producción.** Una rama es copia
> instantánea y aislada: una migración o un `delete` en local no tocan el sitio en vivo.

### Comandos

```bash
npm run dev          # servidor de desarrollo
npm run build        # build de producción
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run verificar    # 23 verificadores: voseo, geo, accesos, k = 5, sugeridor, clientes…
npm run db:migrar    # aplica migraciones pendientes
npm run db:estado    # muestra qué migraciones están aplicadas
npm run db:admin     # crea o resetea un usuario del equipo (pide la contraseña por consola)
```

No hay tests ni CI de verificación: antes de subir se corre a mano
`npm run typecheck && npm run lint && npm run verificar`. Ojo: `verificar-constraints` y
`verificar-campos-personalizados` escriben en la base dentro de una transacción que termina en
`rollback`; córrelos contra una rama de Neon.

---

## Variables de entorno

El sitio **no funciona sin estas variables**. Con las obligatorias ausentes el despliegue levanta
igual y falla al primer uso real, que es la peor forma de fallar.

| Variable | Obligatoria | Para qué |
|---|---|---|
| `DATABASE_URL` | sí | Conexión a Neon. Sin esto no hay sitio. |
| `ADMIN_SESSION_SECRET` | sí | Firma HMAC de la sesión de moderación. |
| `IP_HASH_PEPPER` | sí | Pepper del hash de IP en `aliados_consentimiento`. **Si falta, `hashIp()` devuelve `null` y no se guarda el dato** (falla cerrado a propósito — ver [`docs/seguridad.md`](docs/seguridad.md)). |
| `CRON_SECRET` | sí | Protege `/api/cron/purgar`. **Si falta, el endpoint devuelve 503 y la purga diaria nunca corre**: `intentos_registro` crece sin techo. Vercel manda el header `Authorization` solo si esta variable existe. |
| `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID` | sí | Fotos en Vercel Blob. Los inyecta la integración al vincular el store. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | sí | Ingreso con Google de vecinos, equipo y entidades. La URI de retorno registrada en Google debe coincidir exactamente con la del sitio. |
| `INGESTA_SECRETO` | sí, para el vigía | Protege `/api/ingesta/*`. Sin ella esos endpoints responden 503 (fallan cerrados). |
| `ADMIN_GOOGLE_SUBS` | no | Respaldo: `sub` de Google con acceso al panel del equipo (`npm run db:google-sub`). Lo normal es invitar desde el panel. |
| `Gemi_Api`, `GROQ_API`, `OPENROUTER_API_KEY`, `NVIDIA_API_KEY`, `API_router` | no | Proveedores del asesor (plan gratuito, se prueban en orden). Sin ninguna, el asesor no responde. Los nombres distinguen mayúsculas. |
| `NEXT_PUBLIC_MODULO_EMPLEO`, `NEXT_PUBLIC_MODULO_INVENTARIO` | no | `"true"` prende el módulo. Apagados, la ruta devuelve 404 y no aparece ni en el menú ni en el sitemap. |
| `NEXT_PUBLIC_SITE_URL` | no | Solo si hay dominio propio. Sin ella se usa `VERCEL_PROJECT_PRODUCTION_URL`, correcto mientras el sitio viva en `.vercel.app`. |

Generar un secreto:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Cárgalas en **Production y Preview** con el mismo valor: un secreto distinto entre entornos hace
que los hashes de uno no se puedan comparar con los del otro.

Comprobar desde afuera que `CRON_SECRET` quedó bien puesta —
**503 significa que falta, 401 que está correcta**:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://TU-SITIO/api/cron/purgar
```

---

## Desplegar en Vercel

```bash
npm i -g vercel
vercel
```

O conectar el repositorio desde [vercel.com/new](https://vercel.com/new). Vercel detecta Next.js
solo; lo que hay que cargar a mano son las variables de arriba.

**Vercel no re-despliega al editar una variable**: los cambios de entorno entran en el build
siguiente.

El cron diario de limpieza se declara en [`vercel.json`](vercel.json). El vigía de convocatorias
corre en GitHub Actions ([`.github/workflows/vigia-convocatorias.yml`](.github/workflows/vigia-convocatorias.yml)).

---

## Documentación

| Documento | Qué contiene |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Convenciones de código: estructura, patrones, idioma del dominio. |
| [`docs/seguridad.md`](docs/seguridad.md) | Superficie expuesta, autenticación, rate limiting, cabeceras, y lo que falta. |
| [`docs/analitica.md`](docs/analitica.md) | Qué se mide, qué no, y por qué no hace falta banner de cookies. |
| [`docs/decisiones-diseno.md`](docs/decisiones-diseno.md) | Por qué el sistema visual es como es. |
| [`docs/sistema-diseno-a11y.md`](docs/sistema-diseno-a11y.md) | Sistema de diseño y accesibilidad. |
| [`docs/arquitectura-y-costos.md`](docs/arquitectura-y-costos.md) | Arquitectura, stack, límites de escala y costos por escenario (precios consultados el 2026-09-29). |
| [`docs/auditoria-2026-08-16.md`](docs/auditoria-2026-08-16.md) | Auditoría de seguridad y correctness, con el estado de cada hallazgo. |
| [`docs/base-de-datos.md`](docs/base-de-datos.md) | Dominios, diagrama y cada migración desde la 033. |
| [`docs/firmamento-modulos.md`](docs/firmamento-modulos.md) | Roles y paneles de Firmamento. |
| [`pipeline/README.md`](pipeline/README.md) | Cómo regenerar comercios, constelaciones, modelo y vigía. |
| [`docs/concurso/`](docs/concurso/) | Documento técnico del concurso. |
| [`TASKS.md`](TASKS.md) | Estado de trabajo: hecho, bloqueado, decisiones abiertas. |

---

## Equipo

Estudiantes del ITM y del Tecnológico de Antioquia.
Los integrantes y sus roles están en la [sección Equipo del sitio](https://territorio-inn-2026-manrique.vercel.app/nosotros#equipo).

## Licencia

[MIT](LICENSE) — se puede reusar, adaptar y desplegar para otra comuna o municipio.
Si lo haces, la estructura de `lib/geo/` y las migraciones son el punto de partida:
cambia el polígono del territorio y las categorías de oficio.
