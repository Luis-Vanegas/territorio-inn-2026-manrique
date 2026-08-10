-- 004 · Corrige chk_opciones_segun_tipo: NULL no es FALSE en un CHECK
--
-- La 003 definía:
--   (tipo = 'seleccion' and jsonb_typeof(opciones) = 'array' and ...)
--   or (tipo <> 'seleccion' and opciones is null)
--
-- Con tipo='seleccion' y opciones=NULL, jsonb_typeof(NULL) es NULL, así que
-- toda la primera rama evalúa a NULL en vez de FALSE. Postgres solo rechaza
-- un CHECK cuando el resultado es exactamente FALSE — NULL se trata como
-- "aprobado". Confirmado insertando la fila que debía fallar: pasó.
--
-- El fix envuelve la expresión completa en coalesce(..., false), así un
-- resultado NULL se fuerza a FALSE y sí rechaza.

alter table definiciones_campo drop constraint chk_opciones_segun_tipo;

alter table definiciones_campo add constraint chk_opciones_segun_tipo check (
  coalesce(
    (tipo = 'seleccion' and jsonb_typeof(opciones) = 'array' and jsonb_array_length(opciones) >= 2)
    or (tipo <> 'seleccion' and opciones is null),
    false
  )
);
