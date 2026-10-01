import { NextResponse } from 'next/server';
import { obtenerDatosAbiertos } from '@/lib/db/datos.repo';
import { ipDesdeHeaders, registrarIntento, verificarLimite } from '@/lib/db/rateLimit';

/**
 * Datos abiertos agregados de la plataforma. Qué sale y qué no está en
 * `lib/db/datos.repo.ts`; la regla k = 5 en `lib/privacidad/kAnonimato.ts`.
 *
 * CORS abierto (`*`) a propósito: es un recurso público y de solo lectura, sin
 * cookies ni credenciales, pensado para que otros proyectos del reto o la prensa
 * lo consuman desde el navegador. Por eso mismo no puede devolver nada que no
 * se publicaría en una vitrina.
 *
 * Caché: 1 h en la caché de datos de Next (repo) y en el CDN (`s-maxage`).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
} as const;

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const ip = ipDesdeHeaders(request.headers);

  const limite = await verificarLimite(ip, 'datos');
  if (!limite.permitido) {
    return NextResponse.json(
      { error: 'Demasiadas consultas. Intenta de nuevo más tarde.' },
      {
        status: 429,
        headers: { ...CORS, 'Retry-After': String(limite.minutosRestantes * 60) },
      },
    );
  }

  // Anotar el intento no debe tumbar una lectura pública de agregados: si la
  // escritura falla se registra y se sigue (el cupo es una defensa, no el servicio).
  await registrarIntento(ip, 'datos').catch((e) =>
    console.error('[api/datos] no se pudo anotar el intento', e instanceof Error ? e.message : e),
  );

  try {
    const datos = await obtenerDatosAbiertos();
    return NextResponse.json(datos, {
      headers: {
        ...CORS,
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (e) {
    // Sin detalles al cliente: un mensaje de la base puede nombrar tablas.
    console.error('[api/datos]', e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: 'No se pudieron calcular los datos.' },
      { status: 500, headers: CORS },
    );
  }
}
