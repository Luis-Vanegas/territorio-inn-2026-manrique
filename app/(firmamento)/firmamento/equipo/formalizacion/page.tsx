import type { Metadata } from 'next';

import { ContenidoFormalizacion } from '@/components/formalizacion/ContenidoFormalizacion';
import { exigirEquipo } from '@/lib/auth/firmamento';

export const metadata: Metadata = { title: 'Formalización' };

// Solo lee el catálogo, sin acciones; la guarda va igual en cada página del panel.
export default async function EquipoFormalizacionPage() {
  await exigirEquipo();

  return (
    <div>
      <ContenidoFormalizacion formalidad={null} />
    </div>
  );
}
