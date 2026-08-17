-- 010 · Datos de investigación del proyecto, separados de lo público
--
-- Para qué: el paso 4 del registro (antigüedad, gente que trabaja, si quiere
-- contratar, qué lo frena, etc.) es todo opcional y solo sirve para el estudio
-- estadístico del proyecto — nunca se publica. Va en tabla aparte, no en
-- `campos_extra` de portafolios: son columnas fijas y conocidas de antemano
-- (no configurables desde el admin como sí lo son las de 003), y separarlas
-- deja exportar el dataset de investigación sin arrastrar nombre, contacto
-- ni dirección — sirve tal cual para el CSV anonimizado de la Fase F.
--
-- Una fila por portafolio (primary key = portafolio_id): es la respuesta más
-- reciente, no un historial de respuestas.

create table aliados_investigacion (
  portafolio_id       uuid primary key references portafolios(id) on delete cascade,

  antiguedad           text check (antiguedad in ('menos_1', '1_a_3', 'mas_3')),
  personas_trabajan    text check (personas_trabajan in ('solo_yo', '2_a_3', '4_o_mas')),

  -- Solo tiene sentido si personas_trabajan <> 'solo_yo'. Esa dependencia
  -- entre campos es responsabilidad de Zod (Fase C) — Postgres no puede
  -- validar un campo mirando el valor de otro sin un trigger, y para un
  -- campo opcional de encuesta no vale la complejidad de un trigger.
  tipo_vinculacion     text[] check (tipo_vinculacion <@ array['familiares', 'contratados']::text[]),

  quiere_contratar     text check (quiere_contratar in ('si_pronto', 'si_no_puedo', 'no_por_ahora')),

  -- Solo aplica si quiere_contratar = 'si_no_puedo'. Misma nota que arriba.
  que_lo_frena         text[] check (que_lo_frena <@ array[
                          'sin_plata_nomina', 'no_se_formalizar', 'no_consigo_gente',
                          'no_tengo_demanda', 'otro'
                        ]::text[]),

  -- Máximo 2, y "todo bajo control" es excluyente del resto — quien lo elige
  -- no puede elegir nada más. Esto sí es un CHECK real: es una regla sobre el
  -- valor del campo mismo, no una dependencia entre columnas distintas.
  mayor_dolor          text[] check (
                          mayor_dolor <@ array[
                            'cuentas_ganancia', 'inventario_vencimientos', 'clientes_redes',
                            'cobros_facturas', 'costos_arriendo', 'proveedores',
                            'acceso_credito', 'atender_solo', 'todo_bajo_control'
                          ]::text[]
                          and array_length(mayor_dolor, 1) <= 2
                          and not (
                            'todo_bajo_control' = any(mayor_dolor)
                            and array_length(mayor_dolor, 1) > 1
                          )
                        ),

  herramientas_actuales text[] check (herramientas_actuales <@ array[
                          'cuaderno', 'excel', 'whatsapp_business', 'app_facturacion',
                          'redes_sociales', 'ninguna'
                        ]::text[]),

  formalidad           text check (formalidad in ('rut_camara', 'en_tramite', 'no_tengo', 'prefiero_no_decir')),

  necesidad_crecer     text check (char_length(necesidad_crecer) <= 500),

  actualizado_en       timestamptz not null default now()
);

create trigger trg_aliados_investigacion_actualizado
  before update on aliados_investigacion
  for each row execute function set_actualizado_en();
