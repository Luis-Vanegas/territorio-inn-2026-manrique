-- 024 · Nombre completo reservado; en público solo primer nombre + primer apellido
--
-- Para qué: mismo criterio que la foto (023). El nombre completo (nombres y
-- apellidos) es lo que permite identificar a la persona si llega a haber un
-- problema — se pide siempre, pero se guarda en privado. Lo que se publica es
-- una versión reducida: primer nombre + primer apellido, que alcanza para que
-- el vecino sepa a quién está por contactar sin exponer la identidad completa.
--
-- `servicios.nombre` no cambia de tipo ni de nombre: sigue siendo un texto
-- público de hasta 80 caracteres. Lo que cambia es QUIÉN lo escribe: antes lo
-- tipeaba la persona directamente, ahora lo calcula el servidor (primera
-- palabra de `nombres` + primera palabra de `apellidos`) a partir de lo que
-- vive en `servicios_privado`. El cálculo ocurre en
-- lib/validation/servicio.schema.ts, no en el cliente ni en SQL.
--
-- El módulo sigue sin desplegarse en producción con datos reales, así que no
-- hay filas que migrar.

alter table servicios_privado
  add column nombres   text not null default '' check (char_length(nombres) between 2 and 60),
  add column apellidos text not null default '' check (char_length(apellidos) between 2 and 60);

-- El default '' existía solo para poder agregar la columna sobre la tabla ya
-- creada. Se saca para que cada insert futuro tenga que declararlo a
-- propósito, igual que se hizo con acepto_investigacion en la 022.
alter table servicios_privado
  alter column nombres drop default,
  alter column apellidos drop default;
