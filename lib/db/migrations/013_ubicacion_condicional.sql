-- 013 · Ubicación y dirección dejan de ser universalmente obligatorias
--
-- Para qué: `tipo_presencia` (migración 009) distingue entre local fijo,
-- domicilio, ambos, y "solo por internet". Alguien que solo vende por
-- internet no tiene un punto que marcar en el mapa; alguien que solo va a
-- domicilio no tiene una dirección propia que publicar. Forzar `not null`
-- en `latitud`, `longitud`, `direccion` y `barrio` expulsaba exactamente a
-- esa población — el problema que motivó toda la sección 3 del rediseño.
--
-- Los CHECK de rango/longitud existentes (006, 001) no se tocan: en Postgres,
-- un CHECK sobre una columna nullable pasa solo cuando el valor es NULL
-- (la expresión da "desconocido", no "falso"), así que siguen siendo la
-- última línea de defensa para cuando el dato sí viene.

alter table portafolios
  alter column latitud drop not null,
  alter column longitud drop not null,
  alter column direccion drop not null,
  alter column barrio drop not null;
