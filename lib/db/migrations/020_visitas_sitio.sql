-- 020 · Visitas al sitio
--
-- Para qué: el home muestra "Visitas al sitio" como número público. Ese dato
-- hasta ahora solo existía en Vercel Analytics, que no se puede leer desde el
-- servidor sin la API del plan Pro — y un número de la vitrina no puede
-- depender de un plan de hosting.
--
-- Mismo modelo de privacidad que 007_interacciones: no hay tabla de eventos.
-- El insert es un upsert que suma 1 a un contador por día. No se guarda IP,
-- cookie, sesión, user agent ni ruta: es imposible reconstruir el recorrido de
-- una persona aunque alguien con acceso total a la base quisiera. Por eso
-- sigue siendo un agregado y no un dato personal bajo Ley 1581.
--
-- Qué NO responde, y es deliberado: cuántas personas distintas entraron.
-- Eso exigiría un identificador persistente, y ese es exactamente el costo
-- que docs/analitica.md decidió no pagar.

create table visitas_sitio (
  dia    date primary key default current_date,
  conteo int not null default 0 check (conteo >= 0)
);
