import 'server-only';

import { sesionActual } from '@/lib/auth/usuario';

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
 * ponytail: stub. Se conecta a `entidadesDeUsuario(usuarioId)` de
 * `lib/db/entidades.repo.ts` cuando llegue el bloque A (migración 033, tabla
 * `miembros_entidad`). Hasta entonces nadie pertenece a una entidad: devuelve
 * null y `exigirEntidad` manda a /firmamento/entrar. Al conectarla, la consulta
 * filtra por `usuario_id` de la sesión (nunca por un id que venga de la
 * petición) y, si la persona tiene varias entidades, toma la primera hasta que
 * haya un selector.
 */
export async function entidadDeSesion(): Promise<EntidadSesion | null> {
  const sesion = await sesionActual();
  if (!sesion) return null;
  return null;
}
