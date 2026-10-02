# Notas internas del equipo (no se entregan al concurso)

Control de pendientes del documento. Se actualiza al resolver cada punto. Última actualización: 2 de octubre de 2026 (cifras del pipeline).

## Cifras excluidas a propósito

Por no tener fuente verificable (hallazgo B3 de la asesoría), no aparecen en ningún documento:
índice de calidad de vida de 39,97 para 2025; 13.125 votos de Presupuesto Participativo 2025;
1.716.787 microempresas; porcentajes de 16,2 %, 2,2 %, 65,9 % y 4,6 % (probablemente frecuencias
de microdatos sin ponderar; el dato oficial de uso de internet es 75,8 %).

Cifras del pipeline de la asesoría que **no** se usan como hechos: 312 locales, 15 constelaciones,
91 sueltos, F1 de 0,63 y 3.398 locales de entrenamiento. Las reemplaza la corrida reproducible del
2 de octubre de 2026, con el servidor principal de Overpass (5.423 y 205 comercios; 12 constelaciones,
125 agrupados y 80 sueltos; F1 macro 0,528). Valores de la corrida del 1 de octubre (espejo, snapshot
del 6 de mayo de 2026), ya reemplazados y que no deben volver: 5.007, 192, 122 agrupados, 70 sueltos,
4.446 de entrenamiento, F1 0,535, exactitud 0,654, holdout geográfico 0,670. El aumento de 192 a 205
es de la base de OpenStreetMap, no del comercio. El F1 de la referencia no se cita como logro: ese modelo probablemente vio los nombres
al entrenarse y su código no es reproducible.

## Resuelto

- Métricas de `datos-ml` (corrida del 2 de octubre de 2026): comercios de OpenStreetMap, constelaciones, muestra de entrenamiento, F1 macro y líneas base, prueba geográfica, límites por categoría, umbral 0,45 medido. Detalle en `pipeline/reporte_modelo.md` y `pipeline/README.md`.
- Cifra de empresas de Manrique de la Estructura Empresarial 2025: 2.626 (Tabla 16), por tamaño (Tabla 14) y por sector.
- Número de barrios: 15 oficiales (Decreto 346 de 2000; geocatálogo). Error de «Campo Valdés No. 1» (Comuna 4) documentado en el Anexo A.
- Ficha DAP contrastada para jefatura femenina (53,68 %) y hurto a establecimientos (89 frente a 4.555).

## Pendientes que dependen de `datos-ml`

Siguen marcados como `[PENDIENTE: métrica de datos-ml]`.

- Proporción de locales ubicados en la mitad norte del recuadro (riesgo de sesgo, 8.2): el pipeline no la calcula.
- Revisión manual de una muestra de etiquetas de OpenStreetMap (las etiquetas son débiles).
- Validación del sugeridor con registros propios (hoy hay 7, insuficientes).
- Confirmar el caso «Misceláneo El Vecino» → comidas (0,90): lo aportó el equipo y no está en `pipeline/reporte_modelo.md`.
- Con `eom` ya no se citan el número de constelaciones ni el radio del cúmulo grande (el README solo da 171 de 205).
- Tasa de aceptación y corrección del sugeridor en uso real (indicador de la sección 7).
- Decidir si el umbral 0,45 se mantiene tras medir el uso real.
- Si se repite la descarga de Overpass, revisar que las cifras del documento sigan coincidiendo (la corrida vigente es la del 2 de octubre de 2026, servidor principal, snapshot 04:40 UTC; la del 1 de octubre usó un espejo con snapshot del 6 de mayo).

## Pendientes que dependen del equipo, de otra persona o de otro proceso

- Datos personales de integrantes (`[COMPLETAR]`): documento y programa de formación.
- Cifra de aliados aprobados el día de la entrega (línea base de la sección 7 y tercera fila de «tres miradas»; también en el guion del video).
- URLs y datos de referencia: Cámara de Comercio (URL y año de publicación del archivo), Decreto 346 de 2000 (título y URL), registro del geocatálogo (confirmar que es el consultado), Plan de Desarrollo Local, boletín EMICRON 2025, términos de referencia, repositorio.
- Desglose del presupuesto por rol (personas, meses, tarifa) y de la línea de tecnología y materiales.
- Tabla de topes SENA 2026 con fecha de consulta.
- Contraste del resto de cifras del Anexo A (población, área, desempleo, calidad de vida, DANE) contra los originales; no se pudo abrir el boletín DANE del 30 de julio de 2026.
- Definición operativa de «informal» para la meta de al menos 40 %.
- Confirmar si la formalidad declarada agregada se publica en `/api/datos` o queda solo en el panel.
- Acuerdos con la JAL y el CVS antes de afirmar que asumen el mantenimiento.
- Confirmar que GitHub Actions es gratuito y está habilitado para el repositorio (la cuenta tiene presupuesto de $0 en Actions) y la pausa tras 60 días sin actividad.
- Versión de 3 a 5 hojas: con las cifras nuevas probablemente se pasa de la extensión; medir en Word y recortar.

## Preguntas abiertas al ITM

1. ¿La cesión de derechos patrimoniales alcanza al código ya publicado con licencia MIT?
2. ¿Puede mantenerse la licencia MIT y ceder solo lo producido durante el piloto?
3. ¿Quién opera el servicio y es responsable del tratamiento de datos personales (Ley 1581) después del piloto?
4. ¿Se pueden recibir pautas, patrocinios o pagos de entidades para sostener la operación?
5. Uso de los logos del ITM, de la Alcaldía y del Presupuesto Participativo en el sitio y en el video.

El texto de la pregunta está en la sección 8.4 del documento técnico.

## Dudas para Luis

- **Valor del piloto:** el equipo propone $108.184.164; la asesoría anota como referencia de escala de la docente $126,5 millones para el piloto y $40 millones para el MVP. ¿Se presenta solo la cifra propia o se explica la diferencia?
- **Catálogo del asesor:** la asesoría dice 11 pasos y `docs/arquitectura-y-costos.md` dice 8 trámites. El documento dice «catálogo cerrado» sin número. Confirmar cuál es el correcto antes de agregar el número.
- **Visitas en 30 días:** no se citan (la asesoría reporta 1.013 y el plan de diseño dice que están infladas por el propio equipo).
- **Cierre del video:** confirmar si hay votación pública antes de pedirla.
- **Alojamiento:** Vercel Hobby no permite uso comercial; el documento lo declara como supuesto del presupuesto y como condición de sostenibilidad. Confirmar con el ITM o con el soporte del proveedor.
- **Cifras de 2019:** desempleo, calidad de vida, jefatura femenina y hurto son de 2019 (ECV 2018 para jefatura). El documento lo advierte. Si existe un dato más reciente con fuente, reemplazar.
- **Selección `leaf`:** el documento la presenta como decisión de diseño aceptada por el equipo, con la comparación frente a `eom`. Si el jurado pregunta, la respuesta es que la partición depende del criterio y que el resultado es exploratorio.
- **Hurto y jefatura femenina:** están en el Anexo A y la jefatura femenina y el hurto no se usan en el árbol de problema (sin cifras, por regla). Decidir si se usan en el texto de 3 a 5 hojas más allá de la jefatura femenina, que ya está.
