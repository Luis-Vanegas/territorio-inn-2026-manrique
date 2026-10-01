# Constelaciones · Manrique

**La red de negocios de la Comuna 3 y su tablero de datos, Firmamento**

Territorio INN 2026 · Línea 1 Socioeconómica · Reto #2 Empleo y Desarrollo Económico · Comuna 3 – Manrique

Documento técnico completo. Versión de trabajo del 1 de octubre de 2026; entrega del concurso: 11 de octubre de 2026.

> **Cómo leer las marcas de este documento**
>
> - `[PENDIENTE: métrica de datos-ml]` indica un valor que produce el pipeline de datos y aprendizaje automático y que aún no está calculado de forma reproducible. No se cita ninguna cifra de ese pipeline hasta que exista.
> - `[PENDIENTE: ...]` con otra descripción indica un dato que depende de otra persona o de otro proceso.
> - `[COMPLETAR]` indica un dato personal o administrativo que completan los integrantes.
> - «En desarrollo» indica una pieza que se construye en octubre de 2026 y que **no** debe leerse como funcionando.
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
mapa del territorio. El piloto propuesto le suma Firmamento, un tablero de datos abiertos con
aprendizaje automático que mide el territorio y la distancia entre el territorio y la red, sin
pedirle datos sensibles a ningún negocio: sugiere la categoría de un negocio a partir de su
nombre, agrupa los comercios en «constelaciones» por cercanía y avisa de convocatorias oficiales
que encajan con cada negocio. Para los negocios el servicio es gratis siempre; el piloto de seis
meses tiene un valor estimado de $108.184.164, financiable con Presupuesto Participativo y
condicionado a la cesión de derechos al ITM. La plataforma hace visible el tejido productivo; no
garantiza por sí sola empleo digno.

*(Extensión: 150 palabras aproximadamente. Contar de nuevo en el procesador de texto antes de entregar.)*

## Palabras clave

Economía popular · Georreferenciación · Aprendizaje automático · Datos abiertos · Agrupamiento
espacial (constelaciones comerciales) · Comuna 3 Manrique

---

## Estado de la plataforma: qué existe hoy y qué está en desarrollo

Este cuadro separa lo que funciona en producción de lo que se construye durante octubre. Todo lo
que dice «En desarrollo» se describe en el resto del documento como diseño, no como resultado.

| Pieza | Estado al 1 de octubre de 2026 | Evidencia |
|---|---|---|
| Directorio de negocios con mapa, registro público sin cuenta y moderación humana antes de publicar | En producción | `README.md`; `docs/arquitectura-y-costos.md` §1 |
| Consentimiento: versión de términos guardada, dos casillas obligatorias, hash de IP en el registro de consentimiento | En producción | `docs/arquitectura-y-costos.md` §2.5 |
| Registro asistido (para quien no usa celular), con consentimiento y persona que captura exigidos por restricción de base | En producción | `AGENTS.md`, patrón «Dos puertas, una ficha» |
| Ingreso de vecinos con Google (identidad por `google_sub`, no por correo) y «Mi cuenta» | En producción | `docs/arquitectura-y-costos.md` §2.2 |
| Asesor de formalización con catálogo cerrado de trámites y apoyos, proveedores de lenguaje gratuitos con rotación, solo con sesión | En producción | `docs/arquitectura-y-costos.md` §1 y §2.1 |
| Guías de Marca y de Ventas para los aliados; «Mis clientes» (CRM mínimo con nombre, teléfono y nota) | Implementado en el repositorio | `AGENTS.md`; `lib/content.ts` |
| Analítica agregada sin cookies: visitas por día y vistas y contactos por negocio y día; sin IP, sin recorridos | En producción | `docs/analitica.md` |
| Validación geográfica del punto contra el polígono de la comuna | En producción | `docs/analitica.md`, «Seguridad del sitio» |
| Firmamento (tablero público), mapa estelar de constelaciones | **En desarrollo** | `docs/plan-reto-2026-10.md`, Fases 1 y 3 |
| Sugeridor de categoría en el registro | **En desarrollo** | Fases 1 y 2 |
| `/api/datos` (agregados con supresión de celdas pequeñas) | **En desarrollo** | Fase 2 |
| Vigía de convocatorias, «Para ti», «Tu negocio en números» | **En desarrollo** | Fases 2 y 3 |
| Barrio oficial calculado por punto en polígono (corrige además la lista de barrios) | **En desarrollo** | Fase 2, hallazgo A1 de la asesoría |
| Campos personalizados públicos solo si están marcados; hash y purga de la IP de registro | **En desarrollo** | Fase 2, hallazgo A2 |
| Política de datos que nombra a los proveedores de IA y nueva versión de términos | **En desarrollo** | Fase 2, hallazgo A3 |

---

## 4.2 Producto de datos: Firmamento

### Qué es y qué no es

Firmamento es un tablero público, de lectura, que mide **el territorio y la distancia entre el
territorio y la red**, no solo a Constelaciones. Se organiza en tres capas y ninguna le pide un
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
- **Las búsquedas se guardan como la categoría inferida**, nunca como el texto escrito por la persona.
- **Toda cifra lleva fuente y fecha** debajo; ninguna pieza usa datos simulados.
- **Los colores de categoría solo identifican**, nunca juzgan; cada categoría se distingue
  también por forma o letra (daltonismo).
- **Atribución obligatoria** en cualquier vista del mapa: «© colaboradores de OpenStreetMap (ODbL)»
  (OpenStreetMap contributors, 2026).

### Componentes

| # | Componente del tablero | Capa | Indicador que muestra | Cómo se calcula | De dónde sale el dato | Actualización | Estado |
|---|---|---|---|---|---|---|---|
| 1 | Cielo de hoy | Territorio | Establecimientos comerciales visibles en el mapa abierto dentro del polígono oficial de la comuna | Conteo de elementos de OpenStreetMap con nombre y etiqueta comercial dentro de `lib/geo/manrique.json`, con duplicados y coordenadas fuera del polígono descartados | OpenStreetMap vía API Overpass (OpenStreetMap contributors, 2026). Valor: [PENDIENTE: métrica de datos-ml] | Semanal, por flujo automático; cada salida lleva fecha y fuente | En desarrollo |
| 2 | Mapa estelar | Territorio | Constelaciones comerciales (nodos de comercio vecino) y locales sueltos | Agrupamiento por densidad (HDBSCAN) sobre coordenadas en metros; centroide, radio, mezcla de categorías y árbol de expansión mínima para dibujar. Resultado: [PENDIENTE: métrica de datos-ml] | Salida del paso 2 del pipeline (`constelaciones.json`) | Semanal | En desarrollo |
| 3 | Tabla de constelaciones | Territorio | Por constelación: número de locales, categorías presentes y barrio dominante | Resumen del paso anterior; al tocar una fila se enciende en el mapa | Mismo origen que el componente 2 | Semanal | En desarrollo |
| 4 | Contexto del territorio | Territorio | Población, área, desempleo e índice de condiciones de vida de la comuna frente a la ciudad | Valores publicados, sin cálculo propio (Anexo A) | Alcaldía de Medellín, Departamento Administrativo de Planeación (2021) | Anual, cuando se publique una ficha nueva | En desarrollo (los datos son estáticos) |
| 5 | Referencia nacional de micronegocios | Territorio | Proporción de micronegocios con RUT, con registro en Cámara de Comercio y que usan internet | Valores publicados para las 24 ciudades; se rotulan como referencia de ciudades, no de Manrique | DANE, EMICRON 2025 (2026) | Anual | En desarrollo |
| 6 | Brecha territorio-red («embudo de visibilidad») | Red | Razón entre negocios aprobados en Constelaciones y establecimientos visibles en el mapa abierto, y de ahí a contactos | Aprobados ÷ establecimientos OSM; vistas y contactos en 30 días. Se rotula como **línea base**, no como cobertura del universo (ver sección 8.2) | `/api/datos` y paso 1 del pipeline | Cada hora (caché) | En desarrollo |
| 7 | Red por categoría, barrio y constelación | Red | Número de aprobados por categoría, por barrio oficial y por constelación | Conteo con supresión: si n < 5, se muestra «<5» | `/api/datos` (solo aprobados; barrio por punto en polígono) | Cada hora (caché) | En desarrollo |
| 8 | Formas de pago y formalidad declarada | Red | Distribución agregada de medios de pago y de formalidad declarada | Conteo con supresión (k = 5). **[PENDIENTE: confirmar con el equipo de integración si la formalidad agregada se publica o queda solo en el panel]** | `/api/datos` | Cada hora | En desarrollo |
| 9 | Uso del sitio | Uso | Vistas de ficha y contactos iniciados en los últimos 30 días | Suma de contadores diarios ya existentes; no hay evento individual ni identificador | Tabla de interacciones por negocio, día y tipo (`docs/analitica.md`) | Diaria | Datos existen; vista pública en desarrollo |
| 10 | Búsquedas sin resultado | Uso | Categorías que la gente busca y no encuentra en la red | Categoría inferida de la búsqueda; el texto original no se guarda | `/api/datos` | Cada hora | En desarrollo |
| 11 | Sugeridor en vivo | Uso | Muestra el modelo respondiendo: categoría más probable y probabilidad, o las tres más probables si la confianza es baja | Inferencia en el navegador; ver 4.3 | Modelo exportado por el paso 3 del pipeline | Cuando se reentrena | En desarrollo |
| 12 | Vigía de convocatorias | Uso | Convocatorias oficiales nuevas, revisadas por una persona, y cuántas se aprobaron | Revisión diaria de páginas oficiales; todo entra como pendiente hasta que un moderador lo aprueba | Páginas oficiales de Fondo Emprender, Bancóldex, Ruta N, Cámara de Comercio, SENA e iNNpulsa | Diaria | En desarrollo |
| 13 | Indicadores con meta | Red y uso | Avance frente a las metas de la sección 7 | Cálculo directo sobre los componentes anteriores | `/api/datos` | Cada hora | En desarrollo |

Hay al menos un componente de cada capa: territorio (1 a 5), red (6 a 8) y uso (9 a 12).

### Fuentes de datos para el pipeline en Python

| Fuente | Qué aporta | Estado |
|---|---|---|
| OpenStreetMap por API Overpass (licencia ODbL) | Comercios con nombre del Valle de Aburrá (entrenamiento) y de la Comuna 3 (aplicación) | Script en desarrollo |
| DANE, EMICRON 2025: boletines y anexos | Contexto de micronegocios en 24 ciudades | Disponible |
| Estructura Empresarial 2025 de la Cámara de Comercio | Cifra de empresas registradas en Manrique. Valor: [PENDIENTE: cifra de empresas de Manrique, que el equipo ya procesa con `scripts/procesar-camara-comercio.py`] | Descargada; procesada por el equipo |
| Exportación CSV del panel de moderación | Datos propios agregables de la red | En producción |
| `/api/datos` | Agregados públicos con supresión | En desarrollo |

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
  la muestra: [PENDIENTE: métrica de datos-ml].
- **No se entrena con los registros propios de la red:** son pocos y el entrenamiento sería
  inestable. Los registros propios son donde se aplica el modelo; las correcciones de los
  moderadores se suman después a los datos de entrenamiento.

| Variable | Papel | Tipo | Fuente | Modelo |
|---|---|---|---|---|
| Nombre del negocio | Entrada | Texto corto | Formulario de registro (en entrenamiento: campo `name` de OpenStreetMap) | 1 |
| Descripción del negocio | Entrada opcional | Texto corto | Formulario de registro | 1 |
| Frecuencia ponderada de secuencias de 2 a 4 caracteres dentro de cada palabra (TF-IDF de n-gramas) | Variable derivada | Numérica dispersa | Calculada a partir de las anteriores | 1 |
| Categoría del sitio | Salida (etiqueta) | Categórica, un grupo de categorías del sitio | En entrenamiento: etiqueta de OpenStreetMap traducida; en uso: elección final de la persona | 1 |
| Probabilidad de la categoría | Salida | Numérica entre 0 y 1 | Calculada por el modelo | 1 |
| Umbral de confianza | Parámetro de uso | Numérica | Diseño del producto: por debajo de 0,45 la interfaz pregunta y muestra las tres más probables. **[PENDIENTE: confirmar el umbral definitivo tras el reentrenamiento]** | 1 |

- **Técnica:** TF-IDF de n-gramas de caracteres con bordes de palabra más regresión logística
  (Pedregosa et al., 2011).
- **Evaluación:** validación cruzada estratificada; se reporta F1 macro frente a una línea base de
  clase mayoritaria, y la matriz de confusión. Resultado: [PENDIENTE: métrica de datos-ml].
- **Por qué esta técnica y no una red neuronal:** el nombre de un comercio es un texto de dos o
  tres palabras y los ejemplos etiquetados son pocos miles. En ese tamaño una red neuronal no
  aporta una mejora que se pueda justificar, es más difícil de explicar a un jurado y a un
  moderador, y no cabe con facilidad en el navegador. La regresión logística es liviana,
  entrega una probabilidad que permite aplicar un umbral de confianza, y corre **en el navegador
  del vecino**, sin servidor de inferencia, sin API y sin costo.
- **Uso previsto y límites:** sugiere; la persona y el moderador deciden. Puede equivocarse con
  nombres propios («Dulce Poema») y con categorías con pocos ejemplos, y aprendió de nombres de
  comercios en los que pesan las cadenas y el centro de la ciudad. Los límites medidos por
  categoría se publicarán en la ficha del modelo: [PENDIENTE: métrica de datos-ml].
- **Reentrenamiento:** periódico (propuesta: cada trimestre o cada cien correcciones de moderador),
  sumando las correcciones propias a los datos de OpenStreetMap.

### Modelo 2: constelaciones comerciales (agrupamiento espacial)

- **Tarea:** encontrar nodos de comercio vecino y distinguir los locales aislados.

| Variable | Papel | Tipo | Fuente | Modelo |
|---|---|---|---|---|
| Latitud y longitud del establecimiento | Entrada | Numérica | OpenStreetMap (y, en el futuro, fichas aprobadas) | 2 |
| Coordenadas proyectadas a un sistema métrico local | Variable derivada | Numérica, en metros | Conversión de las anteriores (proyección plana para Medellín) | 2 |
| Tamaño mínimo del grupo | Hiperparámetro | Entero | Punto de partida del equipo: 6. Se somete a análisis de sensibilidad | 2 |
| Muestras mínimas | Hiperparámetro | Entero | Punto de partida del equipo: 3. Se somete a análisis de sensibilidad | 2 |
| Identificador de constelación (o «suelto») | Salida | Categórica | Calculada por el modelo | 2 |
| Centroide, radio, mezcla de categorías y árbol de expansión mínima | Salida derivada | Numérica y geométrica | Calculadas a partir del grupo; el árbol define las líneas que se dibujan | 2 |

- **Técnica:** HDBSCAN (Campello et al., 2013; McInnes et al., 2017), sobre coordenadas en metros.
- **Resultado:** número de constelaciones y de locales sueltos: [PENDIENTE: métrica de datos-ml].
  Se presenta como **resultado exploratorio** que se valida en campo durante el piloto.
- **Por qué esta técnica y no K-Means:** K-Means obliga a fijar de antemano cuántos grupos hay y a
  asignar *todos* los puntos a algún grupo, lo que anula la idea de «local suelto». Además supone
  grupos de forma redonda y tamaño similar, y una calle comercial es alargada. HDBSCAN no
  necesita el número de grupos, admite densidades distintas y deja fuera, como ruido, lo que no
  pertenece a ningún nodo. Esa propiedad es la que se necesita para orientar el trabajo de campo.
- **Por qué esta técnica y no una red neuronal:** no hay etiquetas de «constelación» que
  aprender; es un problema sin supervisión y con pocos cientos de puntos.
- **Límites:** OpenStreetMap ve más lo formal y lo que está sobre vías principales, por lo que la
  agrupación subestima la ladera alta. Por eso el piloto incluye un censo de campo (sección 5).

### Variables de la red y del uso (no entran a un modelo; alimentan los agregados)

| Variable | Tipo | Fuente | Tratamiento de privacidad |
|---|---|---|---|
| Categoría | Categórica | Registro | Agregado con k = 5 |
| Barrio oficial | Categórica | Calculado por punto en polígono con la capa de barrios de GeoMedellín | Agregado con k = 5; no se publica la coordenada |
| Constelación | Categórica | Modelo 2 | Agregado con k = 5 |
| Origen de registro (propio o asistido) | Categórica | Registro | Agregado con k = 5; sirve para medir inclusión |
| Medios de pago | Categórica múltiple | Registro | Agregado con k = 5 |
| Formalidad declarada | Categórica | Investigación del registro (privada) | Solo agregada, con k = 5, y sujeta a la confirmación indicada en 4.2 |
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
| 1. Alistar | Ajustes de la plataforma (barrios, campos públicos, política de datos); acuerdos de trabajo con la Junta Administradora Local, CEDEZO y el Centro del Valle del Software de Manrique; definición de la línea base del tablero | Plataforma ajustada; actas de acuerdo; línea base publicada con fuente y fecha | 1–3 |
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
| Registros asistidos efectivos | Aliados con origen «asistido» y consentimiento verificable | [PENDIENTE] | [COMPLETAR: meta; se propone derivarla del 40 % de informales] | Origen de registro (componente 7) |
| Información confiable | Fichas con categoría y barrio confirmados | [PENDIENTE: línea base tras calcular el barrio oficial] | 95 % de las fichas | Fichas con categoría y barrio oficial confirmados ÷ aprobadas |
| El sugeridor ayuda y no estorba | Proporción de sugerencias aceptadas y corregidas por las personas | [PENDIENTE: métrica de datos-ml] | [COMPLETAR: meta, tras medir el uso inicial] | Registro de sugerencias y de la categoría final elegida |
| La oferta de apoyo llega | Aliados conectados con al menos una convocatoria que les aplica | 0 al inicio del piloto (la función no existe) | 30 % de los aliados | Convocatorias aprobadas y vistas desde «Para ti» (componente 12) |
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
| OpenStreetMap ve más lo formal y lo que está sobre vías principales. Proporción de locales de la comuna ubicados en la mitad norte del recuadro: [PENDIENTE: métrica de datos-ml] | Si el mapa abierto orienta dónde se trabaja, quedan por fuera los negocios en casa de la ladera alta | Censo de campo con registro asistido en los barrios con menos puntos; meta explícita de inclusión de informales (al menos 40 %) |
| El clasificador aprendió de nombres de comercios, muchos de cadenas y del centro | Negocios con nombre propio o de categorías con pocos ejemplos | Umbral de confianza: por debajo, el sistema pregunta en lugar de sugerir; la persona y el moderador deciden; cada corrección reentrena con datos de Manrique |
| El registro mercantil solo ve lo formal: en las 24 ciudades que mide el DANE, 13,0 % de los micronegocios tiene registro en Cámara de Comercio (DANE, 2026) | Medir la cobertura contra la Cámara invisibilizaría a la mayoría | La cobertura se mide contra lo observado en campo y en el mapa abierto, no contra la Cámara |
| Los proveedores de lenguaje del asesor reciben la ficha del negocio | Titulares de datos, que no han sido informados de ese tratamiento (Ley 1581 de 2012) | Nombrar los proveedores en la política de datos y subir la versión de términos; no enviar respuestas de investigación a proveedores que entrenan con lo recibido. **En desarrollo** |
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
- **Moderación humana.** Nada se publica sin aprobación; ese es el costo humano real del modelo
  y se debe asignar a alguien con nombre.
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
original ese día; se cita siempre la fuente original, no la asesoría. **[PENDIENTE: un integrante
del equipo contrasta cada valor con el documento original antes de entregar; en esta redacción no se
pudo abrir el PDF de la ficha del Departamento Administrativo de Planeación ni el boletín del DANE
del 30 de julio de 2026.]**

| Dato | Valor | Fuente original | Fecha de consulta |
|---|---|---|---|
| Población de la Comuna 3 | 162.374 habitantes (año 2019) | Alcaldía de Medellín, Departamento Administrativo de Planeación (2021) | 1 de octubre de 2026 |
| Área de la Comuna 3 | 5,10 km² (el polígono del sitio mide 5,13 km²) | Alcaldía de Medellín, Departamento Administrativo de Planeación (2021) y GeoMedellín | 1 de octubre de 2026 |
| Desempleo, Comuna 3 frente a Medellín | 13,16 % frente a 12,2 % (año 2019, Gran Encuesta Integrada de Hogares) | Alcaldía de Medellín, Departamento Administrativo de Planeación (2021) | 1 de octubre de 2026 |
| Índice de calidad de vida, Comuna 3 frente a Medellín | 37,88 frente a 49,00 (año 2019) | Alcaldía de Medellín, Departamento Administrativo de Planeación (2021) | 1 de octubre de 2026 |
| Micronegocios con RUT / con registro en Cámara de Comercio | 31,6 % / 13,0 % (24 ciudades) | DANE (2026), boletín del 30 de julio de 2026 | 1 de octubre de 2026 |
| Micronegocios que usan internet | 75,8 % (24 ciudades) | DANE (2026) | 1 de octubre de 2026 |
| Peso de Medellín A. M. entre los micronegocios de las 24 ciudades | 17,5 % | DANE (2026) | 1 de octubre de 2026 |
| Mandato local | Línea 4 Económica: «red estratégica con los pequeños comerciantes» (PDL Comuna 3, p. 114) | Alcaldía de Medellín (s. f.) | 1 de octubre de 2026 |

Notas sobre las cifras:

- Las cifras del DANE son de **24 ciudades**, no de Manrique; en ningún lugar del documento se
  presentan como cifras de la comuna.
- Las cifras de desempleo y de calidad de vida son de 2019. Aunque la ficha es de 2021, **no son datos
  actuales**.
- Las cifras del pipeline de datos y aprendizaje automático (establecimientos visibles en el mapa
  abierto, número de constelaciones, locales sueltos, tamaño de la muestra de entrenamiento y
  puntaje F1) se agregarán cuando el pipeline las produzca: [PENDIENTE: métrica de datos-ml].

## Referencias

Alcaldía de Medellín, Departamento Administrativo de Planeación. (2021). *Comuna 3: Manrique.
Ficha de caracterización*.
https://www.medellin.gov.co/irj/go/km/docs/pccdesign/medellin/Temas/PlaneacionMunicipal/Publicaciones/Shared%20Content/Documentos/2021/Comuna%203%20Manrique-Ficha%20Informativa.pdf

Alcaldía de Medellín. (s. f.). *Plan de Desarrollo Local Comuna 3 – Manrique* [COMPLETAR: año de
publicación y URL del documento consultado].

Alcaldía de Medellín, & Instituto Tecnológico Metropolitano. (2026). *Términos de referencia
Territorio INN 2026* [COMPLETAR: título exacto y URL del documento].

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
Open Database License]. Recuperado el 1 de octubre de 2026 de https://www.openstreetmap.org/copyright

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

*(Referencias pendientes de la asesoría: GeoMedellín, capa de barrios; Cámara de Comercio de
Medellín para Antioquia, Estructura Empresarial 2025. Se agregan en cuanto el equipo confirme el
documento y la URL consultados.)*
