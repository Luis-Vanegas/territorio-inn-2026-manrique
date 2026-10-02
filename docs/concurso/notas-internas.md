# Notas internas del equipo (no se entregan al concurso)

Control de pendientes del documento. Se actualiza al resolver cada punto. Última actualización: 2 de octubre de 2026 (corrida de OpenStreetMap con 320 establecimientos).

## Cifras excluidas a propósito

Por no tener fuente verificable (hallazgo B3 de la asesoría), no aparecen en ningún documento:
índice de calidad de vida de 39,97 para 2025; 13.125 votos de Presupuesto Participativo 2025;
1.716.787 microempresas; porcentajes de 16,2 %, 2,2 %, 65,9 % y 4,6 % (probablemente frecuencias
de microdatos sin ponderar; el dato oficial de uso de internet es 75,8 %).

## Cifras vigentes del pipeline y cifras que no deben volver

**Vigentes** (corrida del 2 de octubre de 2026, servidor principal de Overpass; fuente: `pipeline/README.md`, `pipeline/reporte_modelo.md` y `public/firmamento/constelaciones.json`):

- Comuna 3, snapshot de OpenStreetMap del 2 de octubre de 2026, 17:01:31 UTC: **320 establecimientos dentro del polígono oficial, 201 con nombre y 119 sin nombre** (los 119 incluyen 4 cuyo `name` en OpenStreetMap es literalmente «Sin nombre»).
- HDBSCAN `leaf` (`min_cluster_size` = 6, `min_samples` = 3): **20 constelaciones, 213 agrupados, 107 sueltos**; cúmulo mayor de 19 locales, radio de unos 101 m. Con `eom`: 18 constelaciones, 88 sueltos, cúmulo mayor de 29 locales, radio de unos 111 m.
- Cada constelación tiene código (C01…) y nombre «vía · categoría dominante»; 7 de 20 sin calle registrada. Radios grandes: `C03` (unos 306 m, 16 locales) y `C18` (unos 462 m, 6 locales).
- Clasificador sin cambios: F1 macro 0,528; entrenamiento con 4.790 comercios con nombre del Valle de Aburrá (snapshot del 2 de octubre, 04:40 UTC).
- Misma metodología de conteo que la asesoría, que contó 312 = 198 con nombre + 114 sin nombre con un snapshot del 1 de octubre. La diferencia con 320 es de fecha de la base, no de criterio. No se afirma que una cifra sea la correcta y la otra errónea.

**No deben aparecer como vigentes** (si se mencionan, se rotulan «corrida anterior»):

- 205 comercios (solo con nombre, snapshot de la mañana del 2 de octubre), con 12 constelaciones, 125 agrupados, 80 sueltos y `eom` con 171 en un cúmulo.
- Corrida del 1 de octubre (espejo, snapshot del 6 de mayo de 2026): 5.007, 192, 122 agrupados, 70 sueltos, 4.446 de entrenamiento, F1 0,535, exactitud 0,654, holdout geográfico 0,670.
- Cifras del pipeline de la asesoría como hechos propios: 15 constelaciones, 91 sueltos, F1 de 0,63 y 3.398 locales de entrenamiento. Solo 312 (198 + 114) se cita, y como cifra de la asesoría con su snapshot.
- El F1 del modelo de referencia no se cita como logro: probablemente vio los nombres al entrenarse y su código no es reproducible.
- Las diferencias entre corridas son de la base de OpenStreetMap y del criterio de conteo, no de crecimiento del comercio.

## Resuelto

- Métricas de `datos-ml` (corrida del 2 de octubre de 2026): establecimientos de OpenStreetMap con y sin nombre, constelaciones, comparación `eom` y `leaf` (el JSON la trae), muestra de entrenamiento, F1 macro y líneas base, prueba geográfica, límites por categoría, umbral 0,45 medido. Detalle en `pipeline/reporte_modelo.md` y `pipeline/README.md`.
- Cifra de empresas de Manrique de la Estructura Empresarial 2025: 2.626 (Tabla 16), por tamaño (Tabla 14) y por sector.
- Número de barrios: 15 oficiales (Decreto 346 de 2000; geocatálogo). Error de «Campo Valdés No. 1» (Comuna 4) documentado en el Anexo A.
- Ficha DAP contrastada para jefatura femenina (53,68 %) y hurto a establecimientos (89 frente a 4.555).
- Visitas en 30 días: no se citan (la asesoría reporta 1.013 y el plan de diseño dice que están infladas por el propio equipo). Decisión tomada.
- Hurto y jefatura femenina: ambos están en el Anexo A; la versión de 3 a 5 hojas usa solo la jefatura femenina y el árbol de problema no usa ninguno (sin cifras, por regla). Se reabre solo si el equipo quiere incluir el hurto.
- Cifras que antes dependían de la selección `leaf` frente a `eom` (número de constelaciones y radio con `eom`): ya están en el JSON y en el documento. Lo que sigue abierto es la decisión, no el dato (ver más abajo).

## Pendientes que dependen de `datos-ml`

Siguen marcados como `[PENDIENTE: métrica de datos-ml]`.

- Proporción de locales ubicados en la mitad norte del recuadro (riesgo de sesgo, 8.2): el pipeline no la calcula.
- Revisión manual de una muestra de etiquetas de OpenStreetMap (las etiquetas son débiles).
- Validación del sugeridor con registros propios (hoy hay 7, insuficientes).
- Confirmar el caso «Misceláneo El Vecino» → comidas (0,90): lo aportó el equipo y no está en `pipeline/reporte_modelo.md`.
- Tasa de aceptación y corrección del sugeridor en uso real (indicador de la sección 7).
- Decidir si el umbral 0,45 se mantiene tras medir el uso real.
- Si se repite la descarga de Overpass, volver a leer las cifras de `constelaciones.json` y del reporte y corregir el documento técnico, la versión corta y el guion. La corrida vigente es la del 2 de octubre de 2026: Valle a las 04:40 UTC y Comuna 3 a las 17:01 UTC.

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

## Qué falta de la asesoría

Piezas y decisiones de la asesoría que siguen sin cerrar. Mientras no existan, el documento las rotula «En desarrollo» o `[PENDIENTE]` y no las presenta como funcionando.

1. **`/firmamento`** (tablero público y mapa estelar): el dato existe (`constelaciones.json`), la página no.
2. **Sugeridor de categoría en el registro:** el modelo está entrenado y evaluado; falta la pieza en el formulario.
3. **Mi cuenta:** «Para ti» (convocatorias que encajan con el negocio) y «Tu negocio en números».
4. **Moderación de convocatorias:** cola de revisión humana de lo que trae el vigía; nada se publica sin aprobación.
5. **Barrio oficial:** calcularlo por punto en polígono. Espera el GeoJSON de barrios (capa de GeoMedellín) y corrige la lista, que trae «Campo Valdés No. 1» (Comuna 4).
6. **Vigía en GitHub Actions y secretos:** depende de las cuentas del equipo (habilitar Actions, cargar `INGESTA_SECRETO` y `CRON_SECRET`). Ver también el pendiente sobre el presupuesto de $0 en Actions.
7. **Decisión `eom` o `leaf`:** con los 205 locales con nombre `eom` colapsaba (171 en un cúmulo) y por eso se eligió `leaf`; con los 320 ya no colapsa (`eom`: 18 constelaciones, cúmulo mayor de 29; `leaf`: 20 constelaciones, cúmulo mayor de 19). El equipo debe elegir y, si cambia, actualizar el documento técnico (4.2, 4.3 y Anexo A), la versión corta y el guion. `[PENDIENTE: decisión del equipo eom vs leaf]`
8. **Presupuesto: $108.184.164 frente a $126,5 millones.** El equipo propone $108.184.164; la asesoría anota $126,5 millones como referencia de escala de la docente para el piloto (y $40 millones para el MVP, frente a $33.088.953 del equipo). Decidir si se presenta solo la cifra propia o se explica la diferencia. El desglose por rol sigue pendiente.
9. **Respuesta del ITM (A4):** cesión de derechos y licencia MIT; hasta que responda no se plantea modelo comercial (sección 8.4). Preguntas en la sección siguiente.

## Preguntas abiertas al ITM

1. ¿La cesión de derechos patrimoniales alcanza al código ya publicado con licencia MIT?
2. ¿Puede mantenerse la licencia MIT y ceder solo lo producido durante el piloto?
3. ¿Quién opera el servicio y es responsable del tratamiento de datos personales (Ley 1581) después del piloto?
4. ¿Se pueden recibir pautas, patrocinios o pagos de entidades para sostener la operación?
5. Uso de los logos del ITM, de la Alcaldía y del Presupuesto Participativo en el sitio y en el video.

El texto de la pregunta está en la sección 8.4 del documento técnico.

## Dudas abiertas para Luis

- ~~**Catálogo del asesor**~~ **Resuelto (2-oct):** `PASOS` de `lib/formalizacion.ts` tiene 11 pasos (RUT, Cámara, beneficios de tarifa, CEDEZO, Banco Distrital, Fondo Emprender, Bancóldex, iNNpulsa, Presupuesto Participativo, formación para empresarios, cursos del SENA). El «8 trámites» de `docs/arquitectura-y-costos.md` estaba desactualizado y se corrigió.
- **Cierre del video:** confirmar si hay votación pública antes de pedirla; el guion no la asume.
- **Alojamiento:** Vercel Hobby no permite uso comercial; el documento lo declara como supuesto del presupuesto y como condición de sostenibilidad. Confirmar con el ITM o con el soporte del proveedor.
- **Cifras de 2019:** desempleo, calidad de vida, jefatura femenina y hurto son de 2019 (ECV 2018 para jefatura). El documento lo advierte. Si existe un dato más reciente con fuente, reemplazar.
- **Valor del piloto y selección `eom` o `leaf`:** ver «Qué falta de la asesoría», puntos 7 y 8.
