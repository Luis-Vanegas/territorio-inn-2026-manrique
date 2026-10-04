import type { Metadata } from 'next';

import { FormularioRegistro } from '@/components/registro/FormularioRegistro';
import { VistaPreviaEnVivo } from '@/components/registro/VistaPreviaEnVivo';
import { registrarAsistido } from '@/lib/actions/registrarAsistido';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { listarCamposActivos } from '@/lib/db/camposPersonalizados.repo';
import { listarCategorias } from '@/lib/db/portafolios.repo';

export const metadata: Metadata = { title: 'Registrar en campo' };

export const dynamic = 'force-dynamic';

/**
 * Registro asistido: para quien no tiene Google, el equipo llena el MISMO
 * formulario con la persona presente. Queda `asistido`, sin cuenta y en
 * revisión; al terminar se le manda su enlace personal por WhatsApp.
 */
export default async function RegistroEnCampoPage() {
  await exigirEquipo();
  const [categorias, camposPersonalizados] = await Promise.all([listarCategorias(), listarCamposActivos()]);

  return (
    <div className="mx-auto max-w-6xl">
      <p className="max-w-2xl font-sans text-base leading-relaxed text-tinta/70">
        Para quien no tiene cuenta de Google. Llena los datos con la persona presente y, al final, indica
        cómo autorizó el tratamiento de sus datos. Queda en revisión y le envías su enlace personal.
      </p>
      <div className="mt-8">
        <VistaPreviaEnVivo
          categorias={categorias}
          definicionesCampos={camposPersonalizados}
          nota="Muéstrale a la persona cómo se verá su tarjeta en el mapa de Aliados cuando la aprueben."
        >
          <FormularioRegistro
            categorias={categorias}
            camposPersonalizados={camposPersonalizados}
            accion={registrarAsistido}
            modo="asistido"
          />
        </VistaPreviaEnVivo>
      </div>
    </div>
  );
}
