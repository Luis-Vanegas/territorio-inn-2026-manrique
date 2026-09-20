import type { Metadata } from 'next';

import { ContenidoFormalizacion } from '@/components/formalizacion/ContenidoFormalizacion';
import { EtiquetaPagina } from '@/components/EtiquetaPagina';

export const metadata: Metadata = { title: 'Formalización · Moderación' };

// La sesión de moderación la exige el layout del panel: acá no hay nada que
// autorizar porque la página solo lee el catálogo, sin acciones.
export default function AdminFormalizacionPage() {
  return (
    <main className="seccion">
      <header className="max-w-3xl">
        <EtiquetaPagina>vista de moderación · lo que ve un negocio</EtiquetaPagina>

        <h1 className="mt-4 font-display text-5xl font-medium leading-[0.95] text-tinta sm:text-7xl">
          Formalización
        </h1>

        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
          Este es el catálogo tal como lo ve un negocio registrado. Como
          moderador ves siempre la lista completa: el filtro por respuesta de
          cada negocio no aplica acá.
        </p>
      </header>

      <ContenidoFormalizacion formalidad={null} />
    </main>
  );
}
