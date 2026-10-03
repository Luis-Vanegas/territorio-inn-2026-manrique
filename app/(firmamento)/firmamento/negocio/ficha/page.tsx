import type { Metadata } from 'next';

import { FormularioEdicionPortafolio } from '@/components/FormularioEdicionPortafolio';
import { Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { actualizarFichaDeCuenta } from '@/lib/actions/gestionarEstado';
import { exigirNegocio } from '@/lib/auth/firmamento';
import { listarBitacora, type FilaBitacora } from '@/lib/db/bitacora.repo';
import { listarCategorias, obtenerPropio } from '@/lib/db/portafolios.repo';
import { completitudFicha } from '@/lib/firmamento/ficha';
import { negocioActivo } from '@/lib/firmamento/negocio';
import { BorrarFichaPanel } from '../_components/BorrarFichaPanel';
import { CambiosFicha } from '../_components/CambiosFicha';
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

  // La bitácora de ESTA ficha: `portafolio.id` ya pasó por `obtenerPropio` (filtra por la cuenta de la sesión).
  // Es un extra: si falla, la ficha se puede editar igual.
  const cambios: FilaBitacora[] = await listarBitacora({ portafolioId: portafolio.id })
    .then((r) => r.filas)
    .catch((e) => {
      console.error('[panel negocio] cambios de la ficha falló', e instanceof Error ? e.message : e);
      return [];
    });

  const ficha = completitudFicha(portafolio);

  return (
    <div className="mx-auto max-w-6xl">
      <SelectorNegocio negocios={negocios} actual={actual} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <EstadoFicha estado={portafolio.estado} motivo={portafolio.motivo_rechazo} conAprobada />

          <Tarjeta titulo="Datos de tu ficha" id="datos-ficha">
            <p className="-mt-2 font-sans text-sm text-tinta/70">
              Así los ven tus vecinos en Constelaciones. Corrige lo que haga falta y guarda al final.
            </p>
            {/* `key`: al cambiar de negocio el formulario arranca de cero; sus valores iniciales son los del negocio elegido. */}
            <FormularioEdicionPortafolio
              key={portafolio.id}
              // El correo de quien moderó no viaja al navegador del dueño.
              portafolio={{ ...portafolio, moderado_por: null }}
              categorias={categorias}
              accion={actualizarFichaDeCuenta.bind(null, portafolio.id)}
              variante="panel"
            />
          </Tarjeta>


          <BorrarFichaPanel portafolioId={portafolio.id} />
        </div>

        <aside className="flex min-w-0 flex-col gap-5">
          <Tarjeta titulo="Vista previa" id="vista-previa" plegable abierta resumen="en Constelaciones">
            <VistaPreviaFicha portafolio={portafolio} />
            <p className="mt-2 font-sans text-sm text-tinta/70">Se actualiza cuando guardas.</p>
          </Tarjeta>

          <Tarjeta
            titulo="Cambios en tu ficha"
            id="cambios-ficha"
            plegable
            resumen={cambios.length > 0 ? `${cambios.length} anotados` : 'ninguno todavía'}
          >
            <CambiosFicha filas={cambios} />
          </Tarjeta>

          <Tarjeta titulo="Qué le falta a tu ficha" id="lista-ficha" plegable abierta resumen={`${ficha.porcentaje} %`}>
            <BarraFicha porcentaje={ficha.porcentaje} />
            <div className="mt-2">
              <ChecklistFicha pasos={ficha.pasos} />
            </div>
          </Tarjeta>
        </aside>
      </div>
    </div>
  );
}
