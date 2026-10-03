import type { Metadata } from 'next';

import { PestanasEstado } from '@/components/admin/PestanasEstado';
import { exigirEquipo } from '@/lib/auth/firmamento';

import { listarPeticiones, contarPorEstado, type EstadoPeticion } from '@/lib/db/peticiones.repo';
import { FichaPeticion } from './_components/FichaPeticion';

export const metadata: Metadata = { title: 'Peticiones' };

// La bandeja cambia con cada mensaje nuevo: no se cachea.
export const dynamic = 'force-dynamic';

const ESTADOS: { id: EstadoPeticion; etiqueta: string }[] = [
  { id: 'nueva', etiqueta: 'Nuevas' },
  { id: 'atendida', etiqueta: 'Atendidas' },
];

export default async function PeticionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  await exigirEquipo();

  const solicitado = (await searchParams).estado;
  const estadoActivo: EstadoPeticion = ESTADOS.some((e) => e.id === solicitado)
    ? (solicitado as EstadoPeticion)
    : 'nueva';

  const [peticiones, conteos] = await Promise.all([
    listarPeticiones(estadoActivo),
    contarPorEstado(),
  ]);

  return (
    <div>
      <p className="max-w-xl font-sans text-base leading-relaxed text-tenue">
        Mensajes que dejó la gente desde /contacto. Se responden por fuera, con
        el contacto que dejó cada uno.
      </p>

      <PestanasEstado ruta="/firmamento/equipo/peticiones" estados={ESTADOS} activo={estadoActivo} conteos={conteos} />

      <section aria-label="Mensajes" className="mt-8">
        {peticiones.length === 0 ? (
          <p className="border-t border-tinta/12 pt-8 font-sans text-tenue">
            {estadoActivo === 'nueva'
              ? 'No hay mensajes nuevos.'
              : 'No hay mensajes en este estado.'}
          </p>
        ) : (
          peticiones.map((p) => <FichaPeticion key={p.id} peticion={p} />)
        )}
      </section>
    </div>
  );
}
