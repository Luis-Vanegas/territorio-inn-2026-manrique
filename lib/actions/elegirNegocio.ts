'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';

import { opcionesCookie } from '@/lib/auth/cookies';
import { sesionActual } from '@/lib/auth/usuario';
import { negociosDe } from '@/lib/db/usuarios.repo';
import { COOKIE_NEGOCIO } from '@/lib/firmamento/negocio';

const esquema = z.object({ negocio: z.string().uuid() });

/**
 * Elige con qué negocio trabaja el panel (selector de `/firmamento/negocio`).
 * La sesión se revalida acá: una action es un endpoint invocable sin pasar por
 * la página. El id llega del navegador, así que solo vale si es de esta cuenta;
 * si no, no se hace nada (la página ya cae al primer negocio). Next vuelve a
 * pintar la ruta con la cookie nueva al terminar la action.
 */
export async function elegirNegocio(formData: FormData): Promise<void> {
  const sesion = await sesionActual();
  if (!sesion) return;

  const parsed = esquema.safeParse({ negocio: formData.get('negocio') });
  if (!parsed.success) return;

  const propios = await negociosDe(sesion.id);
  if (!propios.some((n) => n.id === parsed.data.negocio && n.estado !== 'archivado')) return;

  (await cookies()).set(COOKIE_NEGOCIO, parsed.data.negocio, {
    ...opcionesCookie(),
    maxAge: 60 * 60 * 24 * 365,
  });
}
