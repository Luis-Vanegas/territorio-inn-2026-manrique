-- 017 · Cupo de rate limit propio para /aliados/estado/[token]
--
-- Para qué: la página de estado permite corregir datos y pedir borrado sin
-- login, protegida solo por el token en la URL. Igual que registro y login
-- (008), necesita su propio cupo — alguien reintentando guardar una edición
-- no tiene por qué compartir cupo con gente registrando negocios nuevos.

alter table intentos_registro
  drop constraint intentos_registro_origen_check;

alter table intentos_registro
  add constraint intentos_registro_origen_check
  check (origen in ('registro', 'login', 'estado'));
