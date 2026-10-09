-- 038 · Los clientes no cambian de dueño + índices de llaves foráneas
--
-- 1. clientes_negocio no tiene dueño propio: los ve quien sea dueño del
--    portafolio. Si el equipo reasigna o desvincula un negocio (accesos.repo),
--    o la cuenta se borra (on delete set null), el nuevo dueño heredaría los
--    clientes del anterior: datos de terceros (Ley 1581) que nunca le dieron.
--    El trigger los borra en la misma transacción que cambia el dueño, así
--    ninguna puerta nueva puede olvidarlo. Si el negocio no tenía dueño, nadie
--    pudo cargar clientes (el repo filtra por usuario_id), no hay nada que borrar.
create or replace function borrar_clientes_al_cambiar_dueno() returns trigger
language plpgsql as $$
begin
  delete from clientes_negocio where portafolio_id = new.id;
  return new;
end;
$$;

create trigger trg_portafolios_cambio_dueno
  after update of usuario_id on portafolios
  for each row
  when (old.usuario_id is not null and old.usuario_id is distinct from new.usuario_id)
  execute function borrar_clientes_al_cambiar_dueno();

-- 2. Llaves foráneas sin índice: cada delete en cascada o set null del padre
--    recorría la tabla hija entera. bitacora crece con cada acción del panel.
create index if not exists idx_bitacora_convocatoria
  on bitacora (convocatoria_id) where convocatoria_id is not null;
create index if not exists idx_invitaciones_entidad
  on invitaciones (entidad_id) where entidad_id is not null;
create index if not exists idx_invitaciones_usada_por
  on invitaciones (usada_por) where usada_por is not null;
create index if not exists idx_convocatorias_propuesta_por
  on convocatorias (propuesta_por) where propuesta_por is not null;
create index if not exists idx_vigia_fuentes_estado_entidad
  on vigia_fuentes_estado (entidad_id) where entidad_id is not null;
create index if not exists idx_portafolios_barrio_oficial
  on portafolios (barrio_oficial) where barrio_oficial is not null;

-- 3. El unique de usuarios.google_sub ya crea su índice: el parcial de la 027
--    era una copia que se mantenía en cada escritura sin servir a nadie.
drop index if exists idx_usuarios_google_sub;
