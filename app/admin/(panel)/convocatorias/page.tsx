import { PestanasEstado } from '@/components/admin/PestanasEstado';
import {
  listarConvocatorias,
  contarConvocatoriasPorEstado,
  ESTADOS_CONVOCATORIA,
  type EstadoConvocatoria,
} from '@/lib/db/convocatorias.repo';
import { listarCategorias } from '@/lib/db/portafolios.repo';
import { FichaConvocatoria } from './_components/FichaConvocatoria';

// La cola cambia con cada corrida del vigía y con cada decisión: no se cachea.
export const dynamic = 'force-dynamic';

const ESTADOS: { id: EstadoConvocatoria; etiqueta: string }[] = [
  { id: 'pendiente', etiqueta: 'Pendientes' },
  { id: 'aprobada', etiqueta: 'Aprobadas' },
  { id: 'descartada', etiqueta: 'Descartadas' },
  { id: 'vencida', etiqueta: 'Vencidas' },
];

export default async function ConvocatoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const solicitado = (await searchParams).estado;
  const estadoActivo: EstadoConvocatoria =
    ESTADOS_CONVOCATORIA.find((e) => e === solicitado) ?? 'pendiente';

  const [convocatorias, conteos, categorias] = await Promise.all([
    listarConvocatorias(estadoActivo),
    contarConvocatoriasPorEstado(),
    listarCategorias(),
  ]);
  const nombreCategoria = Object.fromEntries(categorias.map((c) => [c.id, c.nombre]));

  return (
    <main className="margen-editorial py-16">
      <h1 className="font-display text-4xl font-medium leading-tight text-tinta">
        Convocatorias
      </h1>

      <p className="mt-3 max-w-xl font-sans text-sm text-tinta/60">
        Oferta de entidades que detecta el vigía cada día. Todo entra pendiente:
        solo las que apruebes aparecen en «Para ti», dentro de Mi cuenta, y solo
        a los negocios de las categorías a las que aplican. El texto viene de
        páginas de terceros: revisa el enlace antes de aprobar.
      </p>

      <PestanasEstado
        ruta="/admin/convocatorias"
        estados={ESTADOS}
        activo={estadoActivo}
        conteos={conteos}
      />

      <section className="mt-12">
        {convocatorias.length === 0 ? (
          <p className="border-t border-tinta/12 pt-8 font-sans text-tinta/60">
            No hay convocatorias en este estado.
          </p>
        ) : (
          convocatorias.map((c) => (
            <FichaConvocatoria key={c.id} convocatoria={c} nombreCategoria={nombreCategoria} />
          ))
        )}
      </section>
    </main>
  );
}
