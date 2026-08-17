-- 007 · Interacciones con los aliados
--
-- Para qué: un negocio del barrio no tiene forma de saber si estar en el mapa
-- le sirve. Este contador responde "cuánta gente te miró y cuánta te escribió",
-- que es el argumento concreto para que se registren más.
--
-- Qué NO hace, y es deliberado: no guarda IP, ni cookie, ni identificador de
-- sesión, ni user agent. No se puede saber si dos vistas son de la misma
-- persona, y esa es exactamente la propiedad que hace que esto NO requiera
-- banner de consentimiento bajo Ley 1581 — es un agregado, no un perfil.
-- Ver docs/analitica.md: identificar visitantes recurrentes sería otra
-- finalidad, y esa hay que declararla y consentirla.
--
-- La granularidad es día + tipo. Una fila por negocio por día por tipo: a
-- escala barrial son decenas de filas por día, y permite series temporales
-- sin guardar un evento por interacción.

create table interacciones_portafolio (
  portafolio_id uuid not null references portafolios(id) on delete cascade,
  dia           date not null default current_date,

  -- 'vista'    → abrió la ficha desde el mapa
  -- 'contacto' → tocó un WhatsApp, teléfono, correo o red social
  -- La distinción es la que importa: mirar es ruido, escribir es señal.
  tipo          text not null check (tipo in ('vista', 'contacto')),

  conteo        int not null default 0 check (conteo >= 0),

  primary key (portafolio_id, dia, tipo)
);

-- El ranking "más vistos" ordena por conteo dentro de un rango de días.
create index idx_interacciones_dia on interacciones_portafolio (dia desc, tipo);
