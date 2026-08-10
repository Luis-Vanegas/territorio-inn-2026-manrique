# Analítica del sitio

## Dónde se ven las métricas

Dashboard de Vercel → proyecto `territorio-inn-2026-manrique` → pestañas
**Analytics** y **Speed Insights**. No hay que instalar nada ni pegar scripts:
los componentes ya están en `app/layout.tsx` y reportan solo en producción.

En desarrollo local no envían nada, así que las visitas del equipo mientras se
programa no ensucian los números.

## Qué mide

| Métrica | Para qué sirve acá |
|---|---|
| Visitantes | Cuánta gente distinta llegó al sitio en un período |
| Páginas vistas | Qué módulos se miran y cuáles se ignoran |
| Rutas más visitadas | Si `/portafolios/registro` recibe tráfico real |
| Referrers | Si el tráfico llega de redes, de la Alcaldía o directo |
| País / región | Confirmar que el alcance es local |
| Dispositivo y navegador | Si predomina móvil — define dónde optimizar |
| Core Web Vitals | Qué tan rápido carga de verdad, en los equipos de la gente |

Para medir la conversión del formulario alcanza con comparar visitas a
`/portafolios/registro` contra registros nuevos en la base:

```sql
select date_trunc('day', creado_en) as dia, count(*)
from portafolios group by 1 order by 1 desc;
```

## Qué NO mide, y por qué

No mide **quién** entra. No hay cookies, ni `localStorage`, ni huella de
navegador, ni identificador que persista entre visitas. No se puede saber si
dos visitas son de la misma persona, ni cruzar una visita con un registro.

Esto es deliberado, no una limitación que haya que resolver.

El proyecto recolecta datos personales bajo la Ley 1581 de 2012 y publica una
política de tratamiento donde declara exactamente qué guarda y para qué.
Identificar visitantes recurrentes agregaría una finalidad no declarada, y
exigiría consentimiento previo con banner de cookies — sobre gente que solo
está mirando una vitrina de negocios del barrio.

El costo de esa función no es técnico: es un banner de cookies encima de un
sitio público institucional, más una política que hay que ampliar y volver a
pasar por jurídica.

## Si en algún momento hace falta más

Antes de agregar cualquier herramienta que identifique usuarios:

1. Definir qué decisión concreta se va a tomar con ese dato. Si no cambia
   ninguna decisión, no se recolecta.
2. Pasarlo por jurídica del ITM: amplía las finalidades declaradas.
3. Implementar banner de consentimiento previo — bajo Ley 1581 el
   consentimiento es previo, expreso e informado.

Alternativas que siguen siendo anónimas y podrían cubrir necesidades mayores:
Plausible o Umami (ambas self-hosteables, sin cookies). Google Analytics 4 **no**
entra en esta categoría: usa identificadores persistentes.

## Seguridad del sitio

Separado de la analítica, lo que ya protege el módulo:

- **Rate limiting** por IP en el registro (`lib/db/rateLimit.ts`), 3 cada 10 min.
- **Validación en tres capas**: Zod en el cliente y el servidor, point-in-polygon
  contra el límite real de la comuna, y constraints en la base.
- **Sesión de moderación** con cookie `httpOnly` + `sameSite=lax` firmada con
  HMAC-SHA256, y passwords con scrypt.
- **Autorización en cada server action**, no solo en el layout: una action es un
  endpoint HTTP invocable sin pasar por ninguna página.
- **Panel excluido de buscadores** vía `robots: { index: false }`.

Pendiente de evaluar cuando haya tráfico real: activar **Vercel BotID** o reglas
de WAF si aparece abuso automatizado que el rate limiting no contenga.
