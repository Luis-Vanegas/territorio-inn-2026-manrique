import type { Metadata } from 'next';

import { FormularioRegistro } from '@/components/registro/FormularioRegistro';
import { VistaPreviaEnVivo } from '@/components/registro/VistaPreviaEnVivo';
import { registrarAsistido } from '@/lib/actions/registrarAsistido';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { listarCamposActivos } from '@/lib/db/camposPersonalizados.repo';
import { listarCategorias } from '@/lib/db/portafolios.repo';

export const metadata: Metadata = { title: 'Agregar negocio' };

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
  );
}
