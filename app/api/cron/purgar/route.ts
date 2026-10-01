import { NextResponse } from 'next/server';
import { secretoValido } from '@/lib/auth/secreto';
import { purgarIntentos, purgarIpsViejas } from '@/lib/db/rateLimit';

/**
 * Limpieza diaria de la tabla de rate limiting.
 *
 * Existe porque `purgarIntentos()` estaba escrita y documentada como "se llama
 * desde un cron de Vercel" — y ese cron no existía. La función era código
 * muerto y `intentos_registro` crecía sin techo: una fila por cada registro y
 * cada login fallido, para siempre, sirviendo para nada pasados 15 minutos.
 *
 * El cron se declara en vercel.json. En producción Vercel manda el header
 * Authorization con CRON_SECRET; sin ese chequeo esto sería un endpoint
 * público que cualquiera puede martillar.
 *
 * También anula `ip_registro` pasados 30 días (`purgarIpsViejas`): ver la sección
 * «Conservación» de la política de datos.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;

  // Si el secreto no está configurado el endpoint queda cerrado, no abierto.
  // Fallar cerrado es la única opción defendible: un endpoint de borrado que
  // se abre solo porque falta una variable de entorno es una puerta trasera.
  if (!secreto) {
    console.error('[cron/purgar] falta CRON_SECRET — endpoint deshabilitado');
    return new NextResponse(null, { status: 503 });
  }

  if (!secretoValido(request.headers.get('authorization'), `Bearer ${secreto}`)) {
    return new NextResponse(null, { status: 401 });
  }

  const borrados = await purgarIntentos();
  console.info(`[cron/purgar] ${borrados} intento(s) viejo(s) eliminado(s)`);

  const ipsAnuladas = await purgarIpsViejas();
  console.info(`[cron/purgar] ${ipsAnuladas} ip_registro anulada(s)`);

  return NextResponse.json({ borrados, ipsAnuladas });
}
