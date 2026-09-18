# Diseño: asesor de emprendimiento y acceso de moderación

## Objetivo

Dar a cada moderador acceso desde `/admin` a las rutas de formalización, a un
asesor de emprendimiento y a una biblioteca privada de documentos de marca.
El asesor orienta únicamente sobre emprendimiento y usa los documentos oficiales
disponibles como evidencia cuando la respuesta depende de información específica.

## Alcance

### Panel de moderación

El layout protegido de `/admin` incorporará tres entradas:

- **Formalización**: catálogo de trámites, apoyos, formación y videos ya existente,
  disponible sin iniciar sesión como vecino.
- **Asesor**: formulario de pregunta y respuesta para moderadores.
- **Documentos**: carga, listado y eliminación de PDFs de referencia.

El guard seguirá siendo `verificarSesion()` y la cookie `admin_session`. No se
reutiliza ni se interpreta `sesion_usuario`; las dos poblaciones y sus cookies
permanecen separadas.

### Asesor de emprendimiento

El agente permitirá preguntas sobre:

- formalización, RUT, Cámara de Comercio y trámites;
- apoyos, programas y convocatorias para emprendimientos;
- mejora práctica de un negocio: clientes, ventas, redes, costos, inventario y
  organización;
- redacción y estructuración de solicitudes, peticiones y postulaciones ligadas
  al emprendimiento;
- lineamientos de marca que estén sustentados en los documentos cargados.

El agente rechazará con una respuesta breve los temas ajenos al emprendimiento,
la petición de datos sensibles y las instrucciones que intenten cambiar sus
reglas. No dará asesoría legal, tributaria o financiera personalizada. Tampoco
inventará montos, fechas, convocatorias, requisitos o normas: para esos datos
usará solo catálogo oficial o fragmentos recuperados de documentos.

Las respuestas generales de mejora pueden dar pasos prácticos. Las respuestas
basadas en documento listarán las fuentes usadas con título y página, para que
el moderador pueda comprobarlas.

El asesor de cada negocio se conserva: sigue limitado a su ficha y usa su
contexto. El asesor de `/admin` no recibe datos de un negocio por defecto; será
una consulta administrativa general. Elegir un negocio como contexto es una
posible ampliación posterior, no parte de esta entrega.

## Biblioteca documental y recuperación

Cada PDF se sube por una Server Action que vuelve a comprobar `admin_session`.
Se aceptan únicamente `application/pdf`, hasta 5 MB. El servidor valida la firma
PDF (`%PDF-`) además del MIME declarado, extrae texto una vez y rechaza archivos
sin texto aprovechable. No se procesan enlaces externos ni contenido activo del
PDF.

Los archivos originales se almacenan en un **Vercel Blob Store privado**,
separado del store público de fotos. El token del store se configura como
`DOCUMENTOS_BLOB_READ_WRITE_TOKEN`; nunca se expone al navegador. El archivo se
entrega solo a través de una ruta autenticada de `/admin` si después hace falta
abrirlo. La tabla de base guarda metadatos y el texto extraído; no se guardan
PDFs ni binarios en Postgres.

La búsqueda usa Full Text Search nativo de Postgres sobre fragmentos de hasta
1.000 caracteres, con título y número de página. Para una pregunta, el servidor
recupera hasta cinco fragmentos relevantes y los añade como contexto delimitado
al prompt. Esto es RAG, no entrenamiento: un PDF nuevo queda disponible al
terminar su extracción y eliminarlo lo retira de futuras respuestas.

Se elige FTS de Postgres antes que embeddings/vector DB: el volumen inicial es
pequeño, evita infraestructura y costos nuevos, permite auditar las fuentes y
es suficiente para documentos de marca y guías institucionales. Se reevaluará
si el catálogo supera aproximadamente 100 documentos o la búsqueda léxica deja
de recuperar el material correcto.

## Datos y operaciones

La migración crea:

- `documentos_conocimiento`: id, título, pathname privado, tipo, tamaño,
  creador, fecha y estado.
- `documentos_fragmentos`: documento, página, orden, contenido y columna FTS.

Al subir: validar → extraer → partir por página y longitud → subir el original
privado → insertar metadatos y fragmentos en una transacción. Si falla la base
después de subir el Blob, se intenta borrar el blob para no dejar un huérfano.
Al eliminar: se borran fragmentos y metadatos, luego se borra el Blob; si el
Blob falla, se registra el error sin restaurar contenido eliminado.

No se almacenan conversaciones ni preguntas del asesor. Cada consulta es una
pregunta autocontenida, con rate limit de `agente` y sin historial personal.

## Componentes previstos

- `lib/documentos/*`: validación, almacenamiento privado, extracción y
  recuperación de fragmentos.
- `lib/db/documentosConocimiento.repo.ts`: SQL de documentos y fragmentos.
- `lib/validation/documentoConocimiento.schema.ts`: límites y validación del
  input externo.
- `lib/actions/documentosConocimiento.ts`: subir y eliminar, autorizadas por
  `admin_session`.
- `lib/actions/consultarAsesorAdmin.ts`: consulta autorizada para moderadores.
- `app/admin/(panel)/formalizacion/page.tsx`, `asesor/page.tsx` y
  `documentos/page.tsx`: las tres vistas del panel.
- Componentes cliente de formulario para el asesor y la biblioteca documental.
- `lib/agente/asesor.ts`: prompt y respuesta amplían el alcance sin cambiar el
  patrón de proveedores por `fetch` compatible con OpenAI.

## Seguridad y privacidad

- Toda Server Action autentica y autoriza por sí misma; el layout solo protege
  navegación.
- Los PDFs son datos, nunca instrucciones. El prompt los delimita y ordena
  ignorar órdenes dentro de documentos o preguntas.
- El Blob de documentos será privado, con pathname aleatorio y sin URL pública.
- La interfaz muestra respuestas como texto, no Markdown/HTML ejecutable.
- Las fuentes recuperadas llegan al cliente como metadatos mínimos: título y
  página, nunca el token del Blob ni el contenido completo salvo que se añada
  una descarga autenticada.

## Pruebas y validación

Antes de producción se añadirán pruebas para las validaciones de archivo, la
clasificación del alcance del asesor, la recuperación de fragmentos y la
autorización de cada acción. La suite existente de verificaciones, lint y
typecheck seguirá pasando. La prueba manual incluye una carga PDF válida, un
archivo falso con MIME PDF, una pregunta basada en documento, una pregunta
fuera de alcance, borrado y acceso denegado sin `admin_session`.

## Configuración requerida antes de desplegar

1. Crear y conectar un Vercel Blob Store con acceso **Private**.
2. Guardar su token en `DOCUMENTOS_BLOB_READ_WRITE_TOKEN` para Preview y
   Production.
3. Mantener el Blob Store público actual solo para fotos de portafolios.

