import { NextResponse } from 'next/server';
import { leerJsonAcotado, puertaIngesta } from '@/lib/auth/puertaIngesta';
import { registrarCorrida } from '@/lib/db/vigia.repo';
import { informeVigiaSchema } from '@/lib/validation/vigia.schema';

/**
 * Informe de UNA corrida del vigía: qué fuentes respondieron, cuáles fallaron,
 * cuáles cambiaron y cuántas candidatas nuevas trajo cada una. Lo manda el mismo
 * script que manda las convocatorias, al final de la corrida, con el mismo
 * `Authorization: Bearer <INGESTA_SECRETO>` y la misma puerta
 * (`lib/auth/puertaIngesta.ts`: 503 sin secreto, 401 con header malo, cupo).
 *
 * Solo deja rastro: no publica ni cambia nada de la vitrina. Lo que trae (URLs,
 * textos de error) sale de páginas de terceros, por eso Zod estricto.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 50 fuentes de unos 600 bytes caben de sobra.
const MAX_BYTES = 60_000;

export async function POST(request: Request) {
  const corte = await puertaIngesta(request, 'ingesta/vigia');
  if (corte) return corte;

  const leido = await leerJsonAcotado(request, MAX_BYTES);
  if ('respuesta' in leido) return leido.respuesta;

  const parsed = informeVigiaSchema.safeParse(leido.json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Cuerpo inválido', detalle: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) },
      { status: 400 },
    );
  }

  try {
    const r = await registrarCorrida(parsed.data);
    console.info(
      `[ingesta/vigia] ${parsed.data.origen}: ${r.respondieron}/${r.totalFuentes} fuente(s) respondieron, ${r.totalNuevas} nueva(s)`,
    );
    return NextResponse.json({
      corrida_id: r.corridaId,
      fuentes: r.totalFuentes,
      respondieron: r.respondieron,
      nuevas: r.totalNuevas,
    });
  } catch (e) {
    console.error('[ingesta/vigia] la base falló', e instanceof Error ? e.message : e);
    return new NextResponse(null, { status: 503 });
  }
}
