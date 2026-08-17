-- 011 · Registro inmutable de consentimiento
--
-- Para qué: `portafolios` ya guarda acepto_terminos / acepto_habeas_data /
-- version_terminos / ip_registro (migración 001), pero son columnas que un
-- update puede pisar — y la Fase D agrega edición propia por token público,
-- así que un registro va a poder cambiar después de creado. El respaldo legal
-- de "hubo autorización expresa" (Ley 1581, Decreto 1377) tiene que sobrevivir
-- a esas ediciones: de ahí una fila aparte, que nunca se actualiza, solo se
-- inserta. No reemplaza las columnas de portafolios en esta migración —eso es
-- decisión de la Fase C, cuando el server action empiece a escribir acá—, hoy
-- solo se crea la tabla.
--
-- ip_hash en vez de ip_registro: acá si se hashea desde el día uno porque es
-- una tabla nueva, sin datos históricos que preservar en claro. El hash no es
-- reversible, pero sigue sirviendo para detectar "esta IP mandó 40 consentimientos
-- hoy" sin guardar la IP en sí.

create table aliados_consentimiento (
  id                uuid primary key default gen_random_uuid(),
  portafolio_id     uuid not null references portafolios(id) on delete cascade,

  acepto_terminos    boolean not null,
  acepto_habeas_data boolean not null,
  version_politica   text not null,

  ip_hash           text,
  user_agent        text check (char_length(user_agent) <= 300),

  creado_en         timestamptz not null default now()
);

-- Por portafolio, la más reciente primero: es como se va a consultar para
-- mostrar "aceptaste la versión X el [fecha]" en /aliados/estado/[token].
create index idx_consentimiento_portafolio on aliados_consentimiento (portafolio_id, creado_en desc);
