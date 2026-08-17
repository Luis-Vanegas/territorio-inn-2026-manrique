-- 016 · Tipo de negocio (emprendimiento / micronegocio / local), privado
--
-- Para qué: dato pedido explícitamente para la investigación del reto —
-- nunca se publica, por eso vive en `aliados_investigacion` y no en
-- `portafolios`. `tipo_negocio_detalle` guarda el texto libre cuando eligen
-- "otro", mismo patrón que `categoria_otra` en 015.

alter table aliados_investigacion
  add column tipo_negocio text
    check (tipo_negocio in ('emprendimiento', 'micronegocio', 'local', 'otro')),
  add column tipo_negocio_detalle text check (char_length(tipo_negocio_detalle) <= 80);
