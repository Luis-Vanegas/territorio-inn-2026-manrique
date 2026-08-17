-- 009 · Campos de directorio para Aliados: presencia, cobertura, horario,
-- medios de pago, y el token público de seguimiento del registro.
--
-- Para qué: hoy `portafolios` obliga a toda inscripción a tener dirección y
-- barrio, lo que expulsa a quien trabaja desde la casa o va a domicilio —
-- justo la población objetivo. Este cambio no toca `direccion` ni `barrio`
-- (siguen existiendo y `not null`, eso es trabajo de la Fase D, que además
-- cambia el formulario); acá solo se agrega lo nuevo, sin romper filas viejas.
--
-- token_publico es la base de "sé que quedé registrada": un link sin login
-- para ver el estado del registro y corregirlo. Se agrega nullable, se
-- rellena para las filas existentes, y recién ahí se pone not null — así
-- ninguna fila queda sin token.

alter table portafolios
  add column tipo_presencia text
    check (tipo_presencia in ('local_fijo', 'domicilio', 'ambos', 'solo_internet')),

  add column punto_referencia text
    check (char_length(punto_referencia) <= 120),

  -- Barrios cubiertos cuando el negocio va a domicilio. text[] real, no CSV:
  -- así se puede indexar y filtrar sin parsear un string en cada consulta.
  add column cobertura text[],

  add column horario text[]
    check (horario <@ array['mananas', 'tardes', 'noches', 'fines_semana', 'bajo_pedido']::text[]),

  add column medios_pago text[]
    check (medios_pago <@ array['efectivo', 'nequi', 'daviplata', 'transferencia', 'datafono']::text[]),

  add column verificado_en timestamptz,

  add column token_publico uuid;

update portafolios set token_publico = gen_random_uuid() where token_publico is null;

alter table portafolios
  alter column token_publico set not null,
  alter column token_publico set default gen_random_uuid();

create unique index idx_portafolios_token_publico on portafolios (token_publico);

-- Para el filtro por barrio del directorio (Fase E). Mismo patrón parcial que
-- los índices de 001: la vitrina pública solo lee aprobados.
create index idx_portafolios_barrio on portafolios (barrio) where estado = 'aprobado';
