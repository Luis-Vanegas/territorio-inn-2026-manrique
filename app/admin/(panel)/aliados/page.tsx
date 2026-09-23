import { PestanasEstado } from '@/components/admin/PestanasEstado';

import {
  listarParaModerar,
  contarPorEstado,
  listarCategorias,
  type EstadoPortafolio,
} from '@/lib/db/portafolios.repo';
import { listarTodosLosCampos } from '@/lib/db/camposPersonalizados.repo';
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
  searchParams: Promise<{ estado?: string }>;
}) {
  const solicitado = (await searchParams).estado;
  const estadoActivo: EstadoPortafolio = ESTADOS.some((e) => e.id === solicitado)
    ? (solicitado as EstadoPortafolio)
    : 'pendiente';

  const [registros, conteos, definicionesCampos, categorias] = await Promise.all([
    listarParaModerar(estadoActivo),
    contarPorEstado(),
    listarTodosLosCampos(),
    listarCategorias(),
  ]);

  return (
    <main className="margen-editorial py-16">
      <h1 className="font-display text-4xl font-medium leading-tight text-tinta">
        Cola de moderación
      </h1>

      <p className="mt-3 max-w-xl font-sans text-sm text-tinta/60">
        Cada registro aprobado se publica en el mapa de Aliados de inmediato.
      </p>

      <PestanasEstado ruta="/admin/aliados" estados={ESTADOS} activo={estadoActivo} conteos={conteos} />

      <section className="mt-12">
        {registros.length === 0 ? (
          <p className="border-t border-tinta/12 pt-8 font-sans text-tinta/60">
            {estadoActivo === 'pendiente'
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
            />
          ))
        )}
      </section>
    </main>
  );
}
