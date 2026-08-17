-- 008 · Cupos de rate limit separados por origen
--
-- Hasta acá `intentos_registro` mezclaba los intentos de todos los endpoints
-- públicos en un solo cupo por IP. Eso era correcto mientras los dos endpoints
-- fueran del mismo tipo (formularios públicos de escritura).
--
-- Deja de serlo al sumar el login de moderación, por dos razones:
--
--   1. Los cupos tienen que ser distintos. 3 intentos cada 10 minutos es
--      razonable para publicar un negocio; para alguien que tipea mal su
--      contraseña dos veces, es un bloqueo absurdo.
--   2. Compartir cupo crea una interferencia explotable: quemar el cupo con
--      logins fallidos dejaría a esa IP sin poder registrar un negocio, y
--      viceversa.
--
-- El código ya anticipaba esta migración: ver el comentario `ponytail:` en
-- lib/actions/registrarPeticion.ts.

alter table intentos_registro
  add column origen text not null default 'registro'
  check (origen in ('registro', 'login'));

-- El índice viejo no incluye origen, así que toda consulta filtrada por
-- origen terminaría escaneando los intentos del otro endpoint.
drop index if exists idx_intentos_ip_fecha;

create index idx_intentos_ip_origen_fecha
  on intentos_registro (ip, origen, creado_en desc);
