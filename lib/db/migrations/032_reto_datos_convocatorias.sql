-- 032 · Reto #2: territorio, campos públicos, sugeridor, convocatorias, IP
--
-- Cinco cambios con esquema (y uno sin él) que van juntos porque salen del mismo plan
-- (docs/plan-reto-2026-10.md, Fase 2) y ninguno depende de datos nuevos:
--
--  1. portafolios.barrio_oficial y portafolios.constelacion: el territorio
--     como dato, no como texto libre. Quedan NULL: no hay geometría de barrios
--     en el repo para calcular el barrio por punto-en-polígono, y las
--     constelaciones se asignan cuando exista el cruce con constelaciones.json.
--     Nada las lee todavía.
--  2. definiciones_campo.publico: un campo personalizado solo se publica si el
--     moderador lo marca. Default false = cerrado: los campos que ya existen
--     dejan de verse en la vitrina hasta que alguien los marque a propósito.
--  3. sugerencias_categoria: qué sugirió el modelo y si la persona lo aceptó.
--     Guarda la CATEGORÍA inferida, NUNCA el texto que se escribió (puede ser el
--     nombre de un negocio o una búsqueda: es dato de la persona).
--  4. convocatorias: oferta institucional que detecta el vigía. Todo entra
--     `pendiente`; un moderador decide, y solo las `aprobada` se muestran.
--  5. Rate limit: `datos` (GET /api/datos) e `ingesta` (secretos fallidos del vigía)
--     como orígenes nuevos de intentos_registro.
--  6. IP: sin columnas nuevas. El hash ya existe (aliados_consentimiento.ip_hash,
--     011) y `ip_registro` se anula a los 30 días desde el cron (rateLimit.ts,
--     purgarIpsViejas): no hace falta tocar el esquema.

-- ── 1 · Territorio ──────────────────────────────────────────

alter table portafolios
  add column barrio_oficial text,
  add column constelacion   text;

comment on column portafolios.barrio_oficial is
  'Barrio oficial (Decreto 346 de 2000) calculado por punto-en-polígono. NULL mientras no haya geometría de barrios. `barrio` es lo que escribió la persona.';
comment on column portafolios.constelacion is
  'Id de la constelación (public/firmamento/constelaciones.json) a la que pertenece el negocio. NULL = sin asignar.';

-- ── 2 · Campos personalizados públicos ──────────────────────

alter table definiciones_campo
  add column publico boolean not null default false;

comment on column definiciones_campo.publico is
  'true = el valor de este campo sale en la vitrina pública. false (default) = solo lo ven el dueño y el panel.';

-- ── 3 · Sugeridor de categoría ──────────────────────────────

create table sugerencias_categoria (
  id                 uuid primary key default gen_random_uuid(),
  -- Sin FK a categorias: el modelo puede sugerir una clase que el sitio
  -- desactive después, y la fila histórica no debe bloquear ese cambio.
  categoria_inferida text not null check (char_length(categoria_inferida) between 1 and 60),
  confianza          numeric(4, 3) not null check (confianza between 0 and 1),
  origen             text not null default 'registro'
                     check (origen in ('registro', 'busqueda')),
  -- null = no respondió; true = usó la sugerida; false = eligió otra.
  aceptada           boolean,
  creado_en          timestamptz not null default now()
);

create index idx_sugerencias_categoria_creado on sugerencias_categoria (creado_en);

-- ── 4 · Convocatorias ───────────────────────────────────────

create table convocatorias (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null check (char_length(titulo) between 3 and 200),
  entidad        text not null check (char_length(entidad) between 2 and 120),
  -- Única: el vigía corre todos los días y la misma convocatoria no se duplica.
  url            text not null unique check (url ~ '^https?://'),
  resumen        text check (resumen is null or char_length(resumen) <= 600),
  fecha_cierre   date,
  -- Ids de categorias a las que aplica; vacío = a todos los negocios.
  aplica_a       text[] not null default '{}',
  estado         text not null default 'pendiente'
                 check (estado in ('pendiente', 'aprobada', 'descartada', 'vencida')),
  fuente         text not null check (char_length(fuente) between 2 and 120),
  detectada_en   timestamptz not null default now(),
  revisada_por   text references admins (email) on update cascade on delete set null,
  revisada_en    timestamptz,
  -- Aprobar o descartar es una decisión humana y deja huella. `vencida` la
  -- puede poner el sistema solo, por eso no exige moderador.
  constraint chk_convocatoria_revisada check (
    estado in ('pendiente', 'vencida') or revisada_en is not null
  )
);

create index idx_convocatorias_estado on convocatorias (estado, fecha_cierre);

-- ── 5 · Rate limit de /api/datos y /api/ingesta ─────────────

-- Mismo patrón que la 017, 026 y 030: se recrea el CHECK con el valor nuevo.
alter table intentos_registro
  drop constraint intentos_registro_origen_check;

alter table intentos_registro
  add constraint intentos_registro_origen_check
  check (origen in ('registro', 'login', 'estado', 'agente', 'geocodificar', 'datos', 'ingesta'));
