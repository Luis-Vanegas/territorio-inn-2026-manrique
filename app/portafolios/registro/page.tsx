import type { Metadata } from 'next';
import Link from 'next/link';

import { listarCategorias } from '@/lib/db/portafolios.repo';
import { FormularioRegistro } from './_components/FormularioRegistro';

export const metadata: Metadata = {
  title: 'Registrar emprendimiento · Territorio INN 2026',
  description:
    'Sumá tu negocio de la Comuna 3 — Manrique a la vitrina digital del territorio.',
};

// Las categorías salen de la base y casi nunca cambian, pero la página no debe
// quedar cacheada estáticamente: sirve un formulario con server action.
export const dynamic = 'force-dynamic';

export default async function RegistroPage() {
  const categorias = await listarCategorias();

  return (
    <main className="margen-editorial py-24 sm:py-32">
      <header className="max-w-3xl">
        <span className="font-mono text-xs text-tinta/50">03 · Portafolios</span>

        <h1 className="mt-4 font-display text-4xl font-medium leading-[1] text-tinta sm:text-6xl">
          Poné tu negocio en el mapa
        </h1>

        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
          Si tenés un negocio, un taller o prestás un servicio en la Comuna 3,
          este formulario lo suma a la vitrina pública del territorio.
        </p>

        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs text-tinta/55">
          <li>
            <span className="text-terracota">·</span> Toma menos de 3 minutos
          </li>
          <li>
            <span className="text-terracota">·</span> Es gratis
          </li>
          <li>
            <span className="text-terracota">·</span> Lo revisamos antes de publicarlo
          </li>
        </ul>
      </header>

      <FormularioRegistro categorias={categorias} />

      <Link
        href="/portafolios"
        className="mt-20 inline-block font-mono text-sm text-tinta/50 underline decoration-terracota underline-offset-4 hover:text-terracota"
      >
        ← Volver a la vitrina
      </Link>
    </main>
  );
}
