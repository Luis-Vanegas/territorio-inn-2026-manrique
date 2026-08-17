-- 019 · nombre del dueño, "Otro" en mayor_dolor
--
-- Para qué: `tipo_negocio` y `mayor_dolor` pasan a obligatorios (a nivel
-- Zod/servidor, no solo la UI — sección 7.2 de esta vuelta de feedback), así
-- que `aliados_investigacion` siempre va a tener algo en esas dos columnas
-- desde ahora. No hace falta `not null` acá: la fila entera es opcional en
-- el sentido de "puede no existir" (si `guardarInvestigacion` fallara), pero
-- cuando existe, la aplicación ya garantiza esos dos campos.
--
-- `nombre_dueno`: dato personal (no del negocio), por eso va acá y no en
-- `portafolios` — nunca se publica, misma razón que `formalidad`.
--
-- `mayor_dolor_otro`: mismo patrón que `tipo_negocio_detalle` (016) — texto
-- libre para cuando la opción elegida es "otro".

alter table aliados_investigacion
  add column nombre_dueno text check (char_length(nombre_dueno) <= 80),
  add column mayor_dolor_otro text check (char_length(mayor_dolor_otro) <= 200);

alter table aliados_investigacion
  drop constraint aliados_investigacion_mayor_dolor_check;

alter table aliados_investigacion
  add constraint aliados_investigacion_mayor_dolor_check check (
    mayor_dolor <@ array[
      'cuentas_ganancia', 'inventario_vencimientos', 'clientes_redes',
      'cobros_facturas', 'costos_arriendo', 'proveedores',
      'acceso_credito', 'atender_solo', 'todo_bajo_control', 'otro'
    ]::text[]
    and array_length(mayor_dolor, 1) <= 2
    and not (
      'todo_bajo_control' = any(mayor_dolor)
      and array_length(mayor_dolor, 1) > 1
    )
  );
