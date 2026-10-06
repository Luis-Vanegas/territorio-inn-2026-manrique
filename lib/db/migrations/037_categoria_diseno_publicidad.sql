-- 037 · Categoría de diseño, publicidad e impresiones
--
-- Para qué: comercios y oficios de diseño gráfico, litografías, publicidad,
-- estampado, rotulación y fotocopiados no tenían una categoría dedicada y
-- caían en papelería o generaban confusión en el sugeridor de categorías.
-- Se crea la categoría con id 'diseno_publicidad'.

insert into categorias (id, nombre, icono, orden) values
  ('diseno_publicidad', 'Diseño, publicidad e impresiones', 'palette', 20)
on conflict (id) do nothing;
