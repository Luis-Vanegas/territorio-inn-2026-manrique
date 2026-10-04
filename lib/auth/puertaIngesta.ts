import 'server-only';
import { NextResponse } from 'next/server';
import { secretoValido } from '@/lib/auth/secreto';
import { ipDesdeHeaders, registrarIntento, verificarLimite } from '@/lib/db/rateLimit';
import { excedeLimite } from '@/lib/limiteMemoria';

/**
 * La puerta común de los endpoints del vigía (`/api/ingesta/convocatorias` y
 * `/api/ingesta/vigia`): una sola, para que no haya dos criterios de seguridad
 * para lo mismo. Devuelve la respuesta que corta la petición, o `null` si pasa.
 *
 * - Sin `INGESTA_SECRETO` queda CERRADO (503): un endpoint de escritura que se
 *   abre solo porque falta una variable de entorno es una puerta trasera.
 * - Un secreto equivocado gasta cupo (origen 'ingesta'): sin eso sería un blanco
 *   para probar secretos sin límite. El acierto no gasta nada.
 * - Sin IP, `verificarLimite` deja pasar (no hay a quién contarle el intento):
 *   quien quita los headers se saltaría el cupo. Todas las peticiones sin IP
 *   comparten un contador en memoria, mismo tope que el de base. El vigía
 *   legítimo (GitHub Actions) siempre trae IP.
 * - Si la base del límite no responde, 503 (no 500): es infraestructura y el
 *   vigía reintenta mañana.
 *
 * `etiqueta` es solo para el log.
 */
export async function puertaIngesta(request: Request, etiqueta: string): Promise<NextResponse | null> {
  const secreto = process.env.INGESTA_SECRETO;
  if (!secreto) {
    console.error(`[${etiqueta}] falta INGESTA_SECRETO — endpoint deshabilitado`);
    return new NextResponse(null, { status: 503 });
  }

  const ip = ipDesdeHeaders(request.headers);

  if (!ip && excedeLimite('ingesta:sin-ip', 8, 15 * 60_000)) {
    return new NextResponse(null, { status: 429, headers: { 'Retry-After': String(15 * 60) } });
  }

  let limite: Awaited<ReturnType<typeof verificarLimite>>;
  try {
    limite = await verificarLimite(ip, 'ingesta');
  } catch (e) {
    console.error(`[${etiqueta}] verificarLimite falló`, e instanceof Error ? e.message : e);
    return new NextResponse(null, { status: 503 });
  }
  if (!limite.permitido) {
    return new NextResponse(null, {
      status: 429,
      headers: { 'Retry-After': String(limite.minutosRestantes * 60) },
    });
  }

  if (!secretoValido(request.headers.get('authorization'), `Bearer ${secreto}`)) {
    await registrarIntento(ip, 'ingesta').catch((e) =>
      console.error(`[${etiqueta}] no se pudo anotar el intento`, e instanceof Error ? e.message : e),
    );
    return new NextResponse(null, { status: 401 });
  }

  return null;
}

/**
 * Lee el cuerpo con tope de tamaño y lo parsea. `Content-Length` primero: no se
 * lee un cuerpo enorme solo para descartarlo (sin la cabecera —chunked— vale el
 * chequeo de después de leer).
 */
export async function leerJsonAcotado(
  request: Request,
  maxBytes: number,
): Promise<{ json: unknown } | { respuesta: NextResponse }> {
  const declarado = Number(request.headers.get('content-length'));
  if (Number.isFinite(declarado) && declarado > maxBytes) return { respuesta: new NextResponse(null, { status: 413 }) };

  const cuerpo = await request.text();
  if (cuerpo.length > maxBytes) return { respuesta: new NextResponse(null, { status: 413 }) };

  try {
    return { json: JSON.parse(cuerpo) };
  } catch {
    return { respuesta: NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) };
  }
}
