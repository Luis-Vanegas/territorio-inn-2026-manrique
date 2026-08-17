import { NextResponse } from 'next/server';
import {
  sumarInteraccion,
  TIPOS_INTERACCION,
  type TipoInteraccion,
} from '@/lib/db/interacciones.repo';

/**
 * Endpoint de conteo anónimo.
 *
 * Existe como route handler y no como server action porque el cliente lo llama
 * con `navigator.sendBeacon`: el navegador la manda aunque la persona se vaya
 * de la página en el mismo gesto — que es exactamente lo que pasa al tocar un
 * WhatsApp. Una server action normal se cancelaría a mitad de camino.
 *
 * sendBeacon manda el cuerpo como text/plain, así que se lee con .text() y no
 * con .json(): pedirle un content-type que el navegador no manda haría que
 * todas las llamadas fallaran en silencio.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(await request.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const { id, tipo } = (cuerpo ?? {}) as { id?: unknown; tipo?: unknown };

  if (typeof id !== 'string' || typeof tipo !== 'string') {
    return new NextResponse(null, { status: 400 });
  }
  if (!TIPOS_INTERACCION.includes(tipo as TipoInteraccion)) {
    return new NextResponse(null, { status: 400 });
  }

  await sumarInteraccion(id, tipo as TipoInteraccion);

  // 204 siempre que el pedido tenga forma válida, exista o no el negocio.
  // Un 404 acá permitiría sondear qué ids hay en la base.
  return new NextResponse(null, { status: 204 });
}
