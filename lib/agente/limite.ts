import 'server-only';

import { headers } from 'next/headers';

import { verificarLimite, registrarIntento, ipDesdeHeaders } from '@/lib/db/rateLimit';

/**
 * Cupo del asesor por IP: lo comparten la consulta del negocio y la de
 * moderación, así que el tope de `agente` (ver lib/db/rateLimit.ts) protege
 * el gasto del modelo sin importar por cuál puerta llegue la pregunta.
 *
 * Devuelve el mensaje para la persona si ya se pasó del cupo, o `null` si puede
 * seguir — y en ese caso el intento ya quedó contado.
 *
 * Se cuenta ANTES de llamar al modelo: si solo contáramos las consultas que
 * terminan bien, se podría martillar el endpoint con entradas que fallan
 * después del límite y gastar igual.
 */
export async function gastarCupoAgente(): Promise<string | null> {
  const ip = ipDesdeHeaders(await headers());
  const limite = await verificarLimite(ip, 'agente');

  if (!limite.permitido) {
    return `Has hecho varias preguntas seguidas. Espera ${limite.minutosRestantes} minuto${
      limite.minutosRestantes === 1 ? '' : 's'
    } y vuelve a intentar.`;
  }

  await registrarIntento(ip, 'agente');
  return null;
}
