import type { Metadata } from 'next';

import { ContenidoFormalizacion } from '@/components/formalizacion/ContenidoFormalizacion';
import { exigirEquipo } from '@/lib/auth/firmamento';

export const metadata: Metadata = { title: 'Formalización' };

// Solo lee el catálogo, sin acciones; la guarda va igual en cada página del panel.
export default async function EquipoFormalizacionPage() {
  await exigirEquipo();

  return (
    <div>
      <header className="max-w-3xl">
        <p className="max-w-xl font-sans text-base leading-relaxed text-tinta/70">
          Este es el catálogo tal como lo ve un negocio registrado. Como
          moderador ves siempre la lista completa: el filtro por respuesta de
          cada negocio no aplica acá.
        </p>
      </header>

      <ContenidoFormalizacion formalidad={null} />
    </div>
  );
}
