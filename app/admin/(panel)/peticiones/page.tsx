import Link from 'next/link';

import { listarPeticiones, contarPorEstado, type EstadoPeticion } from '@/lib/db/peticiones.repo';
import { FichaPeticion } from './_components/FichaPeticion';

// La bandeja cambia con cada mensaje nuevo: no se cachea.
export const dynamic = 'force-dynamic';

const ESTADOS: { id: EstadoPeticion; etiqueta: string }[] = [
  { id: 'nueva', etiqueta: 'Nuevas' },
  { id: 'atendida', etiqueta: 'Atendidas' },
];

export default async function PeticionesPage({
  searchParams,
}: {
  searchParams: { estado?: string };
}) {
  const solicitado = searchParams.estado;
  const estadoActivo: EstadoPeticion = ESTADOS.some((e) => e.id === solicitado)
    ? (solicitado as EstadoPeticion)
    : 'nueva';

  const [peticiones, conteos] = await Promise.all([
    listarPeticiones(estadoActivo),
    contarPorEstado(),
  ]);

  return (
    <main className="margen-editorial py-16">
      <h1 className="font-display text-4xl font-medium leading-tight text-tinta">
        Buzón de peticiones
      </h1>

      <p className="mt-3 max-w-xl font-sans text-sm text-tinta/60">
        Mensajes que dejó la gente desde /contacto. Se responden por fuera, con
        el contacto que dejó cada uno.
      </p>

      <nav aria-label="Filtrar por estado" className="mt-8 flex flex-wrap gap-2">
        {ESTADOS.map((e) => {
          const activo = e.id === estadoActivo;
          return (
            <Link
              key={e.id}
              href={`/admin/peticiones?estado=${e.id}`}
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
        {peticiones.length === 0 ? (
          <p className="border-t border-tinta/12 pt-8 font-sans text-tinta/60">
            {estadoActivo === 'nueva'
              ? 'No hay mensajes nuevos.'
              : 'No hay mensajes en este estado.'}
          </p>
        ) : (
          peticiones.map((p) => <FichaPeticion key={p.id} peticion={p} />)
        )}
      </section>
    </main>
  );
}
