-- 023 · La foto de Servicios pasa a ser reservada, no pública
--
-- Para qué: a pedido explícito del usuario, la foto deja de mostrarse en la
-- ficha pública. Su función cambia de "generar confianza de cara al
-- visitante" a "permitir identificar a la persona si llega a haber un
-- problema, y sostener el compromiso de conducta que aceptó al registrarse"
-- — un mecanismo de responsabilidad interno, no una vitrina.
--
-- Se mueve de tabla y no solo se deja de renderizar en el frontend: la
-- separación pública/privada de este módulo es estructural (ver 021), y una
-- columna sensible que vive en la tabla pública es una promesa de "no se
-- muestra" sostenida únicamente por disciplina de código en cada lugar que
-- consulta esa tabla. Sacarla de ahí hace la promesa cierta aunque alguien
-- se olvide.
--
-- El módulo sigue sin desplegarse a producción (NEXT_PUBLIC_MODULO_SERVICIOS
-- apagado), así que no hay filas reales que migrar entre columnas.

alter table servicios
  drop column if exists foto_url,
  drop column if exists foto_blob_pathname;

alter table servicios_privado
  add column foto_url text,
  add column foto_blob_pathname text;
