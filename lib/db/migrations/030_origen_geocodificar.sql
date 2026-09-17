-- 030 · El botón "Ubicar en el mapa" entra al rate limit con cupo propio
--
-- Para qué: la 029 sumó `geocodificar` como origen en `lib/db/rateLimit.ts`
-- (el botón de geocoding del registro) pero no tocó esta tabla — el primer
-- click real lo confirmó: insert con origen 'geocodificar' falla contra el
-- CHECK de la 026, que solo admite 'registro', 'login', 'estado', 'agente'.
--
-- Mismo patrón que la 017 y la 026: se borra el CHECK y se recrea con el
-- valor nuevo. Ampliar una lista de permitidos nunca falla contra filas
-- existentes, así que no hay backfill ni riesgo sobre lo que ya está guardado.

alter table intentos_registro
  drop constraint intentos_registro_origen_check;

alter table intentos_registro
  add constraint intentos_registro_origen_check
  check (origen in ('registro', 'login', 'estado', 'agente', 'geocodificar'));
