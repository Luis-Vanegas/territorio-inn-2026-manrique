-- 022 · Servicios: fuera la verificación presencial, entra el consentimiento
-- explícito de investigación
--
-- Para qué: la 021 modeló niveles de confianza (0 a 3) que dependían de que
-- alguien del equipo viera la cédula en persona, revisara un certificado de
-- antecedentes o consiguiera el respaldo de una organización. A pedido
-- explícito del usuario, no va a haber verificación presencial: sin nadie que
-- la ejecute, esas columnas solo podían quedarse en cero para siempre, y una
-- insignia que nunca cambia es peor que no tenerla — ocupa lugar y no informa.
--
-- Lo que reemplaza a esa señal es una autorización específica, que la persona
-- da con un acto explícito antes de enviar el formulario: sabe qué datos
-- entrega, para qué se usan, y con qué límites. Eso sí es verdad y sí se puede
-- mostrar.
--
-- Ninguna fila real usó todavía las columnas que se borran (el módulo está
-- apagado por NEXT_PUBLIC_MODULO_SERVICIOS), así que no hay backfill.

alter table servicios
  drop constraint if exists chk_servicio_verificacion_trazable;

alter table servicios
  drop column if exists nivel_verificacion,
  drop column if exists verificado_por,
  drop column if exists verificado_en,
  drop column if exists antecedentes_revisado_en,
  drop column if exists respaldado_por;

-- Autorización específica para el uso en investigación. Es `not null` con
-- CHECK y no un booleano cualquiera: sin este consentimiento no hay registro,
-- porque sin él el proyecto no podría guardar la caracterización laboral que
-- vive en `servicios_privado`.
--
-- Declara, y el texto del formulario dice exactamente esto:
--   · los datos se usan para la investigación del proyecto
--   · no se usan para ninguna otra finalidad
--   · no se comparten con terceros
--   · no se venden
alter table servicios
  add column acepto_investigacion boolean not null default true
    check (acepto_investigacion);

-- El default existía solo para poder agregar la columna sobre filas previas.
-- Se saca para que cada insert futuro tenga que declararlo a propósito: un
-- consentimiento que se completa solo no es un consentimiento.
alter table servicios
  alter column acepto_investigacion drop default;
