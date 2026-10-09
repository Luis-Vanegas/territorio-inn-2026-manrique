import type { Metadata } from 'next';
import { RetoSection } from '@/components/RetoSection';
import { EquipoSection } from '@/components/EquipoSection';

export const metadata: Metadata = {
  title: 'Nosotros · Constelaciones',
  description:
    'Qué es Constelaciones y el equipo que lo construye — Comuna 3, Manrique.',
};

// Estático: no consulta la base, a diferencia de la home. Reto y Equipo salieron
// de ahí para no ocupar la portada; el ancla #equipo sigue viva acá.
export default function NosotrosPage() {
  return (
    <main>
      {/* style y no `pb-0`: .seccion es CSS sin capa y le gana a la utilidad. */}
      <header className="seccion" style={{ paddingBottom: 0 }}>
        <span className="font-sans text-xs text-tinta/65">Nosotros</span>
        <h1 className="mt-4 font-display text-4xl font-medium leading-[1] text-tinta sm:text-6xl">
          Quiénes somos y por qué lo hacemos
        </h1>
      </header>
      <RetoSection />
      <EquipoSection />
    </main>
  );
}
