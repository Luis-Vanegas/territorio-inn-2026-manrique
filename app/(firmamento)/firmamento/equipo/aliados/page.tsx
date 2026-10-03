import type { Metadata } from 'next';
import Link from 'next/link';

import { PestanasEstado } from '@/components/admin/PestanasEstado';
import { exigirEquipo } from '@/lib/auth/firmamento';
import {
  listarParaModerar,
  contarPorEstado,
  listarCategorias,
  type EstadoPortafolio,
} from '@/lib/db/portafolios.repo';
import { listarTodosLosCampos } from '@/lib/db/camposPersonalizados.repo';
import { estadoDeFicha } from '@/lib/db/equipo.repo';
import { FichaModeracion } from './_components/FichaModeracion';

export const metadata: Metadata = { title: 'Fichas de aliados' };

// La cola cambia con cada registro nuevo: no se cachea.
export const dynamic = 'force-dynamic';

const RUTA = '/firmamento/equipo/aliados';

const ESTADOS: { id: EstadoPortafolio; etiqueta: string }[] = [
  { id: 'pendiente', etiqueta: 'Pendientes' },
  { id: 'aprobado', etiqueta: 'Publicados' },
  { id: 'rechazado', etiqueta: 'Rechazados' },
  { id: 'archivado', etiqueta: 'Archivados' },
];

/**
 * Todas las fichas por estado. `?ficha=<id>` muestra solo esa (y, si está
 * publicada, con la edición abierta): es a donde llevan «Cambios recientes» y
 * las alertas de calidad de Moderación.
 */
export default async function AliadosEquipoPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; ficha?: string }>;
}) {
  await exigirEquipo();

  const { estado: solicitado, ficha } = await searchParams;
  // Con `?ficha=` y sin estado, se abre en la pestaña donde está la ficha hoy.
  const estadoActivo: EstadoPortafolio = ESTADOS.some((e) => e.id === solicitado)
    ? (solicitado as EstadoPortafolio)
    : ((ficha ? await estadoDeFicha(ficha) : null) ?? 'pendiente');

  const [todos, conteos, definicionesCampos, categorias] = await Promise.all([
    listarParaModerar(estadoActivo),
    contarPorEstado(),
    listarTodosLosCampos(),
    listarCategorias(),
  ]);
  const registros = ficha ? todos.filter((r) => r.id === ficha) : todos;

  return (
    <div>
      <p className="max-w-2xl font-sans text-base leading-relaxed text-tenue">
        Cada registro aprobado se publica en el mapa de Aliados de inmediato. Las
        fichas publicadas se pueden corregir con «Editar ficha».
      </p>

      <PestanasEstado ruta={RUTA} estados={ESTADOS} activo={estadoActivo} conteos={conteos} />

      {ficha && (
        <p className="mt-6 font-sans text-sm text-tenue">
          Viendo una sola ficha.{' '}
          <Link
            href={`${RUTA}?estado=${estadoActivo}`}
            className="inline-flex min-h-[44px] items-center text-sodio underline underline-offset-4"
          >
            Ver toda la lista
          </Link>
        </p>
      )}

      <section aria-label="Fichas" className="mt-8">
        {registros.length === 0 ? (
          <p className="border-t border-tinta/12 pt-8 font-sans text-tenue">
            {ficha
              ? 'Esa ficha no está en este estado: puede que ya la hayan movido.'
              : estadoActivo === 'pendiente'
                ? 'No hay nada esperando revisión.'
                : 'No hay registros en este estado.'}
          </p>
        ) : (
          registros.map((r) => (
            <FichaModeracion
              key={r.id}
              portafolio={r}
              definicionesCampos={definicionesCampos}
              categorias={categorias}
              editarAlAbrir={r.id === ficha}
            />
          ))
        )}
      </section>
    </div>
  );
}
