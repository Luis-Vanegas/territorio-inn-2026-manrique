import { NextResponse } from 'next/server';
import { secretoValido } from '@/lib/auth/secreto';
import { ingestarConvocatorias, marcarVencidas } from '@/lib/db/convocatorias.repo';
import { ingestaConvocatoriasSchema } from '@/lib/validation/convocatoria.schema';

/**
 * Entrada del vigía de convocatorias (workflow diario de GitHub Actions).
 *
 * No es una puerta pública: la llama una máquina con `Authorization: Bearer
 * <INGESTA_SECRETO>`. Sin la variable el endpoint queda CERRADO (503), igual que
 * `/api/cron/purgar`: un endpoint de escritura que se abre solo porque falta una
 * variable de entorno es una puerta trasera. 503 = falta el secreto; 401 = está
 * bien puesto y el header no coincide.
 *
 * Todo entra `pendiente`. El texto sale de páginas de terceros: nada se publica
 * sin un moderador.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 50 convocatorias de a 600 caracteres caben de sobra; más que esto no es el vigía.
const MAX_BYTES = 100_000;

export async function POST(request: Request) {
  const secreto = process.env.INGESTA_SECRETO;
  if (!secreto) {
    console.error('[ingesta/convocatorias] falta INGESTA_SECRETO — endpoint deshabilitado');
    return new NextResponse(null, { status: 503 });
  }

  if (!secretoValido(request.headers.get('authorization'), `Bearer ${secreto}`)) {
    return new NextResponse(null, { status: 401 });
  }

  const cuerpo = await request.text();
  if (cuerpo.length > MAX_BYTES) return new NextResponse(null, { status: 413 });

  let json: unknown;
  try {
    json = JSON.parse(cuerpo);
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = ingestaConvocatoriasSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Cuerpo inválido', detalle: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) },
      { status: 400 },
    );
  }

  const { nuevas, repetidas } = await ingestarConvocatorias(parsed.data.fuente, parsed.data.items);
  const vencidas = await marcarVencidas();

  console.info(`[ingesta/convocatorias] ${parsed.data.fuente}: ${nuevas} nueva(s), ${repetidas} repetida(s), ${vencidas} vencida(s)`);
  return NextResponse.json({ nuevas, repetidas, vencidas });
}
