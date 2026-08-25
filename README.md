# Constelaciones — Manrique

Landing pública de la propuesta **Constelaciones** para la Comuna 3 de Medellín (Manrique), presentada en el marco de la convocatoria de **Presupuesto Participativo Comuna 3 + Instituto Tecnológico Metropolitano (ITM)**.

Reto escogido: **#2 — Empleo y Desarrollo Económico**.

**Demo en producción:** https://territorio-inn-2026-manrique.vercel.app
**Repositorio:** https://github.com/Luis-Vanegas/territorio-inn-2026-manrique

Esta iteración es solo la cáscara visual: landing estática, sin autenticación, sin dashboards, sin conexión a base de datos. Esas capas llegan en iteraciones futuras.

## Equipo

| Integrante | Programa / Institución | Rol |
| --- | --- | --- |
| Nombre Apellido | Programa · ITM | Rol en el proyecto |
| Nombre Apellido | Programa · ITM | Rol en el proyecto |
| Nombre Apellido | Programa · ITM | Rol en el proyecto |

## Stack

- Next.js 14 (App Router) + TypeScript estricto
- Tailwind CSS
- Framer Motion
- Fuentes: Fraunces (variable, optical sizing), Geist Sans, JetBrains Mono

## Correr en local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Vercel detecta Next.js solo, pero el sitio **no funciona sin estas variables**.
Las tres primeras son obligatorias: sin ellas el despliegue levanta y falla al
primer uso real.

| Variable | Obligatoria | Para qué |
|---|---|---|
| `DATABASE_URL` | sí | Conexión a Neon. Sin esto no hay sitio. |
| `ADMIN_SESSION_SECRET` | sí | Firma HMAC de la sesión de moderación. |
| `IP_HASH_PEPPER` | sí | Pepper del hash de IP en `aliados_consentimiento`. **Si falta, `hashIp()` devuelve `null` y no se guarda el dato** (falla cerrado a propósito — ver `docs/seguridad.md`). |
| `CRON_SECRET` | sí | Protege `/api/cron/purgar`. **Si falta, el endpoint devuelve 503 y la purga diaria nunca corre**: `intentos_registro` crece sin techo. Vercel manda el header `Authorization` solo si esta variable existe. |
| `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID` | sí | Fotos en Vercel Blob. Los inyecta la integración al vincular el store. |
| `NEXT_PUBLIC_MODULO_SERVICIOS`, `NEXT_PUBLIC_MODULO_INVENTARIO` | no | `"true"` prende el módulo. Apagados, la ruta devuelve 404 y no aparece ni en el menú ni en el sitemap. |
| `NEXT_PUBLIC_SITE_URL` | no | Solo si algún día hay dominio propio. Sin ella se usa `VERCEL_PROJECT_PRODUCTION_URL`, que es lo correcto mientras el sitio viva en `.vercel.app`. |
| `NEXT_PUBLIC_REPO_URL` | no | Link al repo en el footer. Sin ella, no se muestra. |

Generar un secreto:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Cargalas en **Production y Preview** con el mismo valor. Un secreto distinto
entre entornos hace que los hashes de uno no se puedan comparar con los del otro.

## Desplegar en Vercel

```bash
npm i -g vercel
vercel
```

O conectar el repositorio directamente desde [vercel.com/new](https://vercel.com/new).
Vercel no re-despliega al editar una variable: los cambios de entorno entran en
el build siguiente.

## Licencia

MIT
