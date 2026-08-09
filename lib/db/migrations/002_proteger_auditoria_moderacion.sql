-- 002 · La auditoría de moderación no se puede borrar
--
-- Problema que corrige:
-- portafolios.moderado_por tenía `on delete set null`, pero el constraint
-- chk_moderacion_completa exige que todo registro no-pendiente tenga moderador.
-- Al borrar un admin que ya había moderado, Postgres intentaba poner NULL y
-- chocaba contra el propio CHECK, con un error que no explica nada:
--
--   ERROR: new row for relation "portafolios" violates check constraint
--          "chk_moderacion_completa"
--
-- Las dos reglas eran incompatibles. Se resuelve a favor de la auditoría:
-- en un proyecto institucional, saber quién aprobó cada publicación importa
-- más que poder borrar una fila de la tabla admins.
--
-- A partir de acá, un moderador que ya moderó NO se borra: se desactiva con
-- `update admins set activo = false`. La columna `activo` existe para eso y
-- autenticar() ya la respeta, así que desactivar corta el acceso de inmediato.

alter table portafolios
  drop constraint if exists portafolios_moderado_por_fkey;

alter table portafolios
  add constraint portafolios_moderado_por_fkey
  foreign key (moderado_por) references admins(email)
  on update cascade    -- si se corrige un correo mal escrito, la historia lo sigue
  on delete restrict;  -- y el borrado falla con un mensaje que sí se entiende

comment on constraint portafolios_moderado_por_fkey on portafolios is
  'RESTRICT a propósito: un moderador con historial se desactiva (activo = false), no se borra.';
