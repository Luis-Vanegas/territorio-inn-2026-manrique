-- 021 · Módulo Servicios: personas que prestan servicios y se desplazan
--
-- Por qué una tabla nueva y no una fila más en `portafolios`:
-- `portafolios` es, por definición del esquema, una tabla de PUNTOS FÍSICOS
-- (direccion, barrio, latitud, longitud son `not null` desde la 014). Un
-- emprendimiento está quieto y quiere que la gente llegue; un servicio se
-- mueve y va a la casa del cliente.
--
-- Ya se intentó fusionarlos: la 009 agregó `tipo_presencia` y `cobertura`, la
-- 013 hizo nullable la ubicación para que entraran, y la 014 revirtió todo
-- tras probarlo en vivo. No se repite ese camino.
--
-- Y hay una razón más fuerte que la geometría: la dirección de un negocio es
-- su fachada, pública a propósito. La de quien presta servicios es SU CASA.
-- Acá no existen columnas de ubicación — que no existan es la garantía, no
-- una promesa en la política. Mismo criterio que docs/analitica.md.

-- ─────────────────────────────────────────────────────────────
-- Público: lo que ve el vecino que necesita el servicio
-- ─────────────────────────────────────────────────────────────

create table servicios (
  id                 uuid primary key default gen_random_uuid(),

  -- Quien entra a una casa ajena no puede ser anónimo. El nombre es el único
  -- dato identificatorio que se publica, y se publica a propósito.
  nombre             text not null check (char_length(nombre) between 2 and 80),

  -- Misma taxonomía de oficios que los negocios (migración 012). Compartirla
  -- es lo que permite que una sola búsqueda devuelva las dos cosas: quien
  -- busca "quién me arregla la nevera" no sabe ni le importa si eso es un
  -- local o una persona que va a domicilio.
  categoria_id       text not null references categorias(id),
  categoria_otra     text check (char_length(categoria_otra) <= 60),

  -- "Reparo lavadoras y neveras, hago diagnóstico a domicilio" — obligatoria
  -- y con mínimo real: un servicio descrito en tres palabras no le sirve a
  -- nadie para decidir a quién dejar entrar a su casa.
  descripcion        text not null check (char_length(descripcion) between 20 and 400),

  anos_experiencia   smallint not null check (anos_experiencia between 0 and 70),

  -- Barrios donde atiende. text[] real, no CSV: se indexa y se filtra sin
  -- parsear un string en cada consulta. Es el reemplazo de la geometría:
  -- un servicio no es un punto, es un área de cobertura.
  cobertura          text[] not null check (
    cardinality(cobertura) between 1 and 25
  ),

  -- Único medio de contacto público, por decisión explícita. El correo existe
  -- pero vive en la tabla privada: menos superficie expuesta.
  telefono           text not null check (char_length(telefono) between 7 and 20),

  foto_url           text,
  foto_blob_pathname text,

  -- ── Confianza ──────────────────────────────────────────────
  -- Niveles, no un sello binario. "Verificado" a secas es ambiguo, y esa
  -- ambigüedad le transfiere al proyecto una responsabilidad que no puede
  -- sostener. Cada nivel dice QUÉ se comprobó:
  --   0 · registrado          — nadie verificó nada, se muestra "Sin verificar"
  --   1 · identidad           — alguien del equipo vio la cédula EN PERSONA
  --   2 · antecedentes al día — trajo su propio certificado vigente
  --   3 · respaldo comunitario— una JAC, parroquia o Aliado responde por él
  --
  -- La cédula NO se guarda: ni el número, ni una imagen. Se ve, se verifica y
  -- se registra quién verificó y cuándo. El dato más seguro es el que nunca
  -- se guarda, y así sigue siendo verdad lo que la política pública ya
  -- promete: "nunca documento de identidad".
  nivel_verificacion smallint not null default 0
    check (nivel_verificacion between 0 and 3),
  verificado_por     text references admins(email) on delete set null,
  verificado_en      timestamptz,

  -- Solo la FECHA de revisión del certificado, nunca el archivo. Vence: un
  -- antecedente revisado hace dos años no dice nada de hoy.
  antecedentes_revisado_en date,

  -- Quién respalda, en texto libre: "JAC Manrique Central", "Panadería La 45".
  respaldado_por     text check (char_length(respaldado_por) <= 120),

  -- ── Moderación (mismo contrato que portafolios) ────────────
  estado             portafolio_estado not null default 'pendiente',
  motivo_rechazo     text,
  moderado_por       text references admins(email) on delete set null,
  moderado_en        timestamptz,
  constraint chk_servicio_moderacion_completa check (
    estado in ('pendiente')
    or (moderado_por is not null and moderado_en is not null)
  ),
  constraint chk_servicio_rechazo_con_motivo check (
    estado <> 'rechazado' or motivo_rechazo is not null
  ),

  -- Un nivel de verificación mayor que cero tiene que decir quién y cuándo,
  -- o la insignia es una afirmación sin responsable.
  constraint chk_servicio_verificacion_trazable check (
    nivel_verificacion = 0
    or (verificado_por is not null and verificado_en is not null)
  ),

  -- ── Consentimiento (Ley 1581) ──────────────────────────────
  acepto_terminos    boolean not null check (acepto_terminos),
  acepto_habeas_data boolean not null check (acepto_habeas_data),
  -- Específico de este módulo: identificarse al llegar, acordar precio antes
  -- de empezar, no ingresar a áreas no autorizadas. No sustituye a la
  -- verificación, pero deja constancia con nombre, fecha y versión.
  acepto_codigo_conducta boolean not null check (acepto_codigo_conducta),
  version_terminos   text not null,

  -- Mismo patrón que portafolios: link sin login para editar o borrar lo suyo.
  token_publico      uuid not null default gen_random_uuid(),

  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now()
);

create unique index idx_servicios_token_publico on servicios (token_publico);

-- La vitrina pública solo lee aprobados y el panel solo pendientes: índice
-- parcial sobre el subconjunto, mismo criterio que los índices de 001.
create index idx_servicios_aprobados
  on servicios (categoria_id, creado_en desc)
  where estado = 'aprobado';

create index idx_servicios_pendientes
  on servicios (creado_en)
  where estado = 'pendiente';

-- Filtro "¿quién viene a mi barrio?" — GIN sobre el array de cobertura.
create index idx_servicios_cobertura on servicios using gin (cobertura);

-- ─────────────────────────────────────────────────────────────
-- Privado: caracterización laboral. NUNCA se publica.
-- ─────────────────────────────────────────────────────────────
--
-- Tabla aparte y no columnas en `servicios` para que la consulta de la
-- vitrina pública no pueda tocar esto ni por error: la separación es
-- estructural, no una cláusula `select` que alguien puede olvidar. Mismo
-- patrón que `aliados_investigacion`.

create table servicios_privado (
  servicio_id        uuid primary key references servicios(id) on delete cascade,

  correo             text check (correo is null or position('@' in correo) > 1),

  -- ¿De esto vive, o es un complemento? Distingue subempleo de oficio.
  ingreso_principal  boolean,
  horas_semana       smallint check (horas_semana between 1 and 90),

  como_consigue_clientes text
    check (como_consigue_clientes is null or como_consigue_clientes in
      ('voz_a_voz', 'redes', 'volantes', 'ninguno', 'otro')),

  -- El dato más accionable del reto: qué le impide conseguir trabajo.
  mayor_dificultad   text not null check (char_length(mayor_dificultad) between 3 and 300),

  herramientas_propias boolean,

  formacion          text
    check (formacion is null or formacion in ('sena', 'tecnico', 'empirico', 'ninguna')),

  -- Alguien haciendo trabajo físico en casa ajena sin ARL es un riesgo para
  -- él y para quien lo contrata. Es dato de investigación y, más adelante,
  -- puede convertirse en un servicio del proyecto.
  tiene_arl          boolean,

  necesita           text[] check (
    necesita is null or necesita <@ array[
      'herramientas', 'capacitacion', 'transporte', 'capital', 'clientes'
    ]::text[]
  ),

  sale_de_comuna     boolean,

  -- Dato personal declarado en la política, igual que en portafolios.
  ip_registro        inet,

  creado_en          timestamptz not null default now()
);
