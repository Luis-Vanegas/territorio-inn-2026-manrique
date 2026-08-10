-- 003 · Campos personalizados del formulario, gestionables desde el admin
--
-- El admin necesita poder agregar, editar y desactivar campos del formulario
-- de registro sin depender de un deploy. La alternativa de dejar que el admin
-- dispare un ALTER TABLE desde la UI queda descartada a propósito: cada campo
-- nuevo sería una migración no versionada, sin rollback, fuera de este
-- directorio — exactamente lo que las migraciones numeradas están para evitar.
--
-- En cambio: una tabla de definiciones (metadata de cada campo) más una
-- columna jsonb en portafolios que guarda los valores. Los campos base
-- (nombre, categoría, dirección...) no se tocan — siguen siendo columnas
-- reales con sus propios CHECK. Esto es solo para lo que el admin agrega.

create type tipo_campo_personalizado as enum ('texto', 'numero', 'si_no', 'seleccion');

create table definiciones_campo (
  id          uuid primary key default gen_random_uuid(),

  -- Identificador estable usado como clave dentro de campos_extra (jsonb).
  -- No cambia aunque se edite la etiqueta visible, para no romper los
  -- registros que ya guardaron un valor bajo esa clave.
  slug        text not null unique check (slug ~ '^[a-z][a-z0-9_]{1,49}$'),

  etiqueta    text not null check (char_length(etiqueta) between 2 and 80),
  tipo        tipo_campo_personalizado not null,

  -- Solo aplica a tipo='seleccion': array de opciones como ["Sí","No","Tal vez"].
  -- CHECK en vez de confiar en la app: si el tipo es selección, tiene que traer
  -- opciones, y si no lo es, no tiene sentido que las traiga.
  opciones    jsonb,
  constraint chk_opciones_segun_tipo check (
    (tipo = 'seleccion' and jsonb_typeof(opciones) = 'array' and jsonb_array_length(opciones) >= 2)
    or (tipo <> 'seleccion' and opciones is null)
  ),

  requerido   boolean not null default false,
  ayuda       text check (char_length(ayuda) <= 200),
  orden       int not null default 0,

  -- Desactivar en vez de borrar: un registro viejo puede tener un valor bajo
  -- este slug, y perder la definición le quita el nombre legible a ese dato.
  activo      boolean not null default true,

  creado_por  text references admins(email) on update cascade on delete set null,
  creado_en   timestamptz not null default now()
);

create index idx_definiciones_campo_activo
  on definiciones_campo (orden) where activo = true;

-- Los valores viven acá. Se valida en la aplicación (Zod, según el tipo de
-- cada definición activa) porque Postgres no puede validar contra un esquema
-- que cambia fila a fila en otra tabla — eso sí sería el trabajo de un CHECK
-- si los campos fueran fijos, pero acá son dinámicos por diseño.
alter table portafolios
  add column campos_extra jsonb not null default '{}'::jsonb;

comment on column portafolios.campos_extra is
  'Valores de los campos definidos en definiciones_campo, por slug. Validados en la aplicación, no en la base — el esquema de estos valores cambia con las definiciones activas.';
