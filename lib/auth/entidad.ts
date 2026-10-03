import 'server-only';

import { cache } from 'react';

import { sesionActual } from '@/lib/auth/usuario';
import { entidadesDeUsuario } from '@/lib/db/entidades.repo';

/**
 * La entidad aliada a la que pertenece quien tiene sesión.
 *
 * Una entidad NO tiene cookie propia (docs/firmamento-modulos.md, decisión 4):
 * entra con Google como cualquier vecino (`sesion_usuario`) y la autoriza su
 * fila en `miembros_entidad`, no un rol dentro de la cookie. Por eso esta
 * función vive aparte de `lib/auth/usuario.ts`: la sesión dice quién es la
 * persona; la membresía dice si además representa a una entidad.
 */
export interface EntidadSesion {
  id: string;
  nombre: string;
}

/**
 * Filtra por el `usuario_id` de la sesión, nunca por un id que venga de la
 * petición. `cache` deduplica la consulta entre el layout y la página de una
 * misma petición (las dos llaman la guarda).
 *
 * ponytail: con varias entidades toma la primera (orden alfabético); un
 * selector cuando alguien de verdad represente a dos.
 */
export const entidadDeSesion = cache(async (): Promise<EntidadSesion | null> => {
  const sesion = await sesionActual();
  if (!sesion) return null;
  const [primera] = await entidadesDeUsuario(sesion.id);
  return primera ? { id: primera.id, nombre: primera.nombre } : null;
});
