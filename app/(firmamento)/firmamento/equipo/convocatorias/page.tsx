import type { Metadata } from 'next';

import { PestanasEstado } from '@/components/admin/PestanasEstado';
import { exigirEquipo } from '@/lib/auth/firmamento';
import {
  listarConvocatorias,
  contarConvocatoriasPorEstado,
  ESTADOS_CONVOCATORIA,
  type EstadoConvocatoria,
} from '@/lib/db/convocatorias.repo';
import { matrizAlcance } from '@/lib/db/equipo.repo';
import { listarCategorias } from '@/lib/db/portafolios.repo';
import { FichaConvocatoria } from './_components/FichaConvocatoria';

export const metadata: Metadata = { title: 'Convocatorias' };

// La cola cambia con cada corrida del vigía y con cada decisión: no se cachea.
export const dynamic = 'force-dynamic';

const ESTADOS: { id: EstadoConvocatoria; etiqueta: string }[] = [
  { id: 'pendiente', etiqueta: 'Por revisar' },
  { id: 'aprobada', etiqueta: 'Aprobadas' },
  { id: 'descartada', etiqueta: 'Descartadas' },
  { id: 'vencida', etiqueta: 'Vencidas' },
];

export default async function ConvocatoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  await exigirEquipo();

  const solicitado = (await searchParams).estado;
  const estadoActivo: EstadoConvocatoria =
    ESTADOS_CONVOCATORIA.find((e) => e === solicitado) ?? 'pendiente';

  const [convocatorias, conteos, categorias, matriz] = await Promise.all([
    listarConvocatorias(estadoActivo),
    contarConvocatoriasPorEstado(),
    listarCategorias(),
    // Solo alimenta el «llegaría a N aliados»: si falla, la cola sigue sin la cifra.
    matrizAlcance().catch((e) => {
      console.error('[equipo/convocatorias] alcance', e instanceof Error ? e.message : e);
      return null;
    }),
  ]);
  const opcionesCategoria = categorias.map((c) => ({ id: c.id, nombre: c.nombre }));
  // Las propuestas de una entidad primero: alguien de afuera está esperando respuesta.
  const ordenadas = [...convocatorias].sort(
    (a, b) => Number(b.origen === 'entidad') - Number(a.origen === 'entidad'),
  );
  const propuestas = convocatorias.filter((c) => c.origen === 'entidad').length;

  return (
    <div>
      <p className="max-w-2xl font-sans text-base leading-relaxed text-tinta/70">
        Oferta de entidades: la que detecta el vigía cada día y la que proponen
        las entidades aliadas desde su panel. Todo entra por revisar: solo las que
        apruebes aparecen en «Para ti» de los negocios, y solo a los de las
        categorías y la formalidad que marques al aprobar. El texto viene de
        terceros: revisa el enlace antes de aprobar.
      </p>

      <PestanasEstado
        ruta="/firmamento/equipo/convocatorias"
        estados={ESTADOS}
        activo={estadoActivo}
        conteos={conteos}
      />

      {propuestas > 0 && (
        <p className="mt-6 font-sans text-sm text-tinta/70">
          <span className="font-sans text-tinta tabular-nums">{propuestas}</span>{' '}
          {propuestas === 1 ? 'la propuso una entidad' : 'las propusieron entidades'}; van primero.
        </p>
      )}

      <section aria-label="Convocatorias" className="mt-8">
        {ordenadas.length === 0 ? (
          <p className="border-t border-tinta/12 pt-8 font-sans text-tinta/70">
            No hay convocatorias en este estado.
          </p>
        ) : (
          ordenadas.map((c) => (
            <FichaConvocatoria key={c.id} convocatoria={c} categorias={opcionesCategoria} matriz={matriz} />
          ))
        )}
      </section>
    </div>
  );
}
