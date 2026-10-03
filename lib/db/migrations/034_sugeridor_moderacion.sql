-- 034 · El sugeridor de categoría en la moderación
--
-- El equipo ve la categoría que propone el modelo en cada registro pendiente y
-- en las fichas en «Otros», y decide en un clic: usar la sugerida, mantener la
-- actual o corregir a mano (lib/actions/decidirCategoria.ts). Cada decisión es
-- un ejemplo para reentrenar, así que va a `sugerencias_categoria` como las del
-- registro, con otro origen. Solo aditiva:
--
--  1. origen 'moderacion': se recrea el CHECK (mismo patrón que la 032 con
--     intentos_registro).
--  2. decision_equipo: qué hizo el equipo. `aceptada` sola no alcanza: «mantener
--     la actual» y «corregir a otra» son las dos `false`, y el panel las cuenta
--     por separado. NULL en las filas del registro y del buscador; obligatoria en
--     las de moderación.
--
-- Igual que antes, la tabla NO guarda texto: el ejemplo de reentrenamiento es el
-- nombre de la ficha (`portafolio_id` → portafolios.nombre) y su categoría final
-- (portafolios.categoria_id, después de las correcciones).

alter table sugerencias_categoria
  drop constraint sugerencias_categoria_origen_check;

alter table sugerencias_categoria
  add constraint sugerencias_categoria_origen_check
  check (origen in ('registro', 'busqueda', 'moderacion'));

alter table sugerencias_categoria
  add column decision_equipo text
  check (decision_equipo in ('usada', 'corregida', 'mantenida'));

alter table sugerencias_categoria
  add constraint chk_sugerencia_decision_equipo
  check ((origen = 'moderacion') = (decision_equipo is not null));

comment on column sugerencias_categoria.decision_equipo is
  'Solo origen moderacion: usada = el equipo tomó una categoría propuesta; corregida = eligió otra a mano; mantenida = dejó la que tenía.';
