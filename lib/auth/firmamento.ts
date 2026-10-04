import 'server-only';

import { redirect } from 'next/navigation';

import { verificarSesion } from '@/lib/auth/admin';
import { entidadDeSesion } from '@/lib/auth/entidad';
import { sesionActual } from '@/lib/auth/usuario';
import type { RolFirmamento } from '@/lib/firmamento/navegacion';

/**
 * Guardas de los tres paneles de Firmamento. Cada `layout.tsx` de rol llama a
 * la suya: sin sesión del rol, a /firmamento/entrar con esa pestaña abierta.
 *
 * Acá y no en middleware (el proyecto no tiene proxy.ts): la verificación usa
 * node:crypto y la cookie, igual que el guard de /admin.
 *
 * Un layout NO alcanza (guía de autenticación de Next › «Layouts and auth
 * checks»): no se vuelve a ejecutar al navegar entre páginas hermanas y no frena
 * que el resto de la ruta se renderice. Por eso la guarda va en el layout (para
 * mandar al login antes de pintar el armazón) Y en cada `page.tsx` del panel,
 * junto a su lectura de datos; y cada Server Action y cada repo revalida por su
 * cuenta, porque una action es un endpoint invocable sin pasar por la página.
 * ponytail: sin `cache()` de React acá: la verificación de cookie es barata.
 * La que sí consulta la base, `entidadDeSesion`, ya va con `cache`.
 *
 * Tres roles, dos cookies (AGENTS.md › «Dos poblaciones, dos cookies»):
 *   negocio → `sesion_usuario`
 *   equipo  → `admin_session`
 *   entidad → `sesion_usuario` + membresía en `miembros_entidad`
 */

/** Lo que el panel necesita para pintar la barra: quién es. Nada más. */
export interface ContextoPanel {
  rol: RolFirmamento;
  nombre: string;
  /** Avatar de Google; solo el negocio lo trae. */
  foto: string | null;
}

/** El panel del negocio además necesita el id de la cuenta para filtrar sus consultas (nunca viaja a la pantalla). */
export interface ContextoNegocio extends ContextoPanel {
  usuarioId: string;
}

/**
 * `destino`: adónde volver después de Google (p. ej. el registro). Viaja a la
 * puerta y de ahí a `/api/auth/google/iniciar`, que lo valida con `rutaInterna`.
 */
export async function exigirNegocio(destino?: string): Promise<ContextoNegocio> {
  const sesion = await sesionActual();
  if (!sesion) {
    redirect(`/firmamento/entrar?rol=negocio${destino ? `&destino=${encodeURIComponent(destino)}` : ''}`);
  }
  return { rol: 'negocio', nombre: sesion.nombre, foto: sesion.foto, usuarioId: sesion.id };
}

export async function exigirEquipo(): Promise<ContextoPanel> {
  const sesion = await verificarSesion();
  if (!sesion) {
    // Entró con Google pero su cuenta no es de moderador: sin este aviso vuelve al
    // login sin explicación y parece que los botones del equipo no funcionan.
    redirect((await sesionActual()) ? '/firmamento/entrar?rol=equipo&error=sin_equipo' : '/firmamento/entrar?rol=equipo');
  }
  return { rol: 'equipo', nombre: sesion.email, foto: null };
}

export async function exigirEntidad(): Promise<ContextoPanel> {
  const sesion = await sesionActual();
  if (!sesion) redirect('/firmamento/entrar?rol=entidad');

  const entidad = await entidadDeSesion();
  // Con Google adentro pero sin entidad, volver al login sin decir nada se vería
  // como un bucle: se le explica qué pasó.
  if (!entidad) redirect('/firmamento/entrar?rol=entidad&error=sin_entidad');

  return { rol: 'entidad', nombre: entidad.nombre, foto: null };
}
