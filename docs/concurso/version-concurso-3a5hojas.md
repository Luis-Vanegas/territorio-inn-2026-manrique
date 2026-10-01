<!--
Versión para entrega: 3 a 5 hojas, Arial 12, interlineado 1,5.
Pasar a Word y medir la extensión real (las tablas ocupan más que el texto).
Lo que dependa de métricas de datos-ml o de datos personales queda marcado y se completa antes de entregar.
Antes de entregar: borrar este comentario y las marcas [PENDIENTE] y [COMPLETAR] que ya estén resueltas.
-->

# Constelaciones · Manrique

**La red de negocios de la Comuna 3 y su tablero de datos, Firmamento**

Territorio INN 2026 · Comuna 3 – Manrique · Reto #2 Empleo y Desarrollo Económico

| Nombre completo | Documento de identidad | Programa de formación | Institución |
|---|---|---|---|
| María Camila Jaramillo Zapata | [COMPLETAR] | [COMPLETAR] | ITM |
| Luis Ríos Vanegas | [COMPLETAR] | [COMPLETAR] | ITM |
| Estefanía Mesa Makiu | [COMPLETAR] | [COMPLETAR] | ITM |

**Palabras clave:** economía popular, georreferenciación, aprendizaje automático, datos abiertos,
agrupamiento espacial, Comuna 3 Manrique.

## a. Identificación de la problemática

Las unidades productivas de la Comuna 3 son poco visibles para sus clientes, para otras unidades
productivas y para las instituciones que podrían apoyarlas. Muchas funcionan en la vivienda, sin
presencia digital ni registro mercantil, y no se enteran de la oferta pública que existe para
ellas. Además, las estadísticas oficiales no se publican a escala de comuna, por lo que el territorio
no puede leerse con sus propios datos y las decisiones de inversión se toman con poca información local.

## b. Descripción del reto

**Detalles y ubicación.** En 2019 la Comuna 3 – Manrique tenía 162.374 habitantes en 5,10 km². Su
desempleo fue de 13,16 %, frente a 12,2 % en Medellín, y su índice de calidad de vida fue de 37,88,
frente a 49,00 en la ciudad (Alcaldía de Medellín, Departamento Administrativo de Planeación [DAP], 2021).

**Causas.** En las 24 ciudades que mide el DANE, solo el 13,0 % de los micronegocios tiene registro
en Cámara de Comercio y el 31,6 % tiene RUT, aunque el 75,8 % usa internet (DANE, 2026). Son cifras
de ciudades, no de Manrique, y muestran que el registro formal no es una buena vara para
medir quién trabaja. La oferta de apoyo está repartida entre Fondo Emprender, Bancóldex, Ruta N,
Cámara de Comercio, SENA e iNNpulsa, cada una en su propio portal.

**Contexto y actores.** El Plan de Desarrollo Local, Línea 4 Económica, propone «la creación de una
red estratégica con los pequeños comerciantes» (Alcaldía de Medellín, s. f., p. 114). Participan los
negocios y oficios de la comuna, los vecinos, la Junta Administradora Local y el Presupuesto
Participativo, CEDEZO, el Centro del Valle del Software de Manrique, las entidades de apoyo y el ITM.

**Producto de datos.** Firmamento es un tablero público que mide el territorio y la distancia entre
el territorio y la red de negocios, **sin pedir datos sensibles** a ningún negocio. Sus datos salen
de tres capas: datos abiertos del territorio (OpenStreetMap), agregados de la red con supresión
de celdas de menos de cinco negocios, y contadores de uso sin cookies ni identificadores. Dos
modelos de aprendizaje automático lo alimentan, y ambos se entrenan con datos abiertos, no con los
pocos registros propios:

- **Sugeridor de categoría:** a partir del nombre de un negocio sugiere su categoría (TF-IDF de
  caracteres y regresión logística, Pedregosa et al., 2011). Corre en el navegador, sin costo. Si
  la confianza es baja, pregunta en lugar de sugerir. Resultado: [PENDIENTE: métrica de datos-ml].
- **Constelaciones comerciales:** agrupa los comercios por cercanía con HDBSCAN (Campello et al.,
  2013) y deja como «sueltos» los que no pertenecen a ningún nodo. Se presenta como resultado
  exploratorio, que se valida en campo. Resultado: [PENDIENTE: métrica de datos-ml].

El mapa abierto muestra [PENDIENTE: métrica de datos-ml] establecimientos dentro de la comuna;
Constelaciones tiene [PENDIENTE: cifra de aliados aprobados al día de la entrega]. Esa diferencia
es la línea base del trabajo y no una medida de cobertura (OpenStreetMap contributors, 2026).

## c. Solución propuesta e implementación

**Lo que ya funciona.** Constelaciones es un mapa donde cada negocio se registra gratis, en pocos
minutos, con consentimiento de datos (Ley 1581 de 2012) y moderación humana antes de publicar.
Incluye registro asistido para quien no usa celular, guías de marca y de ventas, y un asesor de
formalización que solo recomienda trámites de un catálogo cerrado.

**Lo que se propone sumar** (en desarrollo en octubre de 2026; todo gratis para los negocios):
sugeridor de categoría en el registro; constelaciones y «negocios de tu misma constelación»;
vigía de convocatorias, que cada día revisa páginas oficiales y deja lo nuevo en revisión humana;
«Para ti», con las convocatorias que encajan con cada negocio; «Tu negocio en números»; y
Firmamento público, con datos abiertos agregados para la comunidad y la JAL.

El piloto sigue la ruta de innovación social (Pacheco et al., 2022):

| Fase | Qué se hace | Semanas |
|---|---|---|
| Alistar | Ajustes de la plataforma, acuerdos con JAL, CEDEZO y CVS, línea base | 1–3 |
| Entender y analizar | Censo de campo con registro asistido; diálogo con 30 negocios | 3–8 |
| Crear | Codiseño con los negocios del tablero y los servicios; taller de convergencia | 6–12 |
| Operar | Seis talleres, moderación de convocatorias, reentrenamiento del modelo | 12–22 |
| Evaluar | Indicadores, informe técnico y entrega a la JAL y al CVS | 22–26 |

**Metas a seis meses** (del equipo, condicionadas a que el censo de campo se ejecute completo):
150 aliados, de ellos al menos 40 % informales; 95 % de fichas con categoría y barrio confirmados;
30 % de los aliados conectados con una convocatoria. Ningún indicador mide empleo o ingresos: la
plataforma hace visible el tejido productivo, pero **no garantiza por sí sola empleo digno**.

**Riesgos y mitigación.** OpenStreetMap ve más lo formal y lo que está sobre vías principales; por
eso el censo de campo se concentra en los barrios con menos puntos y la cobertura se mide contra lo
observado en campo, no contra la Cámara de Comercio. El clasificador puede equivocarse con
nombres propios: por debajo del umbral de confianza pregunta, y la persona y el moderador deciden.
Los proveedores de lenguaje del asesor reciben la ficha del negocio: se nombrarán en la política de datos.

## d. Valor estimado de la implementación

| Concepto | Valor (COP) |
|---|---|
| Talento: desarrollo, datos y aprendizaje automático, tres dinamizadores de la comuna, talleres, diseño y validación jurídica (topes de referencia SENA 2026) | $99.816.537 |
| Tecnología (software, USD 40 al mes durante seis meses) y materiales: distintivos QR y logística de seis talleres | $3.216.000 |
| Imprevistos (5 %) | $5.151.627 |
| **Total del piloto de seis meses** | **$108.184.164** |

Un MVP de tres meses cuesta $33.088.953. Para los negocios el servicio es gratis, siempre. Hoy el
software se opera con planes gratuitos, a costo cero; con financiación debe pasar a planes de pago
(estimación del equipo: entre USD 30 y 40 al mes con un uso diez veces mayor que el actual). Cualquier
modelo comercial posterior queda condicionado a la respuesta del ITM sobre la cesión de derechos
patrimoniales de lo producido en la convocatoria: [PENDIENTE: respuesta del ITM].

## Referencias

Alcaldía de Medellín, Departamento Administrativo de Planeación. (2021). *Comuna 3: Manrique.
Ficha de caracterización*.
https://www.medellin.gov.co/irj/go/km/docs/pccdesign/medellin/Temas/PlaneacionMunicipal/Publicaciones/Shared%20Content/Documentos/2021/Comuna%203%20Manrique-Ficha%20Informativa.pdf

Alcaldía de Medellín. (s. f.). *Plan de Desarrollo Local Comuna 3 – Manrique* [COMPLETAR: año y URL].

Campello, R. J. G. B., Moulavi, D., & Sander, J. (2013). Density-based clustering based on
hierarchical density estimates. En *Advances in knowledge discovery and data mining* (pp. 160–172).
Springer. https://doi.org/10.1007/978-3-642-37456-2_14

Congreso de la República de Colombia. (2012). *Ley 1581 de 2012, por la cual se dictan
disposiciones generales para la protección de datos personales*.
http://www.secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html

Departamento Administrativo Nacional de Estadística. (2026). *Encuesta de micronegocios (EMICRON)
2025* [Boletín técnico, 30 de julio]. [COMPLETAR: URL del boletín].

OpenStreetMap contributors. (2026). *OpenStreetMap*. Recuperado el 1 de octubre de 2026 de
https://www.openstreetmap.org/copyright

Pacheco Duarte, J. F., Galindo Gómez, S. F., & Rodríguez Pupo, S. (2022). *Ruta de innovación
social: Paso a paso para desarrollar innovaciones sociales* (Documento técnico 02). UNIMINUTO.
https://repository.uniminuto.edu/items/1a3d912c-10fb-416b-9307-98783f1e703f

Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B., Grisel, O., Blondel, M.,
Prettenhofer, P., Weiss, R., Dubourg, V., Vanderplas, J., Passos, A., Cournapeau, D., Brucher, M.,
Perrot, M., & Duchesnay, É. (2011). Scikit-learn: Machine learning in Python. *Journal of Machine
Learning Research, 12*, 2825–2830.
