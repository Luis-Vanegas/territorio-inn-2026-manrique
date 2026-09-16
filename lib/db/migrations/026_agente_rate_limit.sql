-- 026 · El asesor de formalización entra al rate limit con cupo propio
--
-- Para qué: /api/agente consulta un modelo de lenguaje, que es la única
-- operación del sitio que cuesta plata por request. El cupo compartido de
-- `estado` no sirve: una persona que corrige su dirección tres veces no debería
-- quedarse sin preguntas, y alguien que pregunta diez veces no debería quedarse
-- sin poder editar su ficha.
--
-- El CHECK de la 017 admite exactamente tres valores, así que un insert con
-- origen 'agente' falla con violación de restricción — no es opcional agregarlo
-- acá antes de que el endpoint escriba.
--
-- Mismo patrón que la 017: se borra el CHECK y se recrea con el valor nuevo.
-- Ampliar una lista de permitidos nunca falla contra filas existentes, así que
-- no hay backfill ni riesgo sobre lo que ya está guardado.

alter table intentos_registro
  drop constraint intentos_registro_origen_check;

alter table intentos_registro
  add constraint intentos_registro_origen_check
  check (origen in ('registro', 'login', 'estado', 'agente'));
