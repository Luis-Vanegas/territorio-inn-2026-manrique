-- 033 · Firmamento: entidades, barrios oficiales, convocatorias por FK, bitácora
--
-- Diseño completo y hallazgos de producción en docs/base-de-datos.md (§3 y §4).
-- Va en el MISMO cambio que el código que la acompaña: borra columnas
-- (`portafolios.constelacion`, `convocatorias.entidad`, `convocatorias.aplica_a`)
-- que el código anterior leía. Aplicar esta migración sin desplegar ese código
-- tumba «Para ti», el panel de convocatorias y la ingesta del vigía.
--
--  A. entidades + miembros_entidad: quién entra al panel de entidad y quién
--     publica convocatorias, en UNA tabla.
--  B. barrios: catálogo de los 15 oficiales; FK de portafolios.barrio_oficial.
--     Se borra portafolios.constelacion (H2: se calcula al vuelo).
--  D. convocatorias: entidad por FK, categorías por tabla puente, tema,
--     origen y formalidad. La tabla está vacía (H4): se rehace sin migrar datos.
--  E. sugerencias_categoria.portafolio_id: para poder reentrenar (H6).
--  F. bitacora: qué cambió, quién y sobre qué (H7).
--  G. candidatos.moderado_por con on update cascade como las otras FK a admins (H8).

-- ── A · Entidades ───────────────────────────────────────────

-- Una sola tabla para las dos caras de una entidad: la que entra a Firmamento
-- (JAL, CEDEZO, CVS) y la que publica convocatorias (SENA, Bancóldex…). Lo que
-- da acceso NO es el tipo: es tener una fila en miembros_entidad. Si mañana el
-- SENA quiere proponer convocatorias desde el panel, se le agrega un miembro y
-- listo, sin cambiarle el tipo.
create table entidades (
  id      uuid primary key default gen_random_uuid(),
  -- Única: el vigía resuelve `entidad_id` por nombre (ver convocatorias.repo.ts).
  nombre  text not null unique check (char_length(nombre) between 2 and 120),
  tipo    text not null check (tipo in ('territorial', 'oferente')),
  sitio   text check (sitio is null or sitio ~ '^https?://'),
  -- Se desactiva, no se borra: sus convocatorias viejas la siguen nombrando.
  activa  boolean not null default true
);

-- La entidad entra con Google (sesion_usuario) y la autoriza esta fila, no un
-- rol dentro de la cookie: así sigue habiendo dos poblaciones y dos cookies
-- (AGENTS.md). on delete cascade desde usuarios: borrar la cuenta le quita el
-- acceso, que es justo lo que se quiere.
create table miembros_entidad (
  usuario_id   uuid not null references usuarios(id) on delete cascade,
  entidad_id   uuid not null references entidades(id) on delete cascade,
  agregado_por text references admins(email) on update cascade on delete set null,
  creado_en    timestamptz not null default now(),
  primary key (usuario_id, entidad_id)
);

-- La pk empieza por usuario_id (la consulta caliente: «¿de qué entidades es
-- esta sesión?»). El panel del equipo lista miembros por entidad: otro índice.
create index idx_miembros_entidad_entidad on miembros_entidad (entidad_id);

insert into entidades (nombre, tipo, sitio) values
  -- Territoriales: las que entran a mirar el observatorio de la comuna.
  ('JAL Comuna 3 – Manrique', 'territorial', null),
  ('CEDEZO Manrique', 'territorial', null),
  ('Centro del Valle del Software Manrique', 'territorial', null),
  -- Oferentes: las que publica el vigía. «Fondo Emprender (SENA)» tiene que ser
  -- idéntico al campo `entidad` de pipeline/fuentes_convocatorias.json: es por
  -- nombre que la ingesta encuentra la fila. La Cámara va con su nombre oficial,
  -- el mismo de lib/formalizacion.ts.
  ('Fondo Emprender (SENA)', 'oferente', 'https://www.fondoemprender.com'),
  ('Bancóldex', 'oferente', 'https://www.bancoldex.com'),
  ('Ruta N', 'oferente', 'https://www.rutanmedellin.org'),
  ('Cámara de Comercio de Medellín para Antioquia', 'oferente', 'https://www.camaramedellin.com.co'),
  ('SENA', 'oferente', 'https://www.sena.edu.co'),
  ('iNNpulsa Colombia', 'oferente', 'https://www.innpulsacolombia.com');

-- ── B · Barrios oficiales ───────────────────────────────────

-- Los 15 de lib/geo/barrios-manrique.json (Alcaldía de Medellín). El nombre es
-- la llave: es lo que ya guardan las filas y lo que muestra la interfaz. Un id
-- numérico obligaría a un join en cada lectura para mostrar lo mismo.
create table barrios (
  nombre text primary key
);

-- Grafía exacta de BARRIOS_COMUNA_3 (lib/geo/constantes.ts) y de barrioDe():
-- si difiere en una tilde, la FK rechaza el relleno.
insert into barrios (nombre) values
  ('El Raizal'),
  ('El Pomar'),
  ('La Salle'),
  ('Las Granjas'),
  ('Santa Inés'),
  ('Campo Valdés No. 2'),
  ('San José de la Cima No. 1'),
  ('San José de la Cima No. 2'),
  ('La Cruz'),
  ('Oriente'),
  ('Versalles No. 1'),
  ('Versalles No. 2'),
  ('Manrique Oriental'),
  ('Manrique Central No. 2'),
  ('María Cano - Carambolas');

-- Solo el oficial lleva FK: `barrio` es lo que la persona DICE (el selector
-- ofrece «Otro» con texto libre, lib/geo/constantes.ts) y `barrio_oficial` es lo
-- que dice el punto. Los tableros por barrio usan el oficial. Hoy está en NULL
-- en todas las filas (H1): la FK entra sin conflicto y el relleno lo hace
-- scripts/rellenar-barrio-oficial.mjs, porque el polígono vive en JSON y no en SQL.
--
-- `constelacion` se va: nadie la escribió nunca (H2) y un id guardado quedaría
-- colgando cada vez que el pipeline regenera constelaciones.json.
alter table portafolios
  add constraint portafolios_barrio_oficial_fkey
    foreign key (barrio_oficial) references barrios(nombre) on update cascade,
  drop column constelacion;

comment on column portafolios.barrio_oficial is
  'Barrio oficial calculado por punto-en-polígono (barrioDe, lib/geo/barrioOficial.ts) al registrar y al editar. NULL = el punto cae fuera de los 15 barrios. `barrio` es lo que escribió la persona.';

-- ── D · Convocatorias (tabla vacía: se rehace sin migrar datos) ──

-- `entidad` era texto libre: «SENA», «Sena» y «Servicio Nacional de
-- Aprendizaje» eran tres entidades. `aplica_a` era un arreglo de ids sin FK: una
-- categoría borrada dejaba ids colgando sin que nada avisara. Las dos se
-- reemplazan por llaves de verdad.
alter table convocatorias
  drop column entidad,
  drop column aplica_a,
  add column entidad_id uuid not null references entidades(id),
  add column tema text check (tema is null or char_length(tema) between 2 and 80),
  -- Quién la trajo: el vigía (scraping), una entidad desde su panel o el equipo a mano.
  add column origen text not null default 'vigia'
    check (origen in ('vigia', 'entidad', 'equipo')),
  add column propuesta_por uuid references usuarios(id) on delete set null,
  -- Vacío = cualquier formalidad; mismos valores que aliados_investigacion.formalidad.
  -- Un arreglo y no tabla puente: son 4 valores fijos de un CHECK, no un catálogo.
  add column aplica_formalidad text[] not null default '{}'
    check (aplica_formalidad <@ array['rut_camara', 'en_tramite', 'no_tengo', 'prefiero_no_decir']::text[]),
  -- Lo que propone una entidad tiene que poder rastrearse a la persona que lo propuso.
  add constraint chk_convocatoria_propuesta
    check (origen <> 'entidad' or propuesta_por is not null);

create index idx_convocatorias_entidad on convocatorias (entidad_id);

-- Ninguna fila = aplica a todas las categorías. Así «para todos» no necesita
-- listar las 30 categorías (y no se queda corto cuando se agrega una).
create table convocatoria_categorias (
  convocatoria_id uuid not null references convocatorias(id) on delete cascade,
  categoria_id    text not null references categorias(id),
  primary key (convocatoria_id, categoria_id)
);

-- «Para ti» busca por categoría del negocio.
create index idx_convocatoria_categorias_categoria on convocatoria_categorias (categoria_id);

-- ── E · Sugeridor ───────────────────────────────────────────

-- Para reentrenar: nombre (de la ficha) + categoría final (la de la ficha,
-- después de las correcciones del equipo). El texto sigue sin guardarse aquí.
-- Esto cambia la decisión de la 032 (sin vínculo al negocio): sin él, «cada
-- corrección reentrena» (asesoría §7) es imposible. La fila sigue siendo
-- privada (nunca se publica) y on delete set null: borrar el negocio no borra
-- la telemetría, solo el vínculo.
alter table sugerencias_categoria
  add column portafolio_id uuid references portafolios(id) on delete set null;

create index idx_sugerencias_categoria_portafolio on sugerencias_categoria (portafolio_id)
  where portafolio_id is not null;

-- ── F · Bitácora ────────────────────────────────────────────

-- Qué pasó, quién y sobre qué. Guarda NOMBRES de campos cambiados, nunca
-- valores: si guardara el WhatsApp viejo, duplicaría datos personales y
-- borrarlo de la ficha no lo borraría de verdad.
create table bitacora (
  id              bigint generated always as identity primary key,
  creado_en       timestamptz not null default now(),
  actor_tipo      text not null check (actor_tipo in ('negocio', 'equipo', 'entidad', 'sistema')),
  -- Email del equipo o id de usuario; null = sistema o dueño por enlace (token),
  -- que no tiene otra identidad que el enlace.
  actor           text,
  -- 'registrado', 'ficha_editada', 'aprobado', 'rechazado', 'archivado',
  -- 'categoria_corregida', 'convocatoria_aprobada'… Sin lista cerrada a propósito:
  -- cada acción nueva sería una migración, y es una etiqueta de lectura, no una regla.
  accion          text not null check (char_length(accion) between 2 and 60),
  portafolio_id   uuid references portafolios(id) on delete cascade,
  convocatoria_id uuid references convocatorias(id) on delete cascade,
  campos          text[] not null default '{}'
);

create index idx_bitacora_portafolio on bitacora (portafolio_id, creado_en desc);
create index idx_bitacora_creado on bitacora (creado_en desc);

-- ── G · Consistencia ────────────────────────────────────────

-- Las otras 4 FK a admins(email) tienen on update cascade; esta no (H8). Sin
-- él, cambiarle el correo a un moderador falla si alguna vez revisó un candidato.
alter table candidatos
  drop constraint candidatos_moderado_por_fkey,
  add constraint candidatos_moderado_por_fkey
    foreign key (moderado_por) references admins(email) on update cascade on delete set null;
