import { exigirEntidad } from '@/lib/auth/firmamento';
import { obtenerDatosAbiertos } from '@/lib/db/datos.repo';
import { datosACsv } from '@/lib/firmamento/datosAbiertos';

/**
 * Descarga en CSV de lo mismo que publica `GET /api/datos`. Solo para quien tenga
 * sesión de entidad (la guarda redirige a /firmamento/entrar): el JSON público no
 * la necesita, pero el CSV es una comodidad del panel y no hace falta exponerlo.
 *
 * Sale de `obtenerDatosAbiertos` (caché de 1 h, regla k = 5) y `datosACsv` solo
 * reordena: una celda «<5» sigue siendo «<5».
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  await exigirEntidad();

  try {
    const datos = await obtenerDatosAbiertos();
    const dia = datos.generado_en.slice(0, 10);
    return new Response(datosACsv(datos), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="constelaciones-datos-abiertos-${dia}.csv"`,
        // Es una respuesta con sesión: que ningún intermediario la guarde.
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    // Sin detalles al cliente: un mensaje de la base puede nombrar tablas.
    console.error('[entidad/datos/csv]', e instanceof Error ? e.message : e);
    return new Response('No se pudieron calcular los datos.', { status: 500 });
  }
}
