-- 018 · El borrado propio (sin admin de por medio) puede archivar
--
-- Para qué: `chk_moderacion_completa` (001) exige moderado_por + moderado_en
-- para cualquier estado que no sea 'pendiente' — una regla pensada para
-- aprobar/rechazar, que solo hace un admin. El autoservicio de
-- /aliados/estado/[token] (018... digo, la Fase D3) también puede archivar,
-- pero ahí no hay ningún admin de por medio: es el dueño del negocio
-- borrándose a sí mismo. Exigirle un `moderado_por` que no existe hacía
-- fallar el UPDATE con una violación de CHECK.
--
-- La regla queda: archivar solo necesita quedar registrado *cuándo*
-- (moderado_en) — el *quién* (moderado_por) sigue siendo obligatorio para
-- aprobar/rechazar, que sí son siempre decisión de un admin.

alter table portafolios
  drop constraint chk_moderacion_completa;

alter table portafolios
  add constraint chk_moderacion_completa check (
    (estado = 'pendiente')
    or (estado = 'archivado' and moderado_en is not null)
    or (moderado_por is not null and moderado_en is not null)
  );
