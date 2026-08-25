import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { purgarIntentos } from '@/lib/db/rateLimit';

/**
 * Compara el header contra el secreto en tiempo constante.
 *
 * Era la única comparación de secreto del proyecto que usaba `!==` mientras
 * `lib/auth/admin.ts` ya comparaba con `timingSafeEqual`. El riesgo práctico de
 * un ataque de timing contra una función serverless es bajo por el jitter de
 * red, pero tener dos criterios distintos para lo mismo es lo que hace que la
 * próxima comparación se escriba mal.
 *
 * Va inline y no en un módulo compartido: son cuatro líneas y dos usos: extraer
 * un `lib/` para esto agregaría un archivo sin quitar ninguno.
 */
function autorizado(recibido: string | null, esperado: string): boolean {
  if (!recibido) return false;

  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);

  // timingSafeEqual tira RangeError si los largos difieren, así que el chequeo
  // de longitud va antes. Filtra el largo del secreto, no su contenido.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

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

  if (!autorizado(request.headers.get('authorization'), `Bearer ${secreto}`)) {
    return new NextResponse(null, { status: 401 });
  }

  const borrados = await purgarIntentos();
  console.info(`[cron/purgar] ${borrados} intento(s) viejo(s) eliminado(s)`);

  return NextResponse.json({ borrados });
}
