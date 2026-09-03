# Constelaciones — Manrique

Directorio público de negocios y oficios de la **Comuna 3 de Medellín (Manrique)**, con mapa,
registro abierto y moderación.

Presentado en la convocatoria de **Presupuesto Participativo Comuna 3 + Instituto Tecnológico
Metropolitano (ITM)**. Reto **#2 — Empleo y Desarrollo Económico**.

**Sitio en producción:** https://territorio-inn-2026-manrique.vercel.app

---

## De qué se trata

Manrique tiene un tejido económico real —unidades productivas informales, oficios heredados,
negocios de barrio— que casi nunca aparece en los indicadores oficiales. Sin información local
y actualizada, cualquier política de reactivación económica se diseña a ciegas.

Este proyecto es una primera capa concreta contra ese problema: **una vitrina pública donde
cualquier vecino registra su negocio en menos de tres minutos, gratis, y queda visible en un
mapa para todo el barrio.**

No es una landing de presentación. Es un sistema en funcionamiento con base de datos,
moderación humana y consentimiento informado.

### Módulos

| Módulo | Estado | Qué hace |
|---|---|---|
| **Aliados** | en vivo | Directorio de negocios con dirección y contacto directo, sobre un mapa real de la comuna. Registro abierto, sin cuenta. |
| **Servicios** | tras un flag | Personas que prestan su oficio a domicilio y se desplazan por la comuna. |
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

- **No hay cookies de seguimiento, ni `localStorage`, ni huella de navegador.** La única cookie
  del sitio es la sesión del panel de moderación.
- La ubicación del visitante (`navigator.geolocation`) **nunca sale del navegador**: se usa para
  ordenar la lista por cercanía y no se envía a ningún endpoint.
- Las métricas son agregados por día. El dato individual no se guarda, así que no hay forma de
  reconstruir el recorrido de una persona.
- Los datos de investigación (tipo de negocio, dificultades, formación) **nunca se publican**:
  alimentan el diagnóstico, no la vitrina.
- Los datasets fuente (DANE, cámara de comercio) **no están en este repositorio** — `data/`
  está en `.gitignore`.

El detalle completo está en [`docs/seguridad.md`](docs/seguridad.md) y
[`docs/analitica.md`](docs/analitica.md), con la lista honesta de lo que todavía falta.

---

## Stack

- **Next.js 16** (App Router) + React 18 + TypeScript
- **Neon** (Postgres serverless) — SQL crudo vía repositorios, sin ORM
- **Zod** para validar todo input externo
- **Vercel Blob** para las fotos · **Leaflet** para los mapas
- **Tailwind CSS** · Framer Motion
- Fuentes: Fraunces (variable, optical sizing), Geist Sans, JetBrains Mono
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
npm run db:migrar            # aplica las 24 migraciones
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
npm run verificar    # geo, constraints, campos personalizados y entorno
npm run db:migrar    # aplica migraciones pendientes
npm run db:estado    # muestra qué migraciones están aplicadas
npm run db:admin     # crea un usuario admin
```

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
| `NEXT_PUBLIC_MODULO_SERVICIOS`, `NEXT_PUBLIC_MODULO_INVENTARIO` | no | `"true"` prende el módulo. Apagados, la ruta devuelve 404 y no aparece ni en el menú ni en el sitemap. |
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

El cron diario de limpieza se declara en [`vercel.json`](vercel.json).

---

## Documentación

| Documento | Qué contiene |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Convenciones de código: estructura, patrones, idioma del dominio. |
| [`docs/seguridad.md`](docs/seguridad.md) | Superficie expuesta, autenticación, rate limiting, cabeceras, y lo que falta. |
| [`docs/analitica.md`](docs/analitica.md) | Qué se mide, qué no, y por qué no hace falta banner de cookies. |
| [`docs/decisiones-diseno.md`](docs/decisiones-diseno.md) | Por qué el sistema visual es como es. |
| [`docs/sistema-diseno-a11y.md`](docs/sistema-diseno-a11y.md) | Sistema de diseño y accesibilidad. |
| [`docs/modulo-servicios.md`](docs/modulo-servicios.md) | Alcance y diseño del módulo de Servicios. |
| [`docs/auditoria-2026-08-16.md`](docs/auditoria-2026-08-16.md) | Auditoría de seguridad y correctness, con el estado de cada hallazgo. |
| [`TASKS.md`](TASKS.md) | Estado de trabajo: hecho, bloqueado, decisiones abiertas. |

---

## Equipo

Estudiantes del ITM y del Tecnológico de Antioquia.
Los integrantes y sus roles están en la [sección Equipo del sitio](https://territorio-inn-2026-manrique.vercel.app/#equipo).

## Licencia

[MIT](LICENSE) — se puede reusar, adaptar y desplegar para otra comuna o municipio.
Si lo haces, la estructura de `lib/geo/` y las migraciones son el punto de partida:
cambia el polígono del territorio y las categorías de oficio.
