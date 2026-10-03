# Constelaciones · Manrique

**La red de negocios de la Comuna 3 y su tablero de datos, Firmamento**

Territorio INN 2026 · Línea 1 Socioeconómica · Reto #2 Empleo y Desarrollo Económico · Comuna 3 – Manrique

Documento técnico completo. Versión de trabajo del 3 de octubre de 2026; entrega del concurso: 11 de octubre de 2026.

> **Cómo leer las marcas de este documento**
>
> - Las cifras del pipeline de datos y aprendizaje automático salen de la corrida reproducible del 2 de octubre de 2026 (`pipeline/reporte_modelo.md` y `pipeline/README.md`). `[PENDIENTE: métrica de datos-ml]` indica ahora solo un valor que ese pipeline todavía no produce (por ejemplo, la medición contra registros propios o la revisión manual de etiquetas).
> - `[PENDIENTE: ...]` con otra descripción indica un dato que depende de otra persona o de otro proceso.
> - `[COMPLETAR]` indica un dato personal o administrativo que completan los integrantes.
> - «En producción» indica una pieza publicada en el sitio a la fecha de este documento (3 de octubre de 2026).
> - «En implementación» indica una pieza que el equipo construye en la semana de esta versión y que **no** debe leerse como funcionando.
> - Las secciones 1 a 4.1 del formato (identificación, descripción del reto, solución y mapa de aliados) se conservan del documento del equipo; este archivo desarrolla el resumen ejecutivo, las palabras clave y las secciones 4.2, 4.3, 5, 6, 7 y 8, y trae el árbol de problema rehecho en `arbol-problema.md`.

## Integrantes

| Nombre completo | Documento de identidad | Programa de formación | Institución |
|---|---|---|---|
| María Camila Jaramillo Zapata | [COMPLETAR] | [COMPLETAR] | ITM |
| Luis Ríos Vanegas | [COMPLETAR] | [COMPLETAR] | ITM |
| Estefanía Mesa Makiu | [COMPLETAR] | [COMPLETAR] | ITM |

---

## Resumen ejecutivo

Las unidades productivas de la Comuna 3 – Manrique son poco visibles para sus clientes, para
otras unidades productivas y para las instituciones que podrían apoyarlas, y las estadísticas
oficiales no bajan a escala de comuna. Constelaciones es una plataforma pública y gratuita donde
cada negocio se registra en pocos minutos, con consentimiento y moderación humana, y aparece en un
mapa del territorio. Firmamento, su tablero de datos abiertos con aprendizaje automático, ya está
publicado: mide el territorio y la distancia entre el territorio y la red, sin pedirle datos
sensibles a ningún negocio; sugiere la categoría de un negocio a partir de su nombre, agrupa los
comercios en «constelaciones» por cercanía y ofrece paneles al negocio, al equipo y a las
entidades, con convocatorias oficiales que una persona revisa. El piloto lo valida en campo con
los negocios. Para los negocios el servicio es gratis siempre; el piloto de seis
meses tiene un valor estimado de $108.184.164, financiable con Presupuesto Participativo y
condicionado a la cesión de derechos al ITM. La plataforma hace visible el tejido productivo; no
garantiza por sí sola empleo digno.

*(Extensión: 150 palabras aproximadamente. Contar de nuevo en el procesador de texto antes de entregar.)*

## Palabras clave

Economía popular · Georreferenciación · Aprendizaje automático · Datos abiertos · Agrupamiento
espacial (constelaciones comerciales) · Comuna 3 Manrique

---

## Estado de la plataforma: qué existe hoy y qué está en implementación

Este cuadro separa lo que funciona en producción de lo que se construye en la semana de esta
versión. Lo que dice «En implementación» se describe en el resto del
documento como diseño, no como resultado. Que una pieza esté en producción dice que existe y se
puede usar; no dice que se haya medido su efecto (ver sección 7).

| Pieza | Estado al 3 de octubre de 2026 | Evidencia |
|---|---|---|
| Directorio de negocios con mapa, registro público sin cuenta y moderación humana antes de publicar | En producción | `README.md`; `docs/arquitectura-y-costos.md` §1 |
| Consentimiento: versión de términos guardada, dos casillas obligatorias, hash de IP en el registro de consentimiento | En producción | `docs/arquitectura-y-costos.md` §2.5 |
| Registro asistido (para quien no usa celular), con consentimiento y persona que captura exigidos por restricción de base | En producción | `AGENTS.md`, patrón «Dos puertas, una ficha» |
| Ingreso de vecinos con Google (identidad por `google_sub`, no por correo) y panel del negocio (antes «Mi cuenta», hoy en `/firmamento/negocio`) | En producción | `docs/arquitectura-y-costos.md` §2.2 |
| Asesor de formalización con catálogo cerrado de trámites y apoyos, proveedores de lenguaje gratuitos con rotación, solo con sesión | En producción | `docs/arquitectura-y-costos.md` §1 y §2.1 |
| Guías de Marca y de Ventas para los aliados; «Mis clientes» (CRM mínimo con nombre, teléfono y nota) | Implementado en el repositorio | `AGENTS.md`; `lib/content.ts` |
| Analítica agregada sin cookies: visitas por día y vistas y contactos por negocio y día; sin IP, sin recorridos | En producción | `docs/analitica.md` |
| Validación geográfica del punto contra el polígono de la comuna | En producción | `docs/analitica.md`, «Seguridad del sitio» |
| Pipeline de datos (OpenStreetMap, agrupamiento HDBSCAN, clasificador de categoría) | Ejecutado el 2 de octubre de 2026; salidas y métricas reproducibles. Sus salidas (`constelaciones.json` y el modelo del sugeridor) ya se sirven desde el sitio | `pipeline/README.md`; `pipeline/reporte_modelo.md`; `public/firmamento/` |
| `/firmamento`: tablero público de datos (secciones α a η) y mapa estelar con las constelaciones sobre OpenStreetMap | En producción | `app/(site)/firmamento/page.tsx`; `AGENTS.md`, patrón «`/firmamento`» |
| Sugeridor de categoría en el formulario de registro (corre en el navegador; solo viajan la categoría inferida y su confianza, nunca el texto escrito) | En producción | `AGENTS.md`, patrón «Sugeridor de categoría» |
| `/api/datos`: agregados de negocios aprobados con supresión de celdas pequeñas (k = 5) | En producción | `AGENTS.md`, patrón «Datos abiertos y regla k = 5»; `lib/db/datos.repo.ts` |
| Firmamento con sesión: una puerta (`/firmamento/entrar`) y tres paneles por rol: **negocio**, **equipo** y **entidad** (detalle en 4.2) | En producción | `docs/firmamento-modulos.md`; `AGENTS.md`; `TASKS.md`, sección «Firmamento: login por rol y paneles» (despliegue del 3 de octubre de 2026) |
| Edición directa de la ficha por su dueño, con bitácora de cambios (nombres de los campos, nunca los valores; migración 033) | En producción | `docs/base-de-datos.md`; `AGENTS.md`, patrones «Bitácora» y «Dos puertas, una ficha» |
| Moderación de convocatorias: lo que trae el vigía entra «pendiente» y una persona decide a qué categorías y formalidad aplica | En producción (la cola y la decisión humana). La ejecución diaria automática del vigía depende de GitHub Actions: ver 8.3 | `AGENTS.md`, patrón «Convocatorias» |
| «Para ti» (convocatorias aprobadas que aplican a cada negocio) y «Tu negocio en números» (vistas y contactos propios, 8 semanas) en el panel del negocio | En producción | `AGENTS.md`, patrón «Panel del negocio» |
| Barrio oficial calculado por punto en polígono (15 barrios, Alcaldía de Medellín); corrige además la lista de barrios: el sitio listaba «Campo Valdés No. 1», que es de la Comuna 4 | En producción | `lib/geo/barrios-manrique.json`; `AGENTS.md`, patrones «Barrios oficiales» y «Barrio oficial de un negocio»; Anexo A |
| Campos personalizados públicos solo si están marcados; la IP de registro se guarda en claro 30 días y luego se anula (queda su hash en el registro de consentimiento) | Implementado en el repositorio; la migración 032 está aplicada en producción. [PENDIENTE: confirmar que el cron de purga corre en producción] | `AGENTS.md`, patrones «Campos personalizados públicos» e «IP» |
| Política de datos que nombra a los proveedores de IA y nueva versión de términos (`2026-10-v5`) | Implementado en el repositorio. [PENDIENTE: confirmar el despliegue de la versión v5] | `lib/validation/portafolio.schema.ts`; `app/(site)/legal/politica-datos/page.tsx` |
| Sugeridor en un clic dentro de la moderación («Usar X» o «Mantener»), con reentrenamiento a partir de las decisiones del equipo | **En implementación** | `docs/plan-rediseno-firmamento.md`, brecha 1 |
| Mapa de los 15 barrios coloreado (hoy el mapa dibuja el contorno de los barrios y su nombre, sin color por barrio) | **En implementación** | `docs/plan-rediseno-firmamento.md`, brecha 2; `AGENTS.md`, patrón «Barrios oficiales» |
| F1 por categoría y matriz de confusión dentro del panel «Modelos» (las cifras existen en `pipeline/reporte_modelo.md`; falta mostrarlas en el panel) | **En implementación** | `docs/plan-rediseno-firmamento.md`, brecha 3 |
| Rediseño visual de los paneles («Ventana al cielo»: login por roles, pestañas, cifras con una sola fuente por grupo) | **En implementación** | `docs/plan-rediseno-firmamento.md` |
| Mapa dentro de «Territorio» del panel del equipo (hoy muestra tablas) | **En implementación** | `docs/plan-rediseno-firmamento.md`, brecha 2; `TASKS.md` |

---

## 4.2 Producto de datos: Firmamento

### Qué es y qué no es

Firmamento tiene dos caras. La primera es un tablero público, de lectura (`/firmamento`, en
producción), que mide **el territorio y la distancia entre el territorio y la red**, no solo a
Constelaciones. La segunda son los paneles con sesión para quien tiene un papel en la red (ver
«Firmamento con sesión», más abajo). El tablero se organiza en tres capas y ninguna le pide un
dato nuevo al negocio:

1. **Territorio**: datos abiertos y fuentes oficiales (OpenStreetMap, DANE, Departamento
   Administrativo de Planeación).
2. **Red**: agregados de los negocios aprobados en Constelaciones, con supresión de celdas
   pequeñas.
3. **Uso**: contadores que el sitio ya tiene (visitas, vistas y contactos), sin identificar personas.

Reglas de diseño del producto de datos:

- **Solo negocios aprobados** entran a los agregados. Nunca salen nombres, contactos,
  direcciones ni respuestas de investigación individuales.
- **Supresión de celdas pequeñas (k = 5):** toda celda con menos de cinco negocios se publica como
  «<5». Con una red pequeña, la mayoría de las celdas saldrán suprimidas, y eso es lo correcto:
  se explica en el propio tablero como decisión de protección de datos (Ley 1581 de 2012).
- **Lo que escribe la persona no sale de su pantalla.** El sugeridor corre en el navegador; lo único
  que viaja al registrarse es la categoría inferida, su confianza y si la persona la aceptó, nunca el
  texto escrito. Las búsquedas sin resultado, cuando se midan, se guardarán como categoría inferida
  y no como texto (hoy esa medición no existe).
- **Toda cifra lleva fuente y fecha** debajo; ninguna pieza usa datos simulados.
- **Los colores de categoría solo identifican**, nunca juzgan; cada categoría se distingue
  también por forma o letra (daltonismo).
- **La descripción libre de OpenStreetMap no se publica**, porque puede identificar a personas.
  De cada comercio solo se muestran dirección, horario, tipo de cocina y página web, y únicamente
  cuando OpenStreetMap los trae. El pipeline no conserva teléfonos, contactos ni correos.
- **Atribución obligatoria** en cualquier vista del mapa: «© colaboradores de OpenStreetMap (ODbL)»
  (OpenStreetMap contributors, 2026).

### Componentes

| # | Componente del tablero | Capa | Indicador que muestra | Cómo se calcula | De dónde sale el dato | Actualización | Estado |
|---|---|---|---|---|---|---|---|
| 1 | Cielo de hoy | Territorio | Establecimientos mapeados en OpenStreetMap dentro del polígono oficial de la comuna, con y sin nombre | Conteo de elementos de OpenStreetMap con etiqueta comercial cuyo punto cae dentro de `lib/geo/manrique.json`, exigiendo o no `name`, con duplicados descartados (la misma metodología de conteo de la asesoría) | OpenStreetMap vía API Overpass (OpenStreetMap contributors, 2026). Valor: **320 establecimientos mapeados** en la Comuna 3, de ellos 201 con nombre y 119 sin nombre, snapshot de OpenStreetMap del 2 de octubre de 2026 (17:01 UTC). Los 119 «sin nombre» incluyen 4 cuyo `name` en OpenStreetMap es literalmente «Sin nombre» | Hoy se actualiza a mano, al repetir la corrida del pipeline; se propone semanal y automática [PENDIENTE: depende de GitHub Actions, ver 8.3]; cada salida lleva fecha y fuente | En producción (sección α de `/firmamento`) |
| 2 | Mapa estelar | Territorio | Constelaciones comerciales (nodos de comercio vecino) y locales sueltos | Agrupamiento por densidad (HDBSCAN) sobre coordenadas en metros; centroide, radio, mezcla de categorías y árbol de expansión mínima para dibujar. Resultado: 20 constelaciones, 213 establecimientos agrupados y 107 sueltos (ver 4.3). Cada constelación lleva un código (C01…) y un nombre descriptivo «vía · categoría dominante» | Salida del paso 2 del pipeline (`constelaciones.json`) | Con cada corrida del pipeline | En producción (sección β) |
| 3 | Tabla de constelaciones | Territorio | Por constelación: número de locales, categorías presentes y barrio dominante | Resumen del paso anterior; al tocar una fila se enciende en el mapa | Mismo origen que el componente 2 | Con cada corrida del pipeline | En producción (sección γ) |
| 4 | Contexto del territorio | Territorio | Población, área, desempleo e índice de condiciones de vida de la comuna frente a la ciudad | Valores publicados, sin cálculo propio (Anexo A) | Alcaldía de Medellín, Departamento Administrativo de Planeación (2021) | Anual, cuando se publique una ficha nueva | En producción (sección ζ; el tablero muestra población, área y desempleo; el índice de condiciones de vida queda en este documento) |
| 5 | Referencia nacional de micronegocios | Territorio | Proporción de micronegocios con RUT y con registro en Cámara de Comercio | Valores publicados para las 24 ciudades; se rotulan como referencia de ciudades, no de Manrique | DANE, EMICRON 2025 (2026) | Anual | En producción (sección ζ). **[PENDIENTE: contrastar las dos cifras con el boletín original; el tablero las rotula así]** |
| 6 | Brecha territorio-red («embudo de visibilidad») | Red | Las tres miradas lado a lado: empresas con registro mercantil, establecimientos mapeados y aliados aprobados. El paso siguiente del embudo (de ahí a contactos) no está en el tablero público | Sin división entre cifras. Se rotula como **línea base**, no como cobertura del universo (ver sección 8.2) | Cámara de Comercio, paso 1 del pipeline y agregados de la red (`obtenerDatosAbiertos`) | Cada hora (caché) | En producción (sección δ); el tramo hacia contactos, pendiente de diseño |
| 7 | Red por categoría, barrio y constelación | Red | Número de aprobados por categoría y por barrio oficial | Conteo con supresión: si n < 5, se muestra «<5»; si queda escondida una sola celda, se esconde también la menor visible | `/api/datos` (solo aprobados; barrio por punto en polígono). El tablero público muestra la categoría; el barrio sale en `/api/datos` y en el panel de la entidad | Cada hora (caché) | En producción para categoría y barrio. Por constelación: pendiente de diseño |
| 8 | Formalidad declarada y mayor dificultad declarada | Red | Distribución agregada de la formalidad declarada y de la mayor dificultad (opciones cerradas) | Conteo con supresión (k = 5). Cada dimensión lista todas sus opciones. Medios de pago y origen de registro (propio o asistido) no están en `/api/datos` hoy | `/api/datos` | Cada hora | En producción (formalidad y mayor dificultad). Medios de pago y origen de registro: pendiente de diseño |
| 9 | Uso del sitio | Uso | Vistas de ficha y contactos iniciados | Suma de contadores diarios ya existentes; no hay evento individual ni identificador | Tabla de interacciones por negocio, día y tipo (`docs/analitica.md`) | Diaria | En producción para cada negocio (sus propias cifras de 8 semanas en su panel). La vista pública agregada: pendiente de diseño |
| 10 | Búsquedas sin resultado | Uso | Categorías que la gente busca y no encuentra en la red | Categoría inferida de la búsqueda; el texto original no se guarda | `/api/datos` | Cada hora | Pendiente de diseño (`docs/base-de-datos.md`, sección 6: falta saber si la búsqueda tuvo resultado) |
| 11 | Sugeridor en vivo | Uso | Muestra el modelo respondiendo: categoría más probable y probabilidad, o las tres más probables si la confianza es baja | Inferencia en el navegador; ver 4.3 | Modelo exportado por el paso 3 del pipeline | Cuando se reentrena | En producción (sección ε y formulario de registro) |
| 12 | Vigía de convocatorias | Uso | Convocatorias oficiales nuevas, revisadas por una persona, y cuántas se aprobaron | Revisión de páginas oficiales; todo entra como pendiente hasta que un moderador lo aprueba y elige a qué categorías y formalidad aplica | Páginas oficiales de Fondo Emprender, Bancóldex, Ruta N, Cámara de Comercio, SENA e iNNpulsa | Se propone diaria **[PENDIENTE: ejecución automática diaria, depende de GitHub Actions y de cargar los secretos de la ingesta; ver 8.3]** | En producción la moderación y «Para ti»; el contador público de convocatorias aprobadas, pendiente de diseño |
| 13 | Indicadores con meta | Red y uso | Avance frente a las metas de la sección 7 | Cálculo directo sobre los componentes anteriores | `/api/datos` | Cada hora | Pendiente de diseño (el tablero publica «indicadores con fuente» de otras entidades, no avance frente a metas) |

Hay al menos un componente de cada capa: territorio (1 a 5), red (6 a 8) y uso (9 a 12).

### Firmamento con sesión: tres roles, tres paneles

Además del tablero público, Firmamento tiene una puerta de entrada (`/firmamento/entrar`) y un
panel por rol. Los tres están en producción desde el 3 de octubre de 2026. Lo que cada rol ve se
decide en el servidor, en cada consulta, y no en la pantalla (`docs/firmamento-modulos.md`).

| Rol | Cómo entra | Qué ve y qué hace | Qué no ve |
|---|---|---|---|
| **Aliado** (dueño de un negocio) | Cuenta de Google, o el enlace privado de su ficha | Sus propias cifras (vistas y contactos de 8 semanas); su ficha, que puede editar directamente, con la bitácora de cambios; «Para ti», con las convocatorias aprobadas que le aplican por categoría y formalidad; su constelación y los comercios vecinos de OpenStreetMap, rotulados «no es aliado»; sus clientes (CRM mínimo: nombre, teléfono y nota) | Los datos de otros negocios. La comparación con su categoría solo aparece si hay al menos cinco negocios |
| **Equipo** (moderadores) | Cuenta de moderador (sesión propia de 8 horas) | Moderación de fichas; cola de convocatorias del vigía, con quién decidió y cuándo; territorio con plan de brigada para el censo de campo (exportable en CSV); datos abiertos; modelos; alta de entidades y de sus miembros | Los clientes de cada negocio: son datos de terceros y no los lee ni el equipo |
| **Entidad** (por ejemplo, la Junta Administradora Local, CEDEZO y el Centro del Valle del Software de Manrique) | Cuenta de Google autorizada por el equipo (una fila de miembro de la entidad, no un rol dentro de la cookie) | Observatorio con **solo agregados con supresión k = 5**; descarga CSV de esos agregados; propuesta de convocatorias, que entran «pendientes» y que el equipo revisa antes de publicar | Cualquier fila de negocio: nombres, contactos, direcciones y coordenadas |

Tres decisiones de diseño que importan para evaluar la propuesta:

- **La edición del dueño publica directo.** Es un cambio frente al diseño anterior, en el que cada
  edición devolvía la ficha a revisión. Se eligió para que un negocio pueda corregir su horario o
  su teléfono sin esperar a un moderador. A cambio, un cambio malicioso o equivocado queda
  visible hasta que el equipo lo vea: por eso cada edición deja una fila en la bitácora (guarda los
  nombres de los campos cambiados, nunca los valores, para no duplicar datos personales) y el panel
  del equipo calcula alertas de calidad (punto fuera de la comuna, barrio distinto del que dice el
  punto, categoría «Otros» y ficha incompleta). Los registros nuevos y las fichas rechazadas siguen pasando por
  moderación antes de publicarse. **[PENDIENTE: medir cuántas ediciones corrige el equipo después de publicadas; no hay dato todavía]**
- **Dos poblaciones, dos cookies.** Los moderadores y los vecinos tienen sesiones separadas; la
  entidad usa la sesión de vecino más su membresía.
- **Una entidad nunca lee negocios fila por fila.** Lo comprueba un verificador automático del
  repositorio (`scripts/verificar-entidades.mjs`).

Falta probar en producción el ingreso real con Google de un negocio y de una entidad, y dar de alta
a la primera entidad (`TASKS.md`). **[PENDIENTE: prueba de ingreso real con Google en producción y alta de la primera entidad]**

### Tres miradas del mismo territorio

El componente 6 parte de tres cifras que describen la Comuna 3 desde fuentes distintas. Se
presentan juntas para que se vea la brecha, no para compararlas.

| Mirada | Qué cuenta | Cifra | Fuente y fecha |
|---|---|---|---|
| Registro mercantil | Comerciantes matriculados o renovados en 2025 que la Cámara clasifica en la comuna Manrique | 2.626 empresas | Cámara de Comercio de Medellín para Antioquia (2025), Estructura Empresarial 2025, Tabla 16; consultada el 1 de octubre de 2026 |
| Mapa abierto | Establecimientos mapeados por voluntarios en OpenStreetMap dentro del polígono de la comuna (201 con nombre y 119 sin nombre) | 320 establecimientos | OpenStreetMap contributors (2026), snapshot del 2 de octubre de 2026 (17:01 UTC) obtenido del servidor principal de Overpass; corrida del 2 de octubre de 2026 |
| Red | Aliados aprobados en Constelaciones | [PENDIENTE: cifra de aliados aprobados el día de la entrega, tomada de `/api/datos`] | Constelaciones, al día de la entrega |

Cómo leer el cuadro:

- **No son comparables como porcentaje.** El registro mercantil cuenta empresas inscritas en la
  Cámara, de cualquier tamaño; OpenStreetMap cuenta locales mapeados por voluntarios
  con nombre. Dividir una cifra entre otra no da cobertura de nada.
- **No se extrapola informalidad.** La Encuesta de Micronegocios del DANE (13,0 % con registro en
  Cámara de Comercio) es de 24 ciudades, no de Manrique, y no se aplica a la comuna para estimar
  cuántos negocios informales hay.
- **La brecha entre las tres cifras es la línea base** del trabajo, no una medida de éxito ni de
  fracaso. Que el mapa abierto muestre mucho menos que el registro mercantil dice que el mapa
  abierto es parcial; no dice cuántos negocios hay.

### Fuentes de datos para el pipeline en Python

| Fuente | Qué aporta | Estado |
|---|---|---|
| OpenStreetMap por API Overpass (licencia ODbL) | Dos consultas. (1) Comercios con nombre del Valle de Aburrá (5.423, de los cuales 4.790 tienen categoría asignada y sirven para entrenamiento; el clasificador aprende de nombres, por eso exige `name`). (2) Establecimientos de la Comuna 3 con y sin nombre (320: 201 con nombre y 119 sin nombre), que alimentan las constelaciones | Script ejecutado el 2 de octubre de 2026 (`pipeline/01_osm_overpass.py`) en el servidor principal de Overpass. Snapshot del Valle: 2 de octubre de 2026, 04:40 UTC. Snapshot de la Comuna 3: 2 de octubre de 2026, 17:01 UTC. Cifras de corridas anteriores, que no deben leerse como vigentes: 205 con nombre (snapshot de la mañana del 2 de octubre, antes de contar los locales sin nombre) y 192 (espejo con snapshot del 6 de mayo de 2026). Las diferencias son de la base de OpenStreetMap y del criterio de conteo, no de crecimiento del comercio. Una descarga posterior puede dar otro número |
| DANE, EMICRON 2025: boletines y anexos | Contexto de micronegocios en 24 ciudades | Disponible |
| Estructura Empresarial 2025 de la Cámara de Comercio | Empresas registradas en Manrique (2.626), por tamaño y por sector | Leída del archivo original el 1 de octubre de 2026; ver Anexo A |
| Exportación CSV del panel de moderación | Datos propios agregables de la red | En producción |
| `/api/datos` | Agregados públicos con supresión (k = 5) de categoría, barrio, formalidad declarada y mayor dificultad declarada | En producción |
| Barrios oficiales | Los 15 polígonos de barrio de la Comuna 3, para calcular el barrio de cada punto | Alcaldía de Medellín, polígonos de barrios (archivo entregado al equipo, 2026); recortados por `scripts/extraer-barrios.mjs` el 2 de octubre de 2026 |

El pipeline aplica validaciones de calidad antes de cualquier modelo: eliminación de duplicados,
descarte de coordenadas fuera del polígono, tratamiento de nulos y trazabilidad (fuente y fecha
en cada archivo de salida).

---

## 4.3 Variables del modelo

### Modelo 1: sugeridor de categoría

- **Tarea:** sugerir, nunca decidir, la categoría de un negocio a partir de su nombre (y de su
  descripción, si existe).
- **Datos de entrenamiento:** comercios con nombre del Valle de Aburrá en OpenStreetMap, sin
  duplicados, con la etiqueta de OpenStreetMap traducida a las categorías del sitio. Tamaño de
  la muestra: 5.423 comercios con nombre en el Valle de Aburrá, de los cuales 4.790 (4.056 nombres
  distintos) tienen una categoría del sitio asignada y se usan; 633 se descartan por no tener
  etiqueta traducible. La clase más grande es «comidas» (1.696) y la más pequeña «barbería» (13).
  Fuente: OpenStreetMap (OpenStreetMap contributors, 2026), snapshot del 2 de octubre de 2026,
  licencia ODbL.
- **No se entrena con los registros propios de la red:** son pocos y el entrenamiento sería
  inestable. Los registros propios son donde se aplica el modelo; las correcciones de los
  moderadores se suman después a los datos de entrenamiento.
- **Qué se guarda del uso (en producción).** El modelo ya está en el formulario de registro y corre
  en el navegador. Por cada registro se guarda la categoría que el modelo infirió, su confianza y si
  la persona la aceptó (la categoría final coincide con la sugerida); nunca el texto escrito. Esa
  tabla (`sugerencias_categoria`) es la que permitirá medir la aceptación y reentrenar, y desde la
  migración 033 sabe de qué ficha vino cada sugerencia. Cuando un moderador cambia la categoría de
  una ficha, la bitácora lo registra como `categoria_corregida`, que es la señal de corrección
  para el reentrenamiento. El sugeridor en un clic dentro de la moderación, que guarda esa decisión
  como ejemplo, está **en implementación**.

| Variable | Papel | Tipo | Fuente | Modelo |
|---|---|---|---|---|
| Nombre del negocio | Entrada | Texto corto | Formulario de registro (en entrenamiento: campo `name` de OpenStreetMap) | 1 |
| Descripción del negocio | Entrada opcional | Texto corto | Formulario de registro | 1 |
| Frecuencia ponderada de secuencias de 2 a 4 caracteres dentro de cada palabra (TF-IDF de n-gramas) | Variable derivada | Numérica dispersa | Calculada a partir de las anteriores | 1 |
| Categoría del sitio | Salida (etiqueta) | Categórica, un grupo de categorías del sitio | En entrenamiento: etiqueta de OpenStreetMap traducida; en uso: elección final de la persona | 1 |
| Probabilidad de la categoría | Salida | Numérica entre 0 y 1 | Calculada por el modelo | 1 |
| Umbral de confianza | Parámetro de uso | Numérica | Diseño del producto: por debajo de 0,45 la interfaz pregunta y muestra las tres más probables. Es el umbral con el que se midió la corrida del 2 de octubre. **[PENDIENTE: confirmar si se mantiene tras medir el uso real y las correcciones de los moderadores]** | 1 |

- **Técnica:** TF-IDF de n-gramas de caracteres de 2 a 4 con bordes de palabra (`char_wb`) más
  regresión logística (Pedregosa et al., 2011). El parámetro de regularización (C = 30) se eligió por
  validación cruzada de 4 pliegues, agrupada, solo sobre los datos de entrenamiento.
- **Evaluación:** se reserva el 20 % de los comercios (959), estratificado por categoría y
  **agrupado por nombre**: ningún nombre del conjunto de prueba aparece en el entrenamiento. Se
  agrupa porque en OpenStreetMap abundan las cadenas con el mismo nombre, y un reparto al azar
  inflaría el resultado. Se reporta F1 macro frente a dos líneas base y la matriz de confusión
  (semilla fija 42; detalle en `pipeline/reporte_modelo.md`).

| Modelo | F1 macro | Exactitud |
|---|---|---|
| TF-IDF `char_wb` 2-4 + regresión logística | **0,528** | 0,633 |
| Línea base: siempre la clase mayoritaria | 0,044 | 0,355 |
| Línea base: azar según las frecuencias de las clases | 0,074 | 0,198 |

- **Lectura del resultado.** El modelo supera con holgura a las dos líneas base, pero un F1 macro
  de 0,528 no es un modelo infalible: es un sugeridor que acierta bastante en algunas categorías y
  poco en otras. Con el umbral de 0,45, el modelo sugiere **una sola categoría en el 84,6 %** de los
  casos y acierta el 70,4 % de esas sugerencias; en el resto muestra tres opciones. La categoría
  correcta está entre las **tres primeras en el 89,6 %** de los casos del conjunto de prueba.
- **Prueba geográfica.** Entrenado sin ningún comercio de la Comuna 3 y probado en sus 173
  comercios con categoría asignada, el F1 macro fue 0,636 (exactitud 0,705). Varias categorías
  tienen entre 2 y 8 ejemplos en ese conjunto, por lo que se toma como orden de magnitud y no como
  cifra fina.
- **Comparación con un modelo externo.** El reporte también compara con un modelo de referencia,
  pero esa comparación no se cita como un resultado propio: se desconoce con qué datos y mapeo se
  entrenó, probablemente vio estos nombres al entrenarse y su código no es reproducible.
- **Por qué esta técnica y no una red neuronal:** el nombre de un comercio es un texto de dos o
  tres palabras y los ejemplos etiquetados son pocos miles. En ese tamaño una red neuronal no
  aporta una mejora que se pueda justificar, es más difícil de explicar a un jurado y a un
  moderador, y no cabe con facilidad en el navegador. La regresión logística es liviana,
  entrega una probabilidad que permite aplicar un umbral de confianza, y corre **en el navegador
  del vecino**, sin servidor de inferencia, sin API y sin costo.
- **Uso previsto y límites:** sugiere; la persona y el moderador deciden. Puede equivocarse con
  nombres propios («Dulce Poema») y con categorías con pocos ejemplos, y aprendió de nombres de
  comercios en los que pesan las cadenas y el centro de la ciudad. Límites medidos por
  categoría en el conjunto de prueba (F1): mejor en salud y bienestar (0,848), mascotas (0,769) y
  comidas (0,719); peor en ropa y calzado (0,222) y papelería (0,238); papelería tiene precisión de
  0,153 porque el modelo confunde con ella muchas tiendas de víveres (72 de 199 en el conjunto de
  prueba). «Barbería» tiene solo 13 ejemplos y su F1 no es fiable. El modelo no cubre ocho categorías del sitio (modistería,
  reparación de electrodomésticos, transporte y domicilios, educación y cuidado infantil,
  fotografía y eventos, lavandería, reciclaje y otros) porque no tienen etiqueta fiable en
  OpenStreetMap.
- **Limitaciones que siguen abiertas.** (1) Cobertura parcial de OpenStreetMap. (2) Las etiquetas
  de entrenamiento son «débiles»: salen de las etiquetas de OpenStreetMap, sin revisión manual de
  una muestra. [PENDIENTE: métrica de datos-ml, revisión manual de una muestra de etiquetas]
  (3) El modelo no se ha validado contra los registros propios de la red: hay 7, insuficientes
  para una métrica. [PENDIENTE: métrica de datos-ml, validación con registros propios cuando haya
  suficientes] (4) El modelo reentrenado sugiere con confianza alta algunos casos erróneos: por
  ejemplo, «Misceláneo El Vecino» se clasificó como «comidas» con una probabilidad de 0,90. Por eso
  el registro solo **sugiere** y la persona elige; una probabilidad alta no equivale a una
  categoría correcta. (5) Frente a la corrida anterior, el modelo sugiere una sola categoría con
  más frecuencia (84,6 % frente a 76,0 %) pero acierta menos en ellas (70,4 % frente a 73,8 %).
- **Reentrenamiento:** periódico (propuesta: cada trimestre o cada cien correcciones de moderador),
  sumando las correcciones propias a los datos de OpenStreetMap. El reentrenamiento a partir de las
  decisiones del equipo en la moderación está **en implementación**, como también la vista del F1
  por categoría y de la matriz de confusión dentro del panel «Modelos» (hoy esas cifras están en
  `pipeline/reporte_modelo.md` y en este documento).

### Modelo 2: constelaciones comerciales (agrupamiento espacial)

- **Tarea:** encontrar nodos de comercio vecino y distinguir los locales aislados.

| Variable | Papel | Tipo | Fuente | Modelo |
|---|---|---|---|---|
| Latitud y longitud del establecimiento | Entrada | Numérica | OpenStreetMap (y, en el futuro, fichas aprobadas) | 2 |
| Coordenadas proyectadas a un sistema métrico local | Variable derivada | Numérica, en metros | Conversión de las anteriores (proyección plana para Medellín) | 2 |
| Tamaño mínimo del grupo | Hiperparámetro | Entero | Valor usado: 6 (`min_cluster_size`). La sensibilidad a este valor queda en el JSON de salida | 2 |
| Muestras mínimas | Hiperparámetro | Entero | Valor usado: 3 (`min_samples`) | 2 |
| Método de selección de grupos | Hiperparámetro | Categórico | Valor usado: `leaf` (hojas del árbol); la alternativa por defecto es `eom`. Ver la explicación abajo. **[PENDIENTE: decisión del equipo, eom o leaf]** | 2 |
| Identificador de constelación (o «suelto») | Salida | Categórica | Calculada por el modelo | 2 |
| Centroide, radio, mezcla de categorías y árbol de expansión mínima | Salida derivada | Numérica y geométrica | Calculadas a partir del grupo; el árbol define las líneas que se dibujan | 2 |

- **Técnica:** HDBSCAN (Campello et al., 2013; McInnes et al., 2017), sobre coordenadas en metros
  (proyección UTM zona 18N), con `min_cluster_size` = 6, `min_samples` = 3 y selección `leaf`.
- **Resultado:** sobre los 320 establecimientos mapeados de la Comuna 3 (201 con nombre y 119 sin
  nombre) salen **20 constelaciones, con 213 establecimientos agrupados y 107 sueltos** (selección
  `leaf`, `min_cluster_size` = 6, `min_samples` = 3; OpenStreetMap contributors, 2026; snapshot del 2
  de octubre de 2026, 17:01 UTC). El mayor grupo tiene 19 locales y un radio de unos 101 metros. La
  metodología de conteo es la de la asesoría, que contó 312 establecimientos (198 con nombre y 114
  sin nombre) con otro snapshot, del 1 de octubre; la diferencia es de fecha de la base, no de
  criterio. Cada constelación lleva un código (C01…) y un nombre descriptivo «vía más frecuente ·
  categoría dominante» (la vía sale de `addr:street` de OpenStreetMap; 7 de las 20 no tienen calle
  registrada). Se presenta como **resultado exploratorio** que se valida en campo durante el piloto.
- **Corridas anteriores (no vigentes).** Con solo los 205 comercios con nombre de la mañana del 2 de
  octubre, la misma configuración daba 12 constelaciones, 125 agrupados y 80 sueltos. Se conservan
  como historia de la corrida, no como resultado.
- **`leaf` o `eom`: qué se sabe y qué está pendiente.** Se probaron los dos métodos y la comparación
  completa está en el JSON de salida (`comparacion_eom_leaf` y `sensibilidad_min_cluster_size`). Con
  los 205 locales con nombre, `eom` (el método por defecto) colapsaba: 171 caían en un solo cúmulo,
  que sirve para decir que la comuna es densa, pero no para leer núcleos a escala de cuadra. Esa fue
  la razón por la que se eligió `leaf`. **Con los 320 establecimientos el colapso ya no ocurre:**
  `eom` da 18 constelaciones, 88 sueltos y un cúmulo mayor de 29 locales (radio de unos 111 metros),
  frente a las 20 constelaciones, 107 sueltos y cúmulo mayor de 19 de `leaf`. Por eso el argumento
  «`eom` colapsa» ya no se sostiene con estos datos; hoy `leaf` se mantiene por consistencia con la
  entrega anterior y porque da grupos algo más finos. Ninguna de las dos particiones es «más
  correcta» en sentido estadístico: otro criterio daría otra partición. **[PENDIENTE: decisión del
  equipo, eom o leaf]**
- **Por qué esta técnica y no K-Means:** K-Means obliga a fijar de antemano cuántos grupos hay y a
  asignar *todos* los puntos a algún grupo, lo que anula la idea de «local suelto». Además supone
  grupos de forma redonda y tamaño similar, y una calle comercial es alargada. HDBSCAN no
  necesita el número de grupos, admite densidades distintas y deja fuera, como ruido, lo que no
  pertenece a ningún nodo. Esa propiedad es la que se necesita para orientar el trabajo de campo.
- **Por qué esta técnica y no una red neuronal:** no hay etiquetas de «constelación» que
  aprender; es un problema sin supervisión y con pocos cientos de puntos.
- **Límites:** OpenStreetMap ve más lo formal y lo que está sobre vías principales, por lo que la
  agrupación subestima la ladera alta. Por eso el piloto incluye un censo de campo (sección 5).
  Además, las constelaciones describen lo que está **mapeado**, no todo lo que existe: una zona sin
  constelación puede ser una zona sin mapear. La etiqueta de categoría dominante de una
  constelación puede ser débil (hay locales sin categoría asignada); debe leerse junto con la mezcla
  de categorías. Hay constelaciones con radio grande: `C03` (unos 306 metros, 16 locales) y `C18`
  (unos 462 metros, 6 locales) son locales dispersos, no núcleos compactos; el JSON publica también
  el radio del percentil 90.

### Variables de la red y del uso (no entran a un modelo; alimentan los agregados)

| Variable | Tipo | Fuente | Tratamiento de privacidad |
|---|---|---|---|
| Categoría | Categórica | Registro | Agregado con k = 5 |
| Barrio oficial | Categórica | Calculado por punto en polígono con la capa de barrios de la Alcaldía de Medellín (15 barrios); queda guardado en la ficha desde la migración 033 | Agregado con k = 5; no se publica la coordenada |
| Constelación | Categórica | Modelo 2 | Para el aliado, se calcula al vuelo y no se guarda; el agregado con k = 5 por constelación está pendiente de diseño |
| Origen de registro (propio o asistido) | Categórica | Registro | Agregado con k = 5 previsto para medir inclusión; hoy no está en `/api/datos` [PENDIENTE: incluirlo antes de medir el indicador de registros asistidos] |
| Medios de pago | Categórica múltiple | Registro | Agregado con k = 5 previsto; hoy no está en `/api/datos` |
| Formalidad declarada y mayor dificultad declarada | Categórica | Investigación del registro (privada) | Solo agregada, con k = 5, en `/api/datos` y en el tablero de la entidad; nunca por negocio |
| Vistas y contactos por día | Conteo | Contadores existentes | Sin IP, sin cookie, sin identificador |

Variables que **no** se usan: nombre del titular, documento, correo, teléfono, dirección exacta,
respuestas de investigación individuales, texto de las búsquedas.

---

## 5. Metodología

El piloto sigue la ruta de innovación social (Pacheco et al., 2022): **Alistar**,
**Entender y analizar** y **Crear**, a las que se agregan dos fases de operación y evaluación
que equivalen, de forma aproximada, a las etapas de implementar y de empaquetar y escalar de la
misma ruta, ajustadas a seis meses.

| Fase | Qué se hace | Producto al final de la fase | Semanas |
|---|---|---|---|
| 1. Alistar | Acuerdos de trabajo con la Junta Administradora Local, CEDEZO y el Centro del Valle del Software de Manrique, y alta de cada entidad en su panel; definición de la línea base del tablero y de lo que significa «informal». Los ajustes de plataforma de esta fase (barrio oficial, campos públicos, política de datos) ya están hechos al 3 de octubre de 2026 | Actas de acuerdo; entidades con acceso a su panel; línea base publicada con fuente y fecha | 1–3 |
| 2. Entender y analizar | **Censo de campo** con registro asistido en los barrios con menos puntos en el mapa abierto; diálogo con 30 negocios para entender dificultades y necesidades | Registros asistidos con consentimiento; síntesis de los diálogos; mapa de cobertura comparado con el mapa abierto | 3–8 |
| 3. Crear | **Codiseño con los negocios** del tablero y de los servicios (sugeridor, «Para ti», «Tu negocio en números»); taller de convergencia | Versión del tablero y de los servicios validada con los negocios | 6–12 |
| 4. Operar | Seis talleres con aliados; moderación de convocatorias del vigía; reentrenamiento del modelo con las correcciones de moderación | Talleres realizados; convocatorias aprobadas; modelo reentrenado | 12–22 |
| 5. Evaluar y entregar | Medición de los indicadores de la sección 7; informe técnico; entrega a la Junta Administradora Local y al Centro del Valle del Software de Manrique | Informe técnico; tablero entregado con documentación de operación | 22–26 |

Observaciones:

- Las fases 2 y 3 se solapan a propósito: el codiseño empieza con los primeros negocios dialogados.
- Los tres dinamizadores de la comuna que hacen el censo son parte del presupuesto
  (sección 6): la inclusión de informales no se logra desde una pantalla.
- Cada fase termina en un producto que se puede mostrar a la Junta Administradora Local.

---

## 6. Presupuesto

El servicio es **gratis para los negocios, siempre**. El costo de operar el sitio hoy es $0 (planes
gratuitos). El valor del piloto es otra cosa: paga a las personas que hacen el censo, el
desarrollo, los datos y los talleres. Esa es la cifra pertinente para Presupuesto Participativo.

| Concepto | Valor (COP) | Observaciones |
|---|---|---|
| Talento: desarrollo, datos y aprendizaje automático; tres dinamizadores de la comuna; talleres; diseño; validación jurídica | $99.816.537 | Calculado con topes de referencia del SENA 2026. **[COMPLETAR: desglose por rol: número de personas, meses y tarifa mensual de cada una]**. **[PENDIENTE: anexar la tabla SENA 2026 con fecha de consulta; no se pudo verificar en esta revisión]** |
| Tecnología y materiales: planes de pago de software durante seis meses, distintivos con código QR y logística de seis talleres | $3.216.000 | Software estimado en USD 40 mensuales (supuesto, ver abajo). **[COMPLETAR: desglose entre software, distintivos y logística, y la tasa de cambio usada]** |
| Imprevistos (5 %) | $5.151.627 | 5 % sobre la suma de los dos conceptos anteriores |
| **Total del piloto de seis meses** | **$108.184.164** | |

Un MVP de tres meses cuesta $33.088.953 (cálculo del equipo con los mismos criterios).

**Supuestos (marcados como supuestos):**

1. El costo de software por mes (alrededor de USD 40) es una estimación del equipo a partir de los
   planes de pago de los servicios de alojamiento y base de datos, consultados el 29 de septiembre
   de 2026. En esa estimación, un uso de diez veces el actual cuesta entre USD 30 y 40 por mes. No se
   ha medido el tráfico real (Equipo Constelaciones, 2026a).
2. El alojamiento gratuito actual de la plataforma no permite uso comercial según los términos
   del proveedor; si el proyecto recibe financiación, debe pasar a un plan de pago. Esto ya está
   incluido en el supuesto anterior y se explica en la sección 8.
3. Los topes del SENA 2026 son una referencia de tarifa, no un contrato. La tarifa final dependerá
   de quién contrate.
4. El valor depende de que se pueda ejecutar la cesión de derechos y la contratación por el ITM o por
   la entidad que gestione el Presupuesto Participativo (ver sección 8.4).
5. El piloto de seis meses no incluye mantenimiento posterior a la entrega; ver sección 8.3.

---

## 7. Indicadores

Cada resultado tiene un indicador que se puede contar en el tablero. Las metas son metas del
equipo para seis meses y dependen de que el censo de campo se ejecute completo: no son
predicciones.

| Resultado esperado | Indicador | Línea base | Meta a seis meses | Cómo se cuenta |
|---|---|---|---|---|
| Más negocios visibles en el mapa | Aliados aprobados | [PENDIENTE: cifra de aliados aprobados al cierre de la entrega, tomada de `/api/datos`] | 150 aliados | Conteo de aprobados (componente 6 del tablero) |
| La visibilidad llega a quien tiene menos acceso | Proporción de aliados informales | [PENDIENTE: línea base de formalidad declarada] | Al menos 40 % de los aliados, **con definición de «informal» fijada en la fase 1** | Formalidad declarada, agregada con k = 5 |
| Registros asistidos efectivos | Aliados con origen «asistido» y consentimiento verificable | [PENDIENTE: el dato está en la base, pero no sale en `/api/datos`] | [COMPLETAR: meta; se propone derivarla del 40 % de informales] | Origen de registro (componente 7) |
| Información confiable | Fichas con categoría y barrio confirmados | [PENDIENTE: línea base al día de la entrega; el barrio oficial ya se calcula y se guarda en cada ficha, y el panel del equipo marca las que quedan fuera de la comuna o en «Otros»] | 95 % de las fichas | Fichas con categoría y barrio oficial confirmados ÷ aprobadas |
| El sugeridor ayuda y no estorba | Proporción de sugerencias aceptadas y corregidas por las personas | [PENDIENTE: métrica de datos-ml; el sugeridor ya está en el formulario y guarda si la persona aceptó la sugerencia, pero aún no hay registros suficientes para una tasa. Referencia de laboratorio, no de uso: el modelo acierta 70,4 % de las sugerencias únicas sobre datos de OpenStreetMap] | [COMPLETAR: meta, tras medir el uso inicial] | Registro de sugerencias y de la categoría final elegida |
| La oferta de apoyo llega | Aliados conectados con al menos una convocatoria que les aplica | [PENDIENTE: número de convocatorias aprobadas y de aliados con al menos una que les aplica, el día de la entrega; «Para ti» ya existe, y el vigía todavía no corre solo] | 30 % de los aliados | Convocatorias aprobadas y vistas desde «Para ti» (componente 12) |
| Diálogo con el territorio | Negocios entrevistados | 0 al inicio del piloto | 30 negocios | Registro del equipo |
| Formación | Talleres realizados | 0 al inicio del piloto | 6 talleres | Registro del equipo |
| Tablero que se usa | Vistas y contactos mensuales de las fichas | [PENDIENTE: cifra del día de entrega] | [COMPLETAR: meta] | Contadores diarios (componente 9) |

Nota de honestidad: ninguno de estos indicadores mide empleo generado o ingresos de los negocios.
Medir el efecto en empleo exigiría un seguimiento que este piloto no contempla; se propone como
trabajo posterior (sección 8.3).

---

## 8. Discusión y sostenibilidad

### 8.1 Lo que la plataforma puede y no puede hacer

La plataforma hace visible el tejido productivo y reduce el costo de encontrarse y de enterarse de
la oferta de apoyo. Eso es una condición necesaria para mejorar el empleo y los ingresos locales,
pero **no es suficiente**: la plataforma no garantiza por sí sola la generación de empleo digno.
Las ventas, la formalización y el empleo dependen de la demanda, del crédito, de las condiciones
del trabajo y de decisiones que están fuera del alcance de un directorio con un tablero. Por eso los
indicadores de la sección 7 miden visibilidad, conexión e inclusión, y no prometen resultados de
ingreso.

### 8.2 Riesgos de sesgo y de exclusión, y su mitigación

| Riesgo | A quién afecta | Mitigación |
|---|---|---|
| OpenStreetMap ve más lo formal y lo que está sobre vías principales; su cobertura es parcial (320 establecimientos mapeados, 201 de ellos con nombre, frente a 2.626 empresas en el registro mercantil, dos cifras que no son comparables como porcentaje). Proporción de locales de la comuna ubicados en la mitad norte del recuadro: [PENDIENTE: métrica de datos-ml, el pipeline aún no la calcula] | Si el mapa abierto orienta dónde se trabaja, quedan por fuera los negocios en casa de la ladera alta | Censo de campo con registro asistido en los barrios con menos puntos; meta explícita de inclusión de informales (al menos 40 %) |
| El clasificador aprendió de nombres de comercios del Valle de Aburrá, muchos de cadenas y del centro; sus etiquetas vienen de OpenStreetMap sin revisión manual y no se ha validado con registros propios | Negocios con nombre propio o de categorías con pocos ejemplos (por ejemplo, barbería, con 13). Además, a veces sugiere con confianza alta una categoría errónea (por ejemplo, «Misceláneo El Vecino» como «comidas», con 0,90) | Umbral de confianza: por debajo, el sistema pregunta en lugar de sugerir; el modelo solo sugiere, y la persona y el moderador deciden; cada corrección reentrena con datos de Manrique |
| La descripción libre de OpenStreetMap puede contener datos que identifican a una persona | Titulares de los comercios mapeados | La descripción no se publica ni sale en las constelaciones; solo se muestran dirección, horario, tipo de cocina y web cuando OpenStreetMap los trae; el pipeline no conserva teléfonos, contactos ni correos |
| El registro mercantil solo ve lo formal: en las 24 ciudades que mide el DANE, 13,0 % de los micronegocios tiene registro en Cámara de Comercio (DANE, 2026). Esa cifra no es de Manrique y no se usa para estimar cuántos negocios informales hay en la comuna | Medir la cobertura contra la Cámara invisibilizaría a la mayoría | La cobertura se mide contra lo observado en campo y en el mapa abierto, no contra la Cámara; las 2.626 empresas registradas se muestran como una mirada más, no como el universo |
| Los proveedores de lenguaje del asesor reciben la ficha del negocio | Titulares de datos, que no han sido informados de ese tratamiento (Ley 1581 de 2012) | La política de datos ya nombra a los proveedores y los datos que reciben, y la versión de términos subió a `2026-10-v5` (implementado en el repositorio; [PENDIENTE: confirmar el despliegue]). El asesor solo funciona con sesión; no se envían respuestas de investigación a proveedores que entrenan con lo recibido |
| La edición del dueño publica directo, sin revisión previa | Vecinos y clientes que leen la vitrina: una ficha editada con un dato equivocado o abusivo queda visible hasta que alguien lo corrige | Bitácora de cada cambio (campos, quién y cuándo), alertas de calidad en el panel del equipo y corrección por el equipo; los registros nuevos y las fichas rechazadas siguen pasando por moderación. No hay todavía una medición de cuántas ediciones se corrigen [PENDIENTE] |
| Una entidad con acceso a su panel podría llegar a datos de negocios | Titulares de datos | La entidad solo lee agregados con k = 5 y sus propias propuestas; lo comprueba un verificador automático; el acceso lo da el equipo, no la entidad |
| Con pocos negocios, los agregados permitirían reidentificar a alguien | Los negocios de celdas pequeñas | Supresión de celdas con menos de cinco negocios; los textos de búsqueda no se guardan |
| La brecha entre aliados y establecimientos podría leerse como «fracaso» o como «cobertura» | Lectores del tablero (JAL, comunidad) | Se rotula como **línea base**; el tablero explica la diferencia entre universo observado y red |
| Brecha digital: quien no usa celular no se registra por su cuenta | Personas mayores y negocios sin tecnología | Registro asistido con consentimiento; enlace privado por negocio |
| Exceso de confianza en la IA | Todos | El modelo sugiere y nunca decide; el asesor responde solo con un catálogo cerrado y con reglas contra inventar programas |

### 8.3 Sostenibilidad técnica y organizativa

- **Quién mantiene la plataforma al terminar el piloto.** El plan es entregar a la Junta
  Administradora Local y al Centro del Valle del Software de Manrique el tablero, la
  documentación de operación y la capacitación de quienes lo operen. **[PENDIENTE: acuerdo
  firmado con cada entidad antes de afirmar que asumen el mantenimiento]**
- **Costo recurrente.** Estimado en USD 30 a 40 por mes para un uso diez veces mayor que el actual
  (Equipo Constelaciones, 2026a); el costo de personas, sobre todo de moderación, no está
  cuantificado porque no hay datos de volumen.
- **Moderación humana.** Ningún registro nuevo ni ninguna convocatoria se publica sin aprobación
  de una persona; las ediciones de una ficha ya aprobada, en cambio, se publican directo y el
  equipo las corrige después guiado por la bitácora y las alertas de calidad. Ese es el costo
  humano real del modelo y se debe asignar a alguien con nombre.
- **Alojamiento.** El plan gratuito actual no permite uso comercial; con financiación hay que pasar
  a un plan de pago (Equipo Constelaciones, 2026a).
- **Automatización.** El vigía de convocatorias y la actualización semanal del pipeline están
  pensados para ejecutarse con GitHub Actions. **[PENDIENTE: confirmar que ese servicio está
  habilitado y es gratuito para este repositorio; la cuenta tiene hoy presupuesto de $0 en Actions y la
  integración continua se retiró]**. Según la documentación del proveedor, los flujos programados se
  pausan tras 60 días sin actividad en el repositorio; debe haber una persona responsable de
  reactivarlos. **[PENDIENTE: verificar en la documentación vigente de GitHub]**
- **Calidad de los datos externos.** Las páginas oficiales cambian; el vigía debe marcar los
  enlaces rotos y alguien debe revisar la lista de fuentes cada trimestre.
- **Dependencias externas sin garantía.** El mapa base y el servicio de geocodificación gratuitos
  pueden cambiar sin aviso (ya ocurrió con un proveedor de teselas); la documentación del
  repositorio deja el plan de reemplazo (Equipo Constelaciones, 2026a).
- **Medición de efectos.** Un seguimiento de empleo e ingresos de los negocios queda fuera del
  piloto y se propone como trabajo posterior.

### 8.4 Dimensión económica y de pautas: condicionada a la cesión de derechos

Los términos de referencia ceden al ITM los derechos patrimoniales de lo producido en la
convocatoria. El repositorio del equipo tiene hoy licencia MIT y es público. Mientras el ITM no
responda cómo se concilian ambos hechos, el equipo **no plantea un modelo comercial**. Lo
siguiente es lo que se afirma y lo que se deja condicionado:

**Se afirma, sin condición:**

- El servicio es gratuito para los negocios.
- No se venden ni se ceden datos personales de los negocios, y ningún dato nuevo se les pide.
- El valor del piloto (sección 6) se propone para financiación pública, por Presupuesto
  Participativo.

**Queda condicionado a la respuesta del ITM:**

- Cualquier forma de ingreso recurrente (pautas, patrocinios de entidades, servicios de pago para
  entidades que usen el tablero) para cubrir el mantenimiento posterior al piloto.
- La continuidad de la licencia MIT del código ya publicado.
- Quién actúa como responsable del tratamiento de datos personales (Ley 1581 de 2012) cuando se
  ceden los derechos.
- Si el equipo, una entidad de la comuna o el ITM operan el servicio después de la entrega.

**Pregunta abierta al ITM (por enviar antes de hablar de modelo comercial):**

> Los términos de referencia de Territorio INN 2026 ceden al ITM los derechos patrimoniales de lo
> producido en la convocatoria. Nuestro repositorio tiene licencia MIT y fue publicado antes de la
> convocatoria. ¿(1) La cesión alcanza al código ya publicado? ¿(2) Podemos mantener la licencia
> MIT del código y ceder solo lo producido durante el piloto? ¿(3) Si el ITM es titular, quién opera
> el servicio y asume la responsabilidad de datos personales después del piloto? ¿(4) Se pueden
> recibir pautas, patrocinios o pagos de entidades por el uso del tablero para sostener su
> operación, y bajo qué condiciones?

**[PENDIENTE: respuesta del ITM]**

---

## Anexo A. Cifras con fuente

Todas las cifras de este documento salen de esta tabla o están marcadas como pendientes. Las cifras
fueron tomadas de la asesoría técnica del 1 de octubre de 2026, que las consultó en la fuente
original ese día; se cita siempre la fuente original, no la asesoría. Las cifras de la Cámara de
Comercio y de la ficha del Departamento Administrativo de Planeación marcadas con «leída del archivo
original» fueron verificadas contra el documento el 1 de octubre de 2026. **[PENDIENTE: un integrante
del equipo contrasta los demás valores (población, área, desempleo, índice de calidad de vida y
cifras del DANE) con el documento original antes de entregar; en esta redacción no se pudo abrir el
boletín del DANE del 30 de julio de 2026.]**

| Dato | Valor | Fuente original | Fecha de consulta |
|---|---|---|---|
| Población de la Comuna 3 | 162.374 habitantes (año 2019) | Alcaldía de Medellín, Departamento Administrativo de Planeación (2021) | 1 de octubre de 2026 |
| Área de la Comuna 3 | 5,10 km² (el polígono del sitio mide 5,13 km²) | Alcaldía de Medellín, Departamento Administrativo de Planeación (2021) y GeoMedellín | 1 de octubre de 2026 |
| Desempleo, Comuna 3 frente a Medellín | 13,16 % frente a 12,2 % (año 2019, Gran Encuesta Integrada de Hogares) | Alcaldía de Medellín, Departamento Administrativo de Planeación (2021) | 1 de octubre de 2026 |
| Índice de calidad de vida, Comuna 3 frente a Medellín | 37,88 frente a 49,00 (año 2019) | Alcaldía de Medellín, Departamento Administrativo de Planeación (2021) | 1 de octubre de 2026 |
| Micronegocios con RUT / con registro en Cámara de Comercio | 31,6 % / 13,0 % (24 ciudades) | DANE (2026), boletín del 30 de julio de 2026 | 1 de octubre de 2026 |
| Micronegocios que usan internet | 75,8 % (24 ciudades) | DANE (2026) | 1 de octubre de 2026 |
| Peso de Medellín A. M. entre los micronegocios de las 24 ciudades | 17,5 % | DANE (2026) | 1 de octubre de 2026 |
| Hogares con jefatura femenina, Comuna 3 | 53,68 % (Encuesta de Calidad de Vida 2018; ficha de 2021) | Alcaldía de Medellín, Departamento Administrativo de Planeación (2021); leída del archivo original | 1 de octubre de 2026 |
| Hurto a establecimientos comerciales, Comuna 3 frente a Medellín | 89 casos frente a 4.555 (año 2019, SIJIN/SIEDCO) | Alcaldía de Medellín, Departamento Administrativo de Planeación (2021); leída del archivo original | 1 de octubre de 2026 |
| Empresas registradas en Manrique | 2.626 (comerciantes matriculados y renovados en 2025; Tabla 16) | Cámara de Comercio de Medellín para Antioquia (2025), Base del Registro Mercantil; leída del archivo original | 1 de octubre de 2026 |
| Empresas de Manrique por tamaño según activos | 2.569 microempresas (97,8 %), 51 pequeñas, 4 medianas, 2 grandes (Tabla 14) | Cámara de Comercio de Medellín para Antioquia (2025); leída del archivo original | 1 de octubre de 2026 |
| Empresas de Manrique por sector (seis mayores) | Comercio 1.091; industria manufacturera 309; alojamiento y comida 288; construcción 216; otras actividades de servicios 149; actividades profesionales, científicas y técnicas 130 (Tabla 16) | Cámara de Comercio de Medellín para Antioquia (2025); leída del archivo original | 1 de octubre de 2026 |
| Barrios oficiales de la Comuna 3 | 15 | Alcaldía de Medellín (2000), Decreto 346 de 2000, y geocatálogo de la Alcaldía (s. f.). Polígonos usados para calcular el barrio: Alcaldía de Medellín, archivo entregado al equipo (2026), recortado el 2 de octubre de 2026 | 1 de octubre de 2026 (número de barrios); 2 de octubre de 2026 (polígonos) |
| Establecimientos mapeados en OpenStreetMap | 5.423 comercios con nombre en el Valle de Aburrá (snapshot 04:40 UTC); 320 en la Comuna 3, 201 con nombre y 119 sin nombre (snapshot 17:01 UTC). Ambos del 2 de octubre de 2026, servidor principal de Overpass | OpenStreetMap contributors (2026), licencia ODbL; `pipeline/README.md` y `pipeline/reporte_modelo.md` | Corrida del 2 de octubre de 2026 |
| Mandato local | Línea 4 Económica: «red estratégica con los pequeños comerciantes» (PDL Comuna 3, p. 114) | Alcaldía de Medellín (s. f.) | 1 de octubre de 2026 |

Notas sobre las cifras:

- **Barrios.** La ficha del Departamento Administrativo de Planeación lista por error «Campo Valdés
  No. 1», que pertenece a la Comuna 4; el barrio oficial de la Comuna 3 es «Campo Valdés No. 2».
- **Hurto.** La ficha usa «hurto a establecimientos comerciales» con datos de 2019. Se cita como
  contexto de seguridad del comercio local, no como causa de la baja visibilidad.
- **Jefatura femenina y registro mercantil.** Ni la jefatura femenina de los hogares ni las 2.626
  empresas registradas dicen cuántos negocios informales hay: el registro mercantil solo ve lo que
  está matriculado.

- Las cifras del DANE son de **24 ciudades**, no de Manrique; en ningún lugar del documento se
  presentan como cifras de la comuna.
- Las cifras de desempleo y de calidad de vida son de 2019. Aunque la ficha es de 2021, **no son datos
  actuales**.
- Las cifras del pipeline (establecimientos mapeados, constelaciones, locales sueltos, tamaño de la
  muestra de entrenamiento y puntajes F1) son de la corrida del 2 de octubre de 2026 y se
  reproducen con `pipeline/`. Dependen de snapshots de OpenStreetMap del 2 de octubre de 2026
  (servidor principal de Overpass; 04:40 UTC para el Valle y 17:01 UTC para la Comuna 3); una
  descarga posterior puede dar números distintos. La asesoría contó 312 establecimientos (198 con
  nombre, 114 sin nombre) con un snapshot del 1 de octubre y la misma metodología: la diferencia
  con los 320 es de la base de datos, no del comercio. Cifras de corridas anteriores que no deben
  leerse como vigentes: 205 (solo con nombre, snapshot de la mañana), 192 (espejo con snapshot del 6
  de mayo de 2026), 12 constelaciones, 125 agrupados y 80 sueltos. Se dicen siempre como
  «establecimientos mapeados en OpenStreetMap», nunca como «negocios que hay».
- Quedan marcados como pendientes los valores que el pipeline todavía no produce: proporción de
  locales en la mitad norte del recuadro, revisión manual de etiquetas y validación con registros
  propios.

## Referencias

Alcaldía de Medellín, Departamento Administrativo de Planeación. (2021). *Comuna 3: Manrique.
Ficha de caracterización*.
https://www.medellin.gov.co/irj/go/km/docs/pccdesign/medellin/Temas/PlaneacionMunicipal/Publicaciones/Shared%20Content/Documentos/2021/Comuna%203%20Manrique-Ficha%20Informativa.pdf

Alcaldía de Medellín. (2000). *Decreto 346 de 2000* [COMPLETAR: título completo del decreto y URL
del texto consultado].

Alcaldía de Medellín. (s. f.). *Barrios y veredas* [Capa del geocatálogo de la Alcaldía de
Medellín]. https://www.medellin.gov.co/giscatalogacion4/srv/api/records/61a04bc9-2991-4495-8491-7f18f40a2972
[COMPLETAR: confirmar que este es el registro consultado el 1 de octubre de 2026].

Alcaldía de Medellín. (s. f.). *Plan de Desarrollo Local Comuna 3 – Manrique* [COMPLETAR: año de
publicación y URL del documento consultado].

Alcaldía de Medellín, & Instituto Tecnológico Metropolitano. (2026). *Términos de referencia
Territorio INN 2026* [COMPLETAR: título exacto y URL del documento].

Cámara de Comercio de Medellín para Antioquia. (2025). *Estructura empresarial 2025* [Base del
Registro Mercantil: comerciantes matriculados y renovados en 2025]. [COMPLETAR: año de publicación
si difiere y URL del archivo consultado el 1 de octubre de 2026].

Campello, R. J. G. B., Moulavi, D., & Sander, J. (2013). Density-based clustering based on
hierarchical density estimates. En J. Pei, V. S. Tseng, L. Cao, H. Motoda, & G. Xu (Eds.),
*Advances in knowledge discovery and data mining* (pp. 160–172). Springer.
https://doi.org/10.1007/978-3-642-37456-2_14

Congreso de la República de Colombia. (2012). *Ley 1581 de 2012, por la cual se dictan
disposiciones generales para la protección de datos personales*.
http://www.secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html

Departamento Administrativo Nacional de Estadística. (2026). *Encuesta de micronegocios (EMICRON)
2025* [Boletín técnico, 30 de julio de 2026]. https://www.dane.gov.co/index.php/estadisticas-por-tema/mercado-laboral/micronegocios
[COMPLETAR: URL directa del boletín del 30 de julio de 2026].

Equipo Constelaciones. (2026a). *Arquitectura y costos* [Documento del repositorio,
`docs/arquitectura-y-costos.md`, 29 de septiembre de 2026]. [COMPLETAR: URL del repositorio público].

McInnes, L., Healy, J., & Astels, S. (2017). hdbscan: Hierarchical density based clustering.
*Journal of Open Source Software, 2*(11), 205. https://doi.org/10.21105/joss.00205

OpenStreetMap contributors. (2026). *OpenStreetMap* [Base de datos geográfica abierta, licencia
Open Database License 1.0; snapshots del 2 de octubre de 2026 (04:40 UTC para el Valle de Aburrá y 17:01 UTC para la Comuna 3) obtenidos ese día del servidor principal de la API Overpass]. https://www.openstreetmap.org/copyright

Pacheco Duarte, J. F., Galindo Gómez, S. F., & Rodríguez Pupo, S. (2022). *Ruta de innovación
social: Paso a paso para desarrollar innovaciones sociales* (Documento técnico 02). Corporación
Universitaria Minuto de Dios, Parque Científico de Innovación Social.
https://repository.uniminuto.edu/items/1a3d912c-10fb-416b-9307-98783f1e703f

Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B., Grisel, O., Blondel, M.,
Prettenhofer, P., Weiss, R., Dubourg, V., Vanderplas, J., Passos, A., Cournapeau, D., Brucher, M.,
Perrot, M., & Duchesnay, É. (2011). Scikit-learn: Machine learning in Python. *Journal of Machine
Learning Research, 12*, 2825–2830.

Servicio Nacional de Aprendizaje. (2026). *[COMPLETAR: documento con los topes de honorarios 2026
usados para el presupuesto]*. [COMPLETAR: URL y fecha de consulta].

*(Referencia pendiente: [COMPLETAR: la capa de barrios usada para calcular el barrio por punto en
polígono es un archivo que la Alcaldía entregó al equipo; el repositorio solo registra «Alcaldía de
Medellín, polígonos de barrios, 2026». Indicar título, año y URL o responsable del archivo, o
confirmar que coincide con el registro del geocatálogo citado arriba.])*
