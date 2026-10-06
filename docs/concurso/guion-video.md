# Guion del video · Constelaciones · Manrique

Duración máxima: 3 minutos (180 s). Se muestra el mapa estelar y el sugeridor **funcionando en
pantalla**. Basado en la sección η del manual de la asesoría, con estos cambios: las cifras del
pipeline son las de la corrida del 2 de octubre de 2026 y las de las fuentes oficiales las verificadas el 1 de octubre de 2026, la cifra de la
red se lee el día de grabación, no se promete empleo, y el cierre no pide votos (no consta que esta
convocatoria los use).

## Antes de grabar

1. **Las piezas en pantalla tienen que existir.** Al 3 de octubre de 2026 están en producción
   Firmamento (`/firmamento`), el mapa estelar, el sugeridor en el registro, «Para ti» y los
   paneles de negocio, equipo y entidad. **No se graban como hechos** las piezas que siguen en
   implementación: el sugeridor en un clic dentro de la moderación, el mapa de barrios coloreado,
   el F1 por categoría con matriz de confusión en el panel y el rediseño de los paneles. Antes de
   grabar, comprobar en el sitio qué quedó publicado ese día; lo que no esté, se rotula como
   «prototipo» o se deja fuera, y no se simula ningún dato. Con el equipo o las entidades, usar
   cuentas de demostración, nunca datos de vecinos reales.
2. **Cifras.** Tres son fijas y llevan fuente y fecha en pantalla; una se lee el día de la grabación:
   - Establecimientos mapeados en OpenStreetMap dentro del polígono de la comuna: **320**, de ellos
     201 con nombre y 119 sin nombre (snapshot del 2 de octubre de 2026, 17:01 UTC; fuente en
     pantalla). Es la misma metodología de conteo de la asesoría, que contó 312 con otro snapshot
     (1 de octubre); la diferencia es de la base, no un crecimiento del comercio. Siempre
     «establecimientos mapeados», nunca «los negocios que hay». Las cifras 205, 192 y 12 constelaciones
     son de corridas anteriores y no se dicen.
   - Empresas registradas en Manrique: **2.626** (Cámara de Comercio de Medellín para Antioquia,
     Estructura Empresarial 2025). No se presenta como porcentaje de la cifra anterior.
   - Constelaciones: **20**, con 213 establecimientos agrupados y 107 sueltos (HDBSCAN `leaf`, corrida
     del 2 de octubre de 2026; es la cifra que muestra hoy `/firmamento`). [PENDIENTE: decisión del equipo, eom o leaf; con `eom` serían 18. Si
     cambia, se actualizan esta cifra y la voz del plano 1:20–1:45.]
   - Comercios con los que aprendió el sugeridor: **4.796** del Valle de Aburrá (no solo de Manrique),
     más 469 de toda Colombia para la categoría de diseño, publicidad e impresiones
     (corrida del 6 de octubre de 2026). En voz basta «casi cinco mil comercios del Valle de Aburrá».
   - Negocios en la red: **la cifra del día**, tomada de la portada o de `/api/datos`. No se fija
     «7» ni «8»; se lee lo que muestre el sitio al grabar y se dice «a la fecha de hoy».
     [PENDIENTE: cifra del día de grabación]
   - Si la corrida del pipeline se repite antes de grabar, las cifras de OpenStreetMap pueden
     cambiar: se vuelven a leer del `constelaciones.json` y del reporte.
3. **Privacidad en pantalla.** Usar un registro de demostración con un nombre inventado
   (por ejemplo, «Barbería El Parche»), nunca los datos reales de un vecino, sin teléfonos, sin
   direcciones exactas y sin fotografías de personas que no hayan dado su consentimiento.
4. **Atribución visible** en toda toma del mapa: «© colaboradores de OpenStreetMap (ODbL)».
5. **Voz y registro:** español colombiano, sin voseo («tú» o impersonal).
6. **Subtítulos** en español para accesibilidad.

## Tabla de planos

| Tiempo | Imagen en pantalla | Voz (texto de lectura) |
|---|---|---|
| 0:00–0:20 | Plano de la ladera de Manrique de noche con las luces de las casas. **Alternativa si no hay plano propio:** la banda nocturna de la portada del sitio, con las estrellas encendiéndose | «Vista desde la ladera, Manrique de noche parece un cielo. Cada luz es una casa, y en muchas hay un negocio.» |
| 0:20–0:50 | Mapa estelar de Firmamento. Se enciende el mapa abierto y, encima, los negocios de la red. Se leen **en pantalla** las tres cifras (2.626 empresas registradas, 320 establecimientos mapeados, la cifra del día de la red); al pie, la fuente y la fecha de cada una | «Tres miradas del mismo territorio. La Cámara de Comercio registra 2.626 empresas en Manrique. El mapa abierto tiene 320 establecimientos mapeados por voluntarios. A la fecha de hoy, nuestra red tiene [cifra en pantalla]. No son comparables, pero la distancia entre ellas es nuestra línea base, y es nuestro trabajo.» |
| 0:50–1:20 | Pantalla de registro. Se escribe el nombre de demostración y aparece la sugerencia con su porcentaje y el botón «Usar esta». Se muestra también un caso de baja confianza, donde el sistema muestra tres opciones y **pregunta** | «Una vecina escribe el nombre de su negocio y el sistema sugiere una categoría. Aprendió de casi cinco mil comercios reales de datos abiertos del Valle de Aburrá. Si no está segura, pregunta: la persona decide. Se equivoca a veces, y por eso no decide ella.» |
| 1:20–1:45 | Mapa estelar de nuevo: se trazan las constelaciones una a una; se toca una fila de la tabla y se enciende en el mapa. Se ve la lista equivalente bajo el mapa | «Los comercios que están cerca forman constelaciones: veinte, sobre los 320 establecimientos mapeados. Sirven para orientar el trabajo de campo y las alianzas entre vecinos. Es un resultado exploratorio: lo validamos caminando la comuna.» |
| 1:45–2:15 | Panel del equipo: una convocatoria oficial pendiente que un moderador aprueba, eligiendo a qué categorías y formalidad aplica. Luego «Para ti» en el panel de un negocio de demostración, con la convocatoria y su fuente. Si da el tiempo, el observatorio de una entidad, que solo muestra agregados con «<5» | «Las convocatorias oficiales que encontramos pasan por una persona antes de publicarse. Si hay algo para el negocio, aparece aquí, con la fuente. Y las entidades del territorio ven el cuadro general, nunca los datos de cada negocio.» |
| 2:15–2:40 | Equipo en la cuadra con un aliado que haya dado su consentimiento para aparecer; registro asistido en un celular | «Es gratis para los negocios, siempre. El piloto de seis meses tiene un valor estimado de 108 millones de pesos, y la mayor parte paga a quienes hacen el censo en la comuna.» *(Confirmar la cifra con la sección 6 definitiva.)* |
| 2:40–3:00 | Las constelaciones se encienden una a una; aparecen el nombre del proyecto, el sitio y los logos autorizados | «Una plataforma no crea empleo por sí sola, pero un negocio que se ve puede conectarse, y los negocios conectados forman constelaciones. Constelaciones, Manrique.» |

## Notas de producción

- **Atribución y fuentes en pantalla:** en los planos de cifras, pie con «Cámara de Comercio de
  Medellín para Antioquia, 2025» y «© colaboradores de OpenStreetMap (ODbL), octubre de 2026».
- **Tiempo total de voz:** el texto creció con las cifras; volver a contar palabras y cronometrar con la locución real. A ritmo natural (alrededor de 130
  palabras por minuto) caben en 2 minutos y 20 segundos; el resto es silencio y música. Cronometrar
  con la locución real y, si se pasa de 3:00, recortar el plano de 1:20–1:45.
- **El plano nocturno** es una escena de ambiente: si se usa la banda nocturna de la portada, no
  hace falta equipo externo.
- **No se dice** «empleo generado», «cobertura» ni «votos». Tampoco se dice que la inteligencia
  artificial «entiende» o «decide»: sugiere.
- **Licencias:** música y tomas externas libres de derechos o propias; los logos del ITM, de la
  Alcaldía y del Presupuesto Participativo solo con permiso de uso.
- **Pregunta abierta para Luis:** si el equipo quiere cerrar con una invitación («Vota por
  Constelaciones», como traía el manual), debe confirmar primero que la convocatoria tiene votación
  pública; el guion no la asume.
