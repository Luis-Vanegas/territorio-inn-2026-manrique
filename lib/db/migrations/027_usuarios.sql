-- 027 · Cuentas de usuario: el negocio deja de ser anónimo
--
-- Para qué: hasta hoy un negocio se identifica solo con `token_publico`, un
-- enlace sin dueño. Eso alcanza para corregir una dirección, pero no para lo
-- que sigue: contenido que solo ven los registrados, saber quién está adentro,
-- y que la persona vuelva sin depender de un mensaje de WhatsApp de hace meses.
--
-- ── Una tabla, dos puertas ──
--
-- Quien entra con Google y quien registramos en campo son la MISMA ficha de
-- negocio. La única diferencia es cómo llegó: por eso `origen_registro` es una
-- columna de `portafolios` y no una tabla aparte. Duplicar el modelo para
-- distinguir "aliado" de "local" obligaría a escribir dos veces cada consulta
-- de la vitrina, del buscador y del panel, para una diferencia que cabe en un
-- enum.
--
-- El token NO se va. Sigue siendo la credencial de quien no tiene cuenta —
-- la persona mayor que registramos en campo entra por su enlace, sin
-- contraseña y sin correo. Las dos puertas conviven: `usuario_id` nulo
-- significa "todavía nadie reclamó este negocio con una cuenta".

create table usuarios (
  id            uuid primary key default gen_random_uuid(),

  -- El `sub` de Google: su identificador estable de usuario. Se usa como
  -- llave y no el correo, porque una persona puede cambiar el correo de su
  -- cuenta de Google y seguir siendo la misma. Nullable para dejar abierta
  -- una segunda forma de ingreso (correo + contraseña) sin otra migración.
  google_sub    text unique,

  -- citext sería lo correcto, pero es una extensión más para normalizar algo
  -- que la aplicación ya baja a minúsculas antes de escribir. El índice único
  -- es el que garantiza que no haya dos cuentas con el mismo correo.
  correo        text not null unique,
  nombre        text not null check (char_length(nombre) between 1 and 120),
  foto_url      text,

  -- Para el panel de administración: cuántos entraron y quién sigue activo.
  creado_en     timestamptz not null default now(),
  ultimo_acceso timestamptz not null default now()
);

-- El login busca por google_sub en cada entrada; sin índice es un scan de la
-- tabla entera en el camino más caliente que tiene la autenticación.
create index idx_usuarios_google_sub on usuarios (google_sub) where google_sub is not null;

alter table portafolios
  -- on delete set null y no cascade: si algún día se borra una cuenta, el
  -- negocio NO desaparece del directorio. La ficha es del negocio, no de la
  -- cuenta que lo reclamó, y borrar un usuario no puede vaciar la vitrina.
  add column usuario_id uuid references usuarios(id) on delete set null,

  -- 'propio'   — la persona se registró sola desde el sitio
  -- 'asistido' — lo registró el equipo en campo, con la persona presente
  add column origen_registro text not null default 'propio'
    check (origen_registro in ('propio', 'asistido')),

  -- Quién del equipo lo capturó. Solo para 'asistido'.
  add column capturado_por text,

  -- ── Esto NO es burocracia: es la Ley 1581 de 2012 ──
  --
  -- El consentimiento lo da el titular, no quien llena el formulario. Cuando
  -- el equipo registra a alguien en campo, el checkbox lo tilda el equipo
  -- desde su propio equipo y con su propia IP: `aliados_consentimiento` queda
  -- registrando una autorización que, leída sola, parece nuestra y no de la
  -- persona.
  --
  -- Esta columna guarda CÓMO lo autorizó de verdad: 'verbal_presencial' o
  -- 'firma_papel'. Sin esto no hay forma de demostrar que doña Marta dijo que
  -- sí, y "lo tildamos nosotros" no es una defensa.
  add column consentimiento_asistido text
    check (consentimiento_asistido in ('verbal_presencial', 'firma_papel'));

-- Un registro asistido sin constancia de cómo se autorizó es justamente el
-- caso que la columna existe para evitar. La restricción lo vuelve imposible
-- en vez de confiar en que la aplicación se acuerde.
--
-- ── Sobre el nombre, que ya falló una vez ──
--
-- NO se puede llamar `portafolios_consentimiento_asistido_check`. Postgres le
-- pone ese nombre solo al `check (...)` en línea de la columna
-- `consentimiento_asistido` de arriba: el patrón automático es
-- `<tabla>_<columna>_check`. Usarlo acá choca contra el que la propia
-- migración acaba de crear, y el primer intento murió así.
--
-- Este nombre dice la regla de negocio, no la columna, que además es lo que
-- conviene leer en el mensaje de error cuando la restricción salte.
alter table portafolios
  add constraint portafolios_asistido_exige_constancia
  check (
    origen_registro <> 'asistido'
    or (consentimiento_asistido is not null and capturado_por is not null)
  );

-- "Mis negocios" en el panel del usuario. Parcial porque la enorme mayoría de
-- las filas históricas tienen usuario_id nulo y no hay razón de indexarlas.
create index idx_portafolios_usuario on portafolios (usuario_id)
  where usuario_id is not null;
