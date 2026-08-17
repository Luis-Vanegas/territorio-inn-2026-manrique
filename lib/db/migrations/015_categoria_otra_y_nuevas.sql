-- 015 · Categoría "Otro" con texto real, y algunas categorías más
--
-- Para qué: elegir "Otro" en categoría hoy no guarda nada distinto de
-- `categoria_id = 'otros'` — la persona no podía decir qué es. Se agrega una
-- columna corta para ese texto, separada de `descripcion` (que es más larga
-- y libre): así se puede leer "Otro: [lo que escribió]" en la ficha sin
-- mezclarlo con el resto del texto.
--
-- Las categorías nuevas: educación/cuidado y fotografía/eventos existían en
-- la lista genérica vieja (001) y se perdieron al migrar a categorías de
-- oficio (012) — vuelven porque son oficios reales de Manrique, no rubros de
-- directorio. Lavandería y reciclaje/compraventa no estaban en ninguna lista
-- anterior; son oficios comunes en la comuna que no calzan en las 16 ya
-- creadas. Es una primera pasada — se ajusta con más insert/update, sin
-- migración estructural (mismo comentario que ya deja 001 sobre esta tabla).

alter table portafolios
  add column categoria_otra text check (char_length(categoria_otra) <= 60);

insert into categorias (id, nombre, icono, orden) values
  ('educacion_cuidado',   'Educación y cuidado infantil', 'book-open', 16),
  ('fotografia_eventos',  'Fotografía y eventos',          'camera',    17),
  ('lavanderia',          'Lavandería',                    'shirt',     18),
  ('reciclaje',           'Reciclaje y compraventa',       'recycle',   19)
on conflict (id) do nothing;
