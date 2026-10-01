# Notas internas del equipo (no se entregan al concurso)

Control de pendientes del documento. Se actualiza al resolver cada punto.

## Cifras excluidas a propósito

Por no tener fuente verificable (hallazgo B3 de la asesoría), no aparecen en ningún documento:
índice de calidad de vida de 39,97 para 2025; 13.125 votos de Presupuesto Participativo 2025;
1.716.787 microempresas; porcentajes de 16,2 %, 2,2 %, 65,9 % y 4,6 % (probablemente frecuencias
de microdatos sin ponderar; el dato oficial de uso de internet es 75,8 %). Tampoco aparecen las
cifras del pipeline (0,63; 312; 15 constelaciones; 91 sueltos; 3.398) hasta que `datos-ml` las
produzca de forma reproducible.

## Pendientes que dependen de `datos-ml`

Todos se marcan en los documentos como `[PENDIENTE: métrica de datos-ml]`. No hay cifras de este
grupo escritas como hechos.

- Número de establecimientos de OpenStreetMap dentro del polígono (y cuántos tienen nombre).
- Número de constelaciones y de locales sueltos; sensibilidad a los parámetros.
- Tamaño de la muestra de entrenamiento y F1 macro del sugeridor frente a su línea base; límites por categoría.
- Proporción de locales ubicados en la mitad norte del recuadro (riesgo de sesgo, 8.2).
- Umbral definitivo del sugeridor tras el reentrenamiento (se usa 0,45 como valor de diseño).

## Pendientes que dependen del equipo, de otra persona o de otro proceso

- Datos personales de integrantes (`[COMPLETAR]`): documento y programa de formación.
- Cifra de aliados aprobados el día de la entrega (línea base de la sección 7).
- Cifra de empresas de Manrique de la Estructura Empresarial 2025 de la Cámara de Comercio (ya procesada con `scripts/procesar-camara-comercio.py`).
- Desglose del presupuesto por rol (personas, meses, tarifa) y de la línea de tecnología y materiales.
- Tabla de topes SENA 2026 con fecha de consulta.
- URL y año del Plan de Desarrollo Local; URL directa del boletín EMICRON 2025; términos de referencia; GeoMedellín; Cámara de Comercio; URL del repositorio.
- Contraste de las cifras del Anexo A contra los documentos originales (no se pudo abrir el PDF de la ficha DAP, que es una imagen, ni el boletín DANE del 30 de julio de 2026).
- Definición operativa de «informal» para la meta de al menos 40 %.
- Confirmar si la formalidad declarada agregada se publica en `/api/datos` o queda solo en el panel.
- Acuerdos con la JAL y el CVS antes de afirmar que asumen el mantenimiento.
- Confirmar que GitHub Actions es gratuito y está habilitado para el repositorio (la cuenta tiene presupuesto de $0 en Actions) y la pausa tras 60 días sin actividad.

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
- **Cifras de 2019:** desempleo y calidad de vida son de 2019. El documento lo advierte. Si existe un dato más reciente con fuente, reemplazar.
- **Número de barrios:** la propuesta decía «15 barrios oficiales», pero no está entre las cifras verificadas de la asesoría y la lista de barrios del sitio tenía un error (Campo Valdés No. 1 es de la Comuna 4). No se cita hasta contrastar con el PDL y la ficha de la Comuna 4.
