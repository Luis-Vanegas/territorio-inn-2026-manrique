-- 035 · Accesos: invitaciones de un solo uso y moderadores por base
--
-- Solo aditiva. Diseño y razones en docs/seguridad.md › Invitaciones y
-- docs/base-de-datos.md §9.
--
--  1. admins.google_sub: la vía por base para entrar al equipo con Google. La
--     llena una invitación de moderador (nunca el correo: la identidad es el
--     `sub`). ADMIN_GOOGLE_SUBS sigue como respaldo del despliegue.
--     desactivado_en / desactivado_por: quién le quitó el acceso a quién. Con
--     `activo = false` la sesión vigente deja de valer en la siguiente petición
--     (verificarSesion lee `activo`).
--  2. invitaciones: el enlace que el equipo comparte por WhatsApp o correo. El
--     token NUNCA se guarda en claro: solo su sha256 (hex). Un solo uso, vence,
--     se puede revocar. Se consume en UNA sentencia (invitaciones.repo.ts).
--  3. intentos_registro: origen 'invitacion' (se recrea el CHECK, mismo patrón
--     que la 032).

-- ── 1 · Moderadores por base ────────────────────────────────

alter table admins
  add column google_sub text unique,
  add column desactivado_en timestamptz,
  add column desactivado_por text references admins(email) on update cascade on delete set null;

comment on column admins.google_sub is
  'sub de Google del moderador. Lo escribe una invitación de moderador o el respaldo ADMIN_GOOGLE_SUBS. Nunca el correo.';
comment on column admins.desactivado_en is
  'Cuándo se desactivó desde el panel. Con esto, ADMIN_GOOGLE_SUBS no reactiva a quien el equipo dio de baja.';

-- ── 2 · Invitaciones ────────────────────────────────────────

create table invitaciones (
  id          uuid primary key default gen_random_uuid(),
  -- sha256 hex del token. Quien lea la base (un respaldo, un log de consultas)
  -- no puede rearmar el enlace.
  token_hash  text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  tipo        text not null check (tipo in ('entidad', 'moderador')),
  entidad_id  uuid references entidades(id) on delete cascade,
  -- Para quién es («María, JAL»): sirve para reconocerla en la lista y revocarla.
  -- No es dato de acceso; la identidad la da Google al consumirla.
  nota        text check (nota is null or char_length(nota) between 1 and 80),
  creada_por  text not null references admins(email) on update cascade,
  creada_en   timestamptz not null default now(),
  expira_en   timestamptz not null,
  usada_por   uuid references usuarios(id) on delete set null,
  usada_en    timestamptz,
  revocada_en timestamptz,

  constraint chk_invitacion_entidad check ((tipo = 'entidad') = (entidad_id is not null)),
  -- Un enlace de acceso no puede vivir meses: tope de 30 días aunque el código pida más.
  constraint chk_invitacion_vence check (expira_en > creada_en and expira_en <= creada_en + interval '30 days'),
  -- usada_por puede quedar null si se borra la cuenta; usada_en queda como rastro.
  constraint chk_invitacion_usada check (usada_por is null or usada_en is not null),
  constraint chk_invitacion_usada_o_revocada check (usada_en is null or revocada_en is null)
);

-- ── 3 · Rate limit del enlace ───────────────────────────────

alter table intentos_registro
  drop constraint intentos_registro_origen_check;

alter table intentos_registro
  add constraint intentos_registro_origen_check
  check (origen in ('registro', 'login', 'estado', 'agente', 'geocodificar', 'datos', 'ingesta', 'invitacion'));
