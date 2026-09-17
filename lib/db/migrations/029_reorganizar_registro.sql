-- 029 · Reorganización del registro: productos, menú, y recorte de investigación
--
-- Para qué: el formulario público se reordena (dirección y barrio primero,
-- categoría pasa a opcional a nivel app, se agregan productos y menú) y la
-- sección "para el proyecto de investigación" se recorta a los dos campos
-- que de verdad alimentan código vivo: `formalidad` personaliza
-- /formalizacion (lib/formalizacion.ts, pasosPara()) y `mayor_dolor` es
-- contexto del asesor de IA (lib/agente/asesor.ts). El resto —nombre del
-- dueño, el tipo_negocio viejo (emprendimiento/micronegocio/local/otro),
-- necesidad_crecer— no tiene ningún consumidor fuera de esta sección: se
-- borra la columna en vez de dejarla muerta.
--
-- `aliados_investigacion` NO se borra entera: tiene datos reales de
-- negocios ya registrados. Solo se angostan las columnas que quedaron sin
-- ningún uso. `mayor_dolor_otro` se deja igual que decidió la migración
-- 019 — cero filas la tienen, pero ya está documentado que no vale la pena
-- tocar producción para borrar una columna vacía.
--
-- `categoria_id` NO se vuelve nullable: la app la trata como opcional
-- cayendo a la categoría 'otros' que ya existe desde la 001 cuando queda en
-- blanco (ver desdeFormData en portafolio.schema.ts) — evita tocar los JOIN
-- de todas las lecturas públicas para un campo que ya tenía una categoría
-- "sin especificar" hecha.

alter table aliados_investigacion
  drop column nombre_dueno,
  drop column tipo_negocio,
  drop column tipo_negocio_detalle,
  drop column necesidad_crecer;

alter table portafolios
  add column productos jsonb not null default '[]'::jsonb
    check (jsonb_typeof(productos) = 'array'),
  add column menu_url text,
  add column menu_blob_pathname text;
