-- 006 · Ubicación ya no se limita a Manrique
--
-- Decisión del equipo: mientras se junta volumen real de datos de prueba, el
-- registro tiene que aceptar cualquier punto del mundo, no solo dentro del
-- polígono de la Comuna 3. El bbox de Manrique era una regla de negocio, no
-- una regla de integridad — se saca.
--
-- Se reemplaza por un CHECK de rango real (-90..90 / -180..180): sigue
-- siendo la última línea de defensa contra un valor imposible (una latitud
-- de 200, por ejemplo), pero ya no contra "vive fuera de Manrique".

alter table portafolios
  drop constraint portafolios_latitud_check;

alter table portafolios
  add constraint portafolios_latitud_check
  check (latitud between -90 and 90);

alter table portafolios
  drop constraint portafolios_longitud_check;

alter table portafolios
  add constraint portafolios_longitud_check
  check (longitud between -180 and 180);
