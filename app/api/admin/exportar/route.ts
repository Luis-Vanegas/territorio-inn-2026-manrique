import { NextResponse } from 'next/server';

import { verificarSesion } from '@/lib/auth/admin';
import { exportarAliados } from '@/lib/db/estadisticas.repo';
import { interaccionesCrudas } from '@/lib/db/interacciones.repo';
import { aCsv, BOM_UTF8 } from '@/lib/csv';

/**
 * Descarga de los datos del módulo en CSV, para analizarlos fuera del panel.
 *
 * Verifica la sesión ACÁ y no confía en ningún layout: un route handler no
 * pasa por `app/admin/(panel)/layout.tsx`. Sin esta línea, la ruta sería una
 * exportación pública de toda la base — el mismo razonamiento por el que cada
 * server action revalida por su cuenta.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONJUNTOS = ['aliados', 'interacciones'] as const;
type Conjunto = (typeof CONJUNTOS)[number];

export async function GET(request: Request) {
  const sesion = await verificarSesion();
  if (!sesion) return new NextResponse(null, { status: 401 });

  const pedido = new URL(request.url).searchParams.get('conjunto') ?? 'aliados';
  if (!CONJUNTOS.includes(pedido as Conjunto)) {
    return NextResponse.json(
      { error: `conjunto debe ser uno de: ${CONJUNTOS.join(', ')}` },
      { status: 400 },
    );
  }

  const conjunto = pedido as Conjunto;
  const csv =
    conjunto === 'aliados'
      ? aCsv(await exportarAliados(), [
          { clave: 'id', encabezado: 'id' },
          { clave: 'nombre', encabezado: 'nombre' },
          { clave: 'categoria', encabezado: 'categoria' },
          { clave: 'barrio', encabezado: 'barrio' },
          { clave: 'direccion', encabezado: 'direccion' },
          { clave: 'latitud', encabezado: 'latitud' },
          { clave: 'longitud', encabezado: 'longitud' },
          { clave: 'estado', encabezado: 'estado' },
          { clave: 'tiene_foto', encabezado: 'tiene_foto' },
          { clave: 'creado_en', encabezado: 'creado_en' },
          { clave: 'moderado_en', encabezado: 'moderado_en' },
          { clave: 'horas_hasta_moderacion', encabezado: 'horas_hasta_moderacion' },
          { clave: 'vistas', encabezado: 'vistas' },
          { clave: 'contactos', encabezado: 'contactos' },
        ])
      : aCsv(await interaccionesCrudas(), [
          { clave: 'dia', encabezado: 'dia' },
          { clave: 'portafolio_id', encabezado: 'portafolio_id' },
          { clave: 'negocio', encabezado: 'negocio' },
          { clave: 'tipo', encabezado: 'tipo' },
          { clave: 'conteo', encabezado: 'conteo' },
        ]);

  // La fecha va en el nombre: dos exportaciones distintas no pueden terminar
  // como "aliados (1).csv" en la carpeta de Descargas sin saber cuál es cuál.
  const fecha = new Date().toISOString().slice(0, 10);

  return new NextResponse(BOM_UTF8 + csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="territorio-inn-${conjunto}-${fecha}.csv"`,
      // Un export es una foto de este instante: cachearlo daría datos viejos
      // sin que nadie se entere.
      'cache-control': 'no-store',
    },
  });
}
