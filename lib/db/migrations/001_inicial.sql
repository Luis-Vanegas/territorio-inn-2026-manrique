-- 001 · Esquema inicial del Módulo Portafolios
--
-- Registro público con moderación: cualquiera se inscribe → entra 'pendiente'
-- → un moderador del ITM aprueba → aparece en la vitrina.
--
-- Portabilidad: SQL estándar de Postgres, sin extensiones propietarias de Neon.
-- Esta migración corre igual en Neon, Supabase, RDS o un Postgres local.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Moderadores
-- Emails individuales con hash scrypt (node:crypto, sin dependencia externa).
-- Decisión: trazabilidad real de quién aprueba qué — es un proyecto institucional.
-- ─────────────────────────────────────────────────────────────

create table admins (
  email         text primary key check (position('@' in email) > 1),
  nombre        text not null,
  password_hash text not null,          -- "salt_hex:hash_hex" (scrypt, 64 bytes)
  activo        boolean not null default true,
  creado_en     timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Categorías
-- Seed genérico para el MVP. Se ajusta con datos reales de Manrique vía
-- insert/update, sin migración estructural.
-- ─────────────────────────────────────────────────────────────

create table categorias (
  id     text primary key,
  nombre text not null,
  icono  text,
  activa boolean not null default true,
  orden  int not null default 0
);

insert into categorias (id, nombre, icono, orden) values
  ('alimentacion', 'Alimentación y bebidas',  'utensils',        1),
  ('belleza',      'Belleza y cuidado',       'scissors',        2),
  ('moda',         'Moda y accesorios',       'shirt',           3),
  ('hogar',        'Hogar y decoración',      'home',            4),
  ('tecnologia',   'Tecnología y reparación', 'wrench',          5),
  ('educacion',    'Educación y arte',        'book-open',       6),
  ('salud',        'Salud y bienestar',       'heart-pulse',     7),
  ('servicios',    'Servicios generales',     'briefcase',       8),
  ('otros',        'Otros',                   'more-horizontal', 99);

-- ─────────────────────────────────────────────────────────────
-- Portafolios
-- ─────────────────────────────────────────────────────────────

create type portafolio_estado as enum ('pendiente', 'aprobado', 'rechazado', 'archivado');

create table portafolios (
  id                 uuid primary key default gen_random_uuid(),

  nombre             text not null check (char_length(nombre) between 2 and 80),
  descripcion        text check (char_length(descripcion) <= 400),
  categoria_id       text not null references categorias(id),

  direccion          text not null check (char_length(direccion) between 5 and 200),
  barrio             text not null check (char_length(barrio) between 2 and 80),

  -- numeric(9,6) da ~11 cm de precisión: suficiente para ubicar una fachada
  -- y sin el ruido de un float. El rango se acota al bbox de Manrique con
  -- margen, para que un insert directo tampoco pueda meter un punto en Bogotá.
  latitud            numeric(9,6) not null check (latitud between 6.25 and 6.30),
  longitud           numeric(9,6) not null check (longitud between -75.57 and -75.52),

  whatsapp           text,
  telefono           text,
  correo             text check (correo is null or position('@' in correo) > 1),
  instagram          text,
  facebook           text,
  -- Al menos un medio de contacto. Zod ya lo valida, pero la base es la última
  -- línea de defensa: un insert directo no puede saltarse esto.
  constraint chk_al_menos_un_contacto check (
    coalesce(whatsapp, telefono, correo, instagram, facebook) is not null
  ),

  foto_url           text,
  foto_blob_pathname text,              -- necesario para borrar en Blob al archivar

  estado             portafolio_estado not null default 'pendiente',
  motivo_rechazo     text,
  moderado_por       text references admins(email) on delete set null,
  moderado_en        timestamptz,
  -- Un registro moderado tiene que decir quién y cuándo. Sin esto, un update
  -- a medias deja el estado cambiado y la auditoría vacía.
  constraint chk_moderacion_completa check (
    (estado in ('pendiente'))
    or (moderado_por is not null and moderado_en is not null)
  ),
  -- Rechazar sin motivo no le sirve a nadie: el emprendedor no sabe qué corregir.
  constraint chk_rechazo_con_motivo check (
    estado <> 'rechazado' or motivo_rechazo is not null
  ),

  acepto_terminos    boolean not null check (acepto_terminos),
  acepto_habeas_data boolean not null check (acepto_habeas_data),
  version_terminos   text not null,
  ip_registro        inet,              -- dato personal: declarado en la política Ley 1581

  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now()
);

-- Índice parcial: la vitrina pública solo lee aprobados, y el panel solo
-- pendientes. Indexar sobre el subconjunto es más chico y más rápido.
create index idx_portafolios_vitrina
  on portafolios (creado_en desc) where estado = 'aprobado';

create index idx_portafolios_categoria
  on portafolios (categoria_id, creado_en desc) where estado = 'aprobado';

create index idx_portafolios_moderacion
  on portafolios (creado_en asc) where estado = 'pendiente';

-- ─────────────────────────────────────────────────────────────
-- Rate limiting
-- El endpoint de registro es público, sin auth, y sube archivos de 5 MB a Blob.
-- Sin esto, un script llena el free tier en una tarde y deja el panel de
-- moderación con miles de registros basura.
-- Se usa Postgres en vez de Upstash: cero infraestructura nueva.
-- ─────────────────────────────────────────────────────────────

create table intentos_registro (
  ip        inet not null,
  creado_en timestamptz not null default now()
);

create index idx_intentos_ip_fecha on intentos_registro (ip, creado_en desc);

-- ─────────────────────────────────────────────────────────────
-- Trigger de actualizado_en
-- ─────────────────────────────────────────────────────────────

create or replace function set_actualizado_en()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_portafolios_actualizado
  before update on portafolios
  for each row execute function set_actualizado_en();
