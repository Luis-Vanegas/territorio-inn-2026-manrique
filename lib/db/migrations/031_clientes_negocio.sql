-- 031 · Mis clientes: un CRM mínimo para que cada aliado siga a SUS clientes
--
-- Para qué: la guía de Ventas enseña a hacer seguimiento («espera un tiempo
-- razonable, escribe corto y amable»). Esto le da al negocio dónde anotar a
-- quién y cuándo volver a escribirle.
--
-- ── Datos de terceros (Ley 1581) ──
-- Estas filas son de personas que NO se registraron en Constelaciones: los
-- clientes del negocio. El negocio es el responsable de esos datos y nosotros
-- el encargado. Por eso lo mínimo: nombre, un teléfono y una nota. Nada de
-- cédula, dirección ni correo. `on delete cascade`: si se borra el negocio,
-- se borran sus clientes.
--
-- El dueño se resuelve por `portafolios.usuario_id`: no hay columna de
-- usuario acá, así que no hay forma de que queden desincronizados. Todo
-- acceso pasa por lib/db/clientes.repo.ts, que filtra por esa columna.

create table clientes_negocio (
  id                uuid primary key default gen_random_uuid(),
  portafolio_id     uuid not null references portafolios (id) on delete cascade,
  nombre            text not null check (char_length(nombre) between 1 and 80),
  telefono          text check (telefono is null or char_length(telefono) <= 20),
  nota              text check (nota is null or char_length(nota) <= 500),
  -- El recorrido de la guía Vende mejor: alguien pregunta, se le hace
  -- seguimiento, y compra o no.
  etapa             text not null default 'interesado'
                    check (etapa in ('interesado', 'seguimiento', 'compro', 'no_compro')),
  proximo_contacto  date,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

-- La pantalla lista los clientes de un negocio ordenados por cuándo toca
-- escribirles.
create index idx_clientes_negocio_portafolio
  on clientes_negocio (portafolio_id, proximo_contacto);
