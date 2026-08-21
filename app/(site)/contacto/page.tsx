import type { Metadata } from 'next';
import { FormularioContacto } from './_components/FormularioContacto';

export const metadata: Metadata = {
  title: 'Contacto · Constelaciones',
  description: 'Escribile al equipo de Constelaciones — Comuna 3, Manrique.',
};

export default function ContactoPage() {
  return (
    <main className="seccion">
      <header className="max-w-2xl">
        <span className="font-mono text-xs text-tinta/50">Contacto</span>
        <h1 className="mt-4 font-display text-4xl font-medium leading-[1] text-tinta sm:text-6xl">
          Escribinos
        </h1>
        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
          ¿Tenés un caso puntual, una corrección o una petición para el equipo?
          Dejanos el mensaje acá.
        </p>
      </header>

      <FormularioContacto />
    </main>
  );
}
