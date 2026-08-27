-- 025 · Módulo Empleo: personas de Manrique que buscan trabajo
--
-- Vitrina pública mínima a propósito, distinta al criterio de Servicios: acá
-- no hay separación público/privado ni tabla de caracterización aparte,
-- porque quien busca trabajo QUIERE que lo encuentren — todo lo que se pide
-- es exactamente lo que se publica. Sin foto, sin mapa, sin dirección.

create table candidatos (
  id                 uuid primary key default gen_random_uuid(),

  nombre             text not null check (char_length(nombre) between 2 and 80),
  telefono           text not null check (char_length(telefono) between 7 and 20),

  nivel_formacion    text not null check (nivel_formacion in (
    'universitaria', 'tecnologica', 'tecnica', 'tecnico_sena', 'bachiller', 'ninguna'
  )),
  -- Solo aplica cuando nivel_formacion no es 'bachiller' ni 'ninguna' — la
  -- persona sin estudios superiores no tiene un programa que nombrar.
  programa           text check (programa is null or char_length(programa) <= 100),
  -- null cuando nivel_formacion no aplica: no es "no contestó", es que la
  -- pregunta no tiene sentido para esa persona.
  graduado           boolean,

  experiencia        text not null check (char_length(experiencia) between 10 and 400),
  busca              text not null check (char_length(busca) between 5 and 200),

  -- ── Consentimiento (Ley 1581) ──────────────────────────────
  acepto_terminos    boolean not null check (acepto_terminos),
  acepto_habeas_data boolean not null check (acepto_habeas_data),
  version_terminos   text not null,

  -- ── Moderación (mismo contrato que portafolios y servicios) ─
  estado             portafolio_estado not null default 'pendiente',
  motivo_rechazo     text,
  moderado_por       text references admins(email) on delete set null,
  moderado_en        timestamptz,
  constraint chk_candidato_moderacion_completa check (
    estado in ('pendiente')
    or (moderado_por is not null and moderado_en is not null)
  ),
  constraint chk_candidato_rechazo_con_motivo check (
    estado <> 'rechazado' or motivo_rechazo is not null
  ),

  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now()
);

create index idx_candidatos_aprobados
  on candidatos (creado_en desc)
  where estado = 'aprobado';

create index idx_candidatos_pendientes
  on candidatos (creado_en)
  where estado = 'pendiente';
