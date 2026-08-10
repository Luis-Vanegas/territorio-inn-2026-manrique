-- 005 · Buzón de peticiones
--
-- Canal para que cualquiera le escriba una solicitud o un caso puntual al
-- equipo, sin exponer un login público ni webhooks externos: la persona llena
-- un formulario corto, el admin lo revisa en /admin/peticiones y responde por
-- fuera (WhatsApp, correo) con el contacto que dejó.
--
-- No es chat en tiempo real a propósito: para un equipo de tres personas,
-- websockets + estado de conexión es infraestructura que nadie va a operar.
-- Un buzón que se revisa es lo que el caso de uso pide.

create type peticion_estado as enum ('nueva', 'atendida');

create table peticiones (
  id        uuid primary key default gen_random_uuid(),

  nombre    text not null check (char_length(nombre) between 2 and 80),
  -- Correo, teléfono o usuario de WhatsApp — texto libre a propósito: no hay
  -- forma de saber de antemano qué medio va a dejar la persona.
  contacto  text not null check (char_length(contacto) between 3 and 120),
  mensaje   text not null check (char_length(mensaje) between 10 and 1000),

  estado       peticion_estado not null default 'nueva',
  atendido_por text references admins(email)
    on update cascade   -- mismo criterio que portafolios.moderado_por
    on delete restrict,
  atendido_en  timestamptz,
  constraint chk_atencion_completa check (
    (estado = 'nueva') or (atendido_por is not null and atendido_en is not null)
  ),

  ip_registro inet,      -- dato personal: mismo criterio que portafolios.ip_registro
  creado_en   timestamptz not null default now()
);

-- El panel solo lista 'nueva' por defecto: indexar sobre ese subconjunto
-- alcanza para el volumen de un buzón de tres personas.
create index idx_peticiones_nuevas
  on peticiones (creado_en asc) where estado = 'nueva';
