-- 014 · tipo_presencia sale del formulario — dirección y ubicación vuelven
-- a ser obligatorias para todos
--
-- Para qué: a pedido explícito del usuario, tras probar la 013 en vivo, la
-- pregunta "¿cómo atendés?" no aporta lo que se necesita para el reto de
-- investigación — se saca. Sin esa pregunta no hay forma de decidir cuándo
-- dirección/barrio/ubicación son opcionales, así que vuelven a ser
-- obligatorias para todo el mundo, como en el esquema original (001).
--
-- `cobertura` (barrios de domicilio) solo tenía sentido como dependiente de
-- tipo_presencia = 'domicilio'/'ambos' — sin esa pregunta, no hay quién la
-- dispare, se borra con la columna. `punto_referencia` NO se toca: es un
-- campo útil por sí solo, independiente de por qué se agregó.
--
-- Ninguna fila real usó todavía estas columnas en producción (el módulo
-- sigue en pruebas), así que no hay backfill que hacer al volver a poner
-- `not null`.

alter table portafolios
  alter column direccion set not null,
  alter column barrio set not null,
  alter column latitud set not null,
  alter column longitud set not null;

alter table portafolios
  drop column tipo_presencia,
  drop column cobertura;
