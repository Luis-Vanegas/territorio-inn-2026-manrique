import Link from 'next/link';

import {
  listarParaModerar,
  contarPorEstado,
  type EstadoPortafolio,
} from '@/lib/db/portafolios.repo';
import { FichaModeracion } from './_components/FichaModeracion';

// La cola cambia con cada registro nuevo: no se cachea.
export const dynamic = 'force-dynamic';

const ESTADOS: { id: EstadoPortafolio; etiqueta: string }[] = [
  { id: 'pendiente', etiqueta: 'Pendientes' },
  { id: 'aprobado', etiqueta: 'Publicados' },
  { id: 'rechazado', etiqueta: 'Rechazados' },
  { id: 'archivado', etiqueta: 'Archivados' },
];

export default async function ModeracionPage({
  searchParams,
}: {
  searchParams: { estado?: string };
}) {
  const solicitado = searchParams.estado;
  const estadoActivo: EstadoPortafolio = ESTADOS.some((e) => e.id === solicitado)
    ? (solicitado as EstadoPortafolio)
    : 'pendiente';

  const [registros, conteos] = await Promise.all([
    listarParaModerar(estadoActivo),
    contarPorEstado(),
  ]);

  return (
    <main className="margen-editorial py-16">
      <h1 className="font-display text-4xl font-medium leading-tight text-tinta">
        Cola de moderación
      </h1>

      <p className="mt-3 max-w-xl font-sans text-sm text-tinta/60">
        Cada registro aprobado se publica en el mapa de Aliados de inmediato.
      </p>

      <nav aria-label="Filtrar por estado" className="mt-8 flex flex-wrap gap-2">
        {ESTADOS.map((e) => {
          const activo = e.id === estadoActivo;
          return (
            <Link
              key={e.id}
              href={`/admin/aliados?estado=${e.id}`}
              aria-current={activo ? 'page' : undefined}
              className={[
                'inline-flex items-baseline gap-1.5 border px-3 py-1.5 font-mono text-xs transition-colors',
                activo
                  ? 'border-terracota bg-terracota text-hueso'
                  : 'border-tinta/15 text-tinta/65 hover:border-terracota hover:text-terracota',
              ].join(' ')}
            >
              {e.etiqueta}
              <span className="opacity-60">{conteos[e.id]}</span>
            </Link>
          );
        })}
      </nav>

      <section className="mt-12">
        {registros.length === 0 ? (
          <p className="border-t border-tinta/12 pt-8 font-sans text-tinta/60">
            {estadoActivo === 'pendiente'
              ? 'No hay nada esperando revisión.'
              : 'No hay registros en este estado.'}
          </p>
        ) : (
          registros.map((r) => <FichaModeracion key={r.id} portafolio={r} />)
        )}
      </section>
    </main>
  );
}
