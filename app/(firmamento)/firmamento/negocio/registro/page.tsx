import type { Metadata } from 'next';

import { FormularioRegistro } from '@/components/registro/FormularioRegistro';
import { VistaPreviaEnVivo } from '@/components/registro/VistaPreviaEnVivo';
import { registrarPortafolio } from '@/lib/actions/registrarPortafolio';
import { exigirNegocio } from '@/lib/auth/firmamento';
import { listarCamposActivos } from '@/lib/db/camposPersonalizados.repo';
import { listarCategorias } from '@/lib/db/portafolios.repo';

export const metadata: Metadata = {
  title: 'Registrar un negocio',
  description: 'Suma tu negocio de la Comuna 3 — Manrique al mapa de Aliados de Constelaciones.',
};

// Lee la sesión en cada carga y sirve un formulario con server action.
export const dynamic = 'force-dynamic';

/**
 * El registro vive en Firmamento, con la sesión de Google: el negocio nace en
 * la cuenta de quien lo registra (`registrarPortafolio` toma el `usuario_id` de
 * la sesión). `/aliados/registro` redirige aquí (next.config.mjs) y, sin sesión,
 * la guarda manda a la puerta con `destino` para volver a este formulario.
 */
export default async function RegistroNegocioPage() {
  await exigirNegocio('/firmamento/negocio/registro');
  const [categorias, camposPersonalizados] = await Promise.all([listarCategorias(), listarCamposActivos()]);

  return (
    <div className="mx-auto max-w-6xl">
      <p className="max-w-2xl font-sans text-base leading-relaxed text-tinta/70">
        Llena los datos de tu negocio. Lo revisamos antes de publicarlo en el mapa de Constelaciones: toma
        menos de 3 minutos y es gratis.
      </p>
      <div className="mt-8">
        <VistaPreviaEnVivo
          categorias={categorias}
          definicionesCampos={camposPersonalizados}
          nota="Esta es tu tarjeta en el mapa de Aliados. Cambia mientras escribes; se publica cuando el equipo la apruebe."
        >
          <FormularioRegistro
            categorias={categorias}
            camposPersonalizados={camposPersonalizados}
            accion={registrarPortafolio}
            modo="propio"
          />
        </VistaPreviaEnVivo>
      </div>
    </div>
  );
}
