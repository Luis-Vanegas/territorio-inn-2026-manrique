import { PestanasEstado } from '@/components/admin/PestanasEstado';

import {
  listarCandidatosPorEstado,
  contarCandidatosPorEstado,
  type EstadoCandidato,
} from '@/lib/db/candidatos.repo';
import { FichaCandidato } from './_components/FichaCandidato';

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
  const solicitado = (await searchParams).estado;
  const estadoActivo: EstadoCandidato = ESTADOS.some((e) => e.id === solicitado)
    ? (solicitado as EstadoCandidato)
    : 'pendiente';

  const [registros, conteos] = await Promise.all([
    listarCandidatosPorEstado(estadoActivo),
    contarCandidatosPorEstado(),
  ]);

  return (
    <main className="margen-editorial py-16">
      <h1 className="font-display text-4xl font-medium leading-tight text-tinta">Empleo</h1>

      <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-tinta/60">
        Personas que buscan trabajo. Acá se publican teléfonos reales, así que
        la moderación filtra spam y datos falsos antes de que salgan a la
        vitrina.
      </p>

      <PestanasEstado ruta="/admin/empleo" estados={ESTADOS} activo={estadoActivo} conteos={conteos} />

      <section className="mt-12">
        {registros.length === 0 ? (
          <p className="border-t border-tinta/12 pt-8 font-sans text-tinta/60">
            {estadoActivo === 'pendiente'
              ? 'No hay nada esperando revisión.'
              : 'No hay registros en este estado.'}
          </p>
        ) : (
          registros.map((c) => <FichaCandidato key={c.id} candidato={c} />)
        )}
      </section>
    </main>
  );
}
