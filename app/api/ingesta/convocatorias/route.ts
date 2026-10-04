import { NextResponse } from 'next/server';
import { leerJsonAcotado, puertaIngesta } from '@/lib/auth/puertaIngesta';
import { ingestarConvocatorias, marcarVencidas } from '@/lib/db/convocatorias.repo';
import { ingestaConvocatoriasSchema } from '@/lib/validation/convocatoria.schema';

/**
 * Entrada del vigía de convocatorias (workflow diario de GitHub Actions).
 *
 * No es una puerta pública: la llama una máquina con `Authorization: Bearer
 * <INGESTA_SECRETO>`. La puerta (503 sin secreto, 401 con header malo, cupo por
 * IP y contador en memoria sin IP) es la de `lib/auth/puertaIngesta.ts`, común
 * con `/api/ingesta/vigia`.
 *
 * Todo entra `pendiente`. El texto sale de páginas de terceros: nada se publica
 * sin un moderador.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 50 convocatorias de a 600 caracteres caben de sobra; más que esto no es el vigía.
const MAX_BYTES = 100_000;

export async function POST(request: Request) {
  const corte = await puertaIngesta(request, 'ingesta/convocatorias');
  if (corte) return corte;

  const leido = await leerJsonAcotado(request, MAX_BYTES);
  if ('respuesta' in leido) return leido.respuesta;

  const parsed = ingestaConvocatoriasSchema.safeParse(leido.json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Cuerpo inválido', detalle: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) },
      { status: 400 },
    );
  }

  // Un fallo de la base es de infraestructura, no del vigía: 503 (reintenta mañana), no 500.
  let nuevas: number;
  let repetidas: number;
  let vencidas: number;
  try {
    ({ nuevas, repetidas } = await ingestarConvocatorias(parsed.data.fuente, parsed.data.items));
    vencidas = await marcarVencidas();
  } catch (e) {
    console.error('[ingesta/convocatorias] la base falló', e instanceof Error ? e.message : e);
    return new NextResponse(null, { status: 503 });
  }

  console.info(`[ingesta/convocatorias] ${parsed.data.fuente}: ${nuevas} nueva(s), ${repetidas} repetida(s), ${vencidas} vencida(s)`);
  return NextResponse.json({ nuevas, repetidas, vencidas });
}
