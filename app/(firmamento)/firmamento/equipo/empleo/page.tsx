import type { Metadata } from 'next';

import { PestanasEstado } from '@/components/admin/PestanasEstado';
import { exigirEquipo } from '@/lib/auth/firmamento';

import {
  listarCandidatosPorEstado,
  contarCandidatosPorEstado,
  type EstadoCandidato,
} from '@/lib/db/candidatos.repo';
import { FichaCandidato } from './_components/FichaCandidato';

export const metadata: Metadata = { title: 'Empleo' };

// La cola cambia con cada registro nuevo: no se cachea.
export const dynamic = 'force-dynamic';

const ESTADOS: { id: EstadoCandidato; etiqueta: string }[] = [
  { id: 'pendiente', etiqueta: 'Pendientes' },
  { id: 'aprobado', etiqueta: 'Publicados' },
  { id: 'rechazado', etiqueta: 'Rechazados' },
  { id: 'archivado', etiqueta: 'Retirados' },
];

export default async function AdminEmpleoPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  await exigirEquipo();

  const solicitado = (await searchParams).estado;
  const estadoActivo: EstadoCandidato = ESTADOS.some((e) => e.id === solicitado)
    ? (solicitado as EstadoCandidato)
    : 'pendiente';

  const [registros, conteos] = await Promise.all([
    listarCandidatosPorEstado(estadoActivo),
    contarCandidatosPorEstado(),
  ]);

  return (
    <div>
      <PestanasEstado ruta="/firmamento/equipo/empleo" estados={ESTADOS} activo={estadoActivo} conteos={conteos} />

      <section aria-label="Registros" className="mt-8">
        {registros.length === 0 ? (
          <p className="border-t border-tinta/12 pt-8 font-sans text-tinta/70">
            {estadoActivo === 'pendiente'
              ? 'No hay nada esperando revisión.'
              : 'No hay registros en este estado.'}
          </p>
        ) : (
          registros.map((c) => <FichaCandidato key={c.id} candidato={c} />)
        )}
      </section>
    </div>
  );
}
