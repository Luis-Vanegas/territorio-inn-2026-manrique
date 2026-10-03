import 'server-only';

import { cookies } from 'next/headers';

import { negociosDe } from '@/lib/db/usuarios.repo';

/**
 * Qué negocio está mirando el panel cuando la cuenta tiene más de uno.
 *
 * La elección vive en una cookie (`negocio_activo`) y NO en la URL: el menú del
 * panel son enlaces fijos, y con `?negocio=` cada cambio de sección volvería al
 * primero. La cookie es solo una preferencia, no una credencial: se vuelve a
 * validar contra los negocios de la sesión en cada lectura, así que un id
 * inventado o ajeno cae al primero de la lista y nunca da acceso a nada.
 */
export const COOKIE_NEGOCIO = 'negocio_activo';

export type NegocioCuenta = Awaited<ReturnType<typeof negociosDe>>[number];

/**
 * Los negocios vivos de la cuenta (los borrados no se eligen) y el que está
 * activo: el de la cookie si sigue siendo suyo, y si no el más reciente.
 */
export async function negocioActivo(
  usuarioId: string,
): Promise<{ negocios: NegocioCuenta[]; actual: NegocioCuenta | null }> {
  const negocios = (await negociosDe(usuarioId)).filter((n) => n.estado !== 'archivado');
  const elegido = (await cookies()).get(COOKIE_NEGOCIO)?.value;
  const actual = negocios.find((n) => n.id === elegido) ?? negocios[0] ?? null;
  return { negocios, actual };
}

/** Enlace a la ficha del negocio en la vitrina: solo existe ahí si está publicada. */
export function hrefFichaPublica(n: Pick<NegocioCuenta, 'id' | 'estado'> | null): string {
  return n?.estado === 'aprobado' ? `/aliados#${n.id}` : '/aliados';
}
