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

## Visitas al sitio (dato propio)

Vercel Analytics no se puede leer desde el servidor sin la API del plan Pro, y
el home muestra "Visitas al sitio" como número público: un dato de la vitrina
no puede depender de un plan de hosting. Por eso hay un contador propio.

Tabla `visitas_sitio`, una fila por día:

| Columna | Qué guarda |
|---|---|
| `dia` | la fecha, y nada más |
| `conteo` | cuántas páginas se abrieron ese día |

Se dispara desde `components/ContadorVisitas.tsx`, montado en el layout de
`(site)` — así que **no cuenta `/admin`**. El disparo es del lado del cliente y
no en el render del servidor a propósito: los bots que no ejecutan JavaScript
quedan afuera y un prefetch de Next no infla el número.

**Cuenta páginas abiertas, no personas.** No hay cookie ni identificador que
persista entre visitas, así que dos cargas de la misma persona son dos. Esa
imprecisión es el precio de no poner un banner de consentimiento encima de una
vitrina de barrio, y por eso el número se rotula como lo que es. Para visitantes
únicos está Vercel Analytics.

Mismo modelo de privacidad que las interacciones: el `insert` es un upsert que
suma 1 a un contador. No existe tabla de eventos, no se guarda IP, ruta, sesión
ni user agent. Es un agregado, no un dato personal bajo Ley 1581.

## Qué se muestra en público y qué no

El home muestra **dos** números: negocios registrados y visitas al sitio. Los
contactos iniciados (WhatsApp, correo o red social tocados desde una ficha)
salieron de la portada a propósito, por dos razones:

1. **Es una métrica de diagnóstico, no de vitrina.** Un "0 contactos" en la
   portada le está diciendo al visitante que en el sitio nadie contacta a nadie.
2. **Es información comercial de los negocios.** Cuántos contactos genera el
   ecosistema es dato de gestión interna.

Todo lo demás —vistas por ficha, contactos, ranking, tasa de mirar→contactar,
negocios sin una sola visita— sigue completo en `/admin/estadisticas`, que está
detrás de sesión y excluido de buscadores.

## Interacciones con cada aliado (datos propios)

Vercel Analytics mide el sitio. Esto mide **cada negocio**, que es otra
pregunta: no "cuánta gente entró a /aliados" sino "a quién fueron a ver".

Tabla `interacciones_portafolio`, una fila por negocio por día por tipo:

| Tipo | Se cuenta cuando |
|---|---|
| `vista` | alguien abre la ficha de un negocio desde el mapa |
| `contacto` | alguien toca su WhatsApp, teléfono, correo o red social |

**La distinción es el punto.** Mirar es ruido, escribir es señal. Cien vistas
sin un solo contacto dicen que la ficha no convence; diez vistas con cinco
contactos dicen que ese negocio funciona. Un solo número no dice ninguna de las
dos cosas.

Se ve en `/admin/estadisticas`, sección **03 · Interés por negocio**, con el
ranking completo, el porcentaje que pasa de mirar a contactar, y cuántos
negocios publicados no recibieron una sola visita — que es tan accionable como
saber cuál es el más visto.

### Por qué esto NO necesita consentimiento

Bajo Ley 1581 hay que pedir permiso para tratar **datos personales**: los que
identifican o hacen identificable a una persona. Un contador agregado no lo es,
y acá la propiedad está garantizada por el esquema, no por una promesa:

- No se guarda IP, ni cookie, ni identificador de sesión, ni user agent.
- **No existe una tabla de eventos individuales.** El `insert` es un upsert que
  suma 1 a un contador. El dato individual nunca llega a escribirse.
- Por lo tanto es imposible reconstruir el recorrido de una persona, aunque
  alguien con acceso total a la base quisiera hacerlo.

La diferencia con lo que sí requeriría consentimiento:

| Pregunta | ¿Necesita permiso? |
|---|---|
| "La ficha de X se abrió 40 veces esta semana" | **No.** Es un agregado |
| "Esta persona vio X, después Y, después Z" | **Sí.** Eso es perfilado |

### La ubicación del visitante tampoco se guarda

El botón "ver los que tengo cerca" usa `navigator.geolocation`. Esa coordenada
**nunca sale del navegador**: se usa en memoria para ordenar la lista por
distancia y no se envía a ningún endpoint ni se persiste en ningún lado.

Además el permiso no se pide al cargar la página, sino cuando la persona toca
el botón — que además explica para qué es. Un permiso que salta solo se deniega
por reflejo.

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
