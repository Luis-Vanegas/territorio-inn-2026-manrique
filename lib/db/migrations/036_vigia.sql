-- 036 · Vigía vivo: rastro de cada corrida y de cada fuente
--
-- Solo aditiva. El vigía (pipeline/04_vigia_convocatorias.py) manda UN informe por
-- corrida a POST /api/ingesta/vigia; esto es donde queda. Sin datos personales:
-- solo URLs de páginas públicas de entidades, estados y conteos.
--
--  1. vigia_corridas: una fila por corrida (cuándo, quién la lanzó, totales).
--  2. vigia_fuentes_estado: una fila por fuente y corrida. La huella es el sha256
--     de los enlaces de la página (no del HTML crudo, que trae tokens que cambian
--     solos); comparar con la huella anterior de la MISMA fuente dice si cambió.
--     Esa comparación la hace el repo al escribir, para que el pipeline no
--     tenga que guardar estado (un runner de Actions nace limpio cada día).

create table vigia_corridas (
  id            uuid primary key default gen_random_uuid(),
  iniciada_en   timestamptz not null,
  terminada_en  timestamptz not null,
  recibida_en   timestamptz not null default now(),
  -- 'actions' = el workflow diario; 'manual' = alguien la lanzó a mano.
  origen        text not null check (origen in ('actions', 'manual')),
  total_fuentes integer not null check (total_fuentes between 1 and 50),
  total_nuevas  integer not null check (total_nuevas >= 0),

  constraint chk_vigia_corrida_orden check (terminada_en >= iniciada_en)
);

create index vigia_corridas_iniciada_idx on vigia_corridas (iniciada_en desc);

create table vigia_fuentes_estado (
  id          uuid primary key default gen_random_uuid(),
  corrida_id  uuid not null references vigia_corridas(id) on delete cascade,
  -- Slug de `id` en pipeline/fuentes_convocatorias.json: estable aunque cambie el nombre.
  fuente_id   text not null check (fuente_id ~ '^[a-z0-9][a-z0-9-]{1,59}$'),
  -- Por nombre, sin crearla: null si la entidad aún no existe (no hay candidatas que la creen).
  entidad_id  uuid references entidades(id) on delete set null,
  url         text not null check (char_length(url) <= 500 and url ~ '^https?://'),
  -- responde = respondió y es la primera huella de la fuente; cambio / sin_cambio =
  -- respondió y se comparó con la última huella guardada.
  estado      text not null check (estado in
                ('responde', 'cambio', 'sin_cambio', 'error_http', 'timeout', 'bloqueada_robots')),
  -- null cuando no hubo respuesta HTTP (timeout, DNS, robots.txt).
  http_status integer check (http_status is null or http_status between 100 and 599),
  huella      text check (huella is null or huella ~ '^[0-9a-f]{64}$'),
  candidatas  integer not null check (candidatas between 0 and 1000),
  nuevas      integer not null check (nuevas >= 0),
  error       text check (error is null or char_length(error) between 1 and 200),

  constraint uq_vigia_fuente_corrida unique (corrida_id, fuente_id),
  constraint chk_vigia_nuevas check (nuevas <= candidatas),
  -- Hay huella si y solo si la página se leyó.
  constraint chk_vigia_huella check (
    (estado in ('responde', 'cambio', 'sin_cambio')) = (huella is not null)
  ),
  -- Cuando algo falla, queda dicho qué.
  constraint chk_vigia_error check (
    estado in ('responde', 'cambio', 'sin_cambio') or error is not null
  ),
  -- Una página que no se leyó no aporta candidatas.
  constraint chk_vigia_sin_lectura check (
    estado in ('responde', 'cambio', 'sin_cambio') or (candidatas = 0 and nuevas = 0)
  )
);

-- La última huella de una fuente se busca por fuente_id; la lista de una corrida, por corrida_id
-- (cubierto por el unique).
create index vigia_fuentes_estado_fuente_idx on vigia_fuentes_estado (fuente_id)
  where huella is not null;

comment on table vigia_corridas is
  'Una corrida del vigía de convocatorias. La escribe POST /api/ingesta/vigia (secreto de máquina).';
comment on column vigia_fuentes_estado.huella is
  'sha256 hex de los enlaces (texto + destino) de la página, ordenados. Si cambia, la página cambió.';
