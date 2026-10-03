import type { Metadata } from 'next';

import { FormularioEdicionPortafolio } from '@/components/FormularioEdicionPortafolio';
import { actualizarFichaDeCuenta } from '@/lib/actions/gestionarEstado';
import { exigirNegocio } from '@/lib/auth/firmamento';
import { listarCategorias, obtenerPropio } from '@/lib/db/portafolios.repo';
import { completitudFicha } from '@/lib/firmamento/ficha';
import { negocioActivo } from '@/lib/firmamento/negocio';
import { BorrarFichaPanel } from '../_components/BorrarFichaPanel';
import { BarraFicha, ChecklistFicha } from '../_components/FichaCompleta';
import { EstadoFicha } from '../_components/EstadoFicha';
import { SelectorNegocio } from '../_components/SelectorNegocio';
import { SinNegocio } from '../_components/SinNegocio';
import { VistaPreviaFicha } from '../_components/VistaPreviaFicha';

export const metadata: Metadata = { title: 'Mi ficha' };

export const dynamic = 'force-dynamic';

export default async function NegocioFichaPage() {
  const { usuarioId } = await exigirNegocio();
  const { negocios, actual } = await negocioActivo(usuarioId);

  if (!actual) {
    return <SinNegocio aviso="Cuando registres tu negocio, aquí puedes corregir tus datos y completar tu ficha." />;
  }

  const [portafolio, categorias] = await Promise.all([obtenerPropio(usuarioId, actual.id), listarCategorias()]);
  if (!portafolio) return <SinNegocio aviso="No encontramos ese negocio en tu cuenta." />;

  const ficha = completitudFicha(portafolio);

  return (
    <div className="mx-auto max-w-6xl">
      <SelectorNegocio negocios={negocios} actual={actual} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0">
          <EstadoFicha estado={portafolio.estado} motivo={portafolio.motivo_rechazo} conAprobada />

          <div className="mt-6 rounded-xl border border-trazo bg-noche-2 p-5 sm:p-6">
            <h2 className="font-display text-2xl font-medium text-estrella">Datos de tu ficha</h2>
            <p className="mt-1 font-sans text-sm text-tenue">
              Así los ven tus vecinos en Constelaciones. Corrige lo que haga falta y guarda al final.
            </p>
            {/* `key`: al cambiar de negocio el formulario arranca de cero; sus valores iniciales son los del negocio elegido. */}
            <FormularioEdicionPortafolio
              key={portafolio.id}
              portafolio={portafolio}
              categorias={categorias}
              accion={actualizarFichaDeCuenta.bind(null, portafolio.id)}
              variante="panel"
            />
          </div>

          <div className="mt-10">
            <BorrarFichaPanel portafolioId={portafolio.id} />
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24">
          <section aria-labelledby="vista-previa">
            <h2 id="vista-previa" className="mb-3 font-display text-2xl font-medium text-estrella">
              Vista previa en Constelaciones
            </h2>
            <VistaPreviaFicha portafolio={portafolio} />
            <p className="mt-2 font-sans text-sm text-tenue">Se actualiza cuando guardas.</p>
          </section>

          <section aria-labelledby="lista-ficha" className="rounded-xl border border-trazo bg-noche-2 p-5">
            <h2 id="lista-ficha" className="font-display text-2xl font-medium text-estrella">
              Qué le falta a tu ficha
            </h2>
            <div className="mt-3">
              <BarraFicha porcentaje={ficha.porcentaje} />
            </div>
            <div className="mt-2">
              <ChecklistFicha pasos={ficha.pasos} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
