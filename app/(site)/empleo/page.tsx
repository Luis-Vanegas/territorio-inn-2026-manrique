import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { listarCandidatosAprobados } from '@/lib/db/candidatos.repo';
import { VitrinaCandidatos } from './_components/VitrinaCandidatos';

// Módulo tras interruptor, mismo patrón que Servicios: apagado, la ruta
// devuelve 404 real y ni siquiera aparece en el menú (ver lib/content.ts).
const EMPLEO_ACTIVO = process.env.NEXT_PUBLIC_MODULO_EMPLEO === 'true';

export const metadata: Metadata = EMPLEO_ACTIVO
  ? {
      title: 'Empleo · Constelaciones',
      description: 'Personas de la Comuna 3 — Manrique que buscan trabajo.',
    }
  : { title: 'Constelaciones', robots: { index: false, follow: false } };

// Un registro recién aprobado tiene que verse ya, no cuando expire un cache.
export const dynamic = 'force-dynamic';

export default async function EmpleoPage({
  searchParams,
}: {
  searchParams: Promise<{ registrado?: string }>;
}) {
  if (!EMPLEO_ACTIVO) notFound();

  const [candidatos, { registrado }] = await Promise.all([
    listarCandidatosAprobados(),
    searchParams,
  ]);

  return (
    <main className="seccion">
      <header className="max-w-3xl">
        <span className="font-mono text-xs text-tinta/50">Empleo</span>

        <h1 className="mt-4 font-display text-5xl font-medium leading-[0.95] text-tinta sm:text-7xl">
          Gente de Manrique buscando trabajo
        </h1>

        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
          Vecinos de la Comuna 3 que están buscando empleo, con lo que saben
          hacer y cómo contactarlos.
        </p>
      </header>

      {registrado && (
        <p className="mt-8 max-w-3xl border-l-2 border-terracota bg-terracota/[0.04] px-4 py-3 font-sans text-sm leading-relaxed text-tinta">
          ✓ Tu registro quedó guardado. Lo vamos a revisar y vas a aparecer en
          esta lista apenas lo aprobemos.
        </p>
      )}

      <section className="mt-12 max-w-3xl border-l-2 border-tinta/20 bg-tinta/[0.02] px-5 py-5">
        <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/70">
          Antes de contactar
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-tinta/75">
          Constelaciones es un <strong className="font-medium text-tinta">directorio</strong>.
          No emplea a estas personas, no interviene en la contratación ni en
          los pagos, y no certifica su experiencia — es lo que cada quien
          contó de sí mismo.
        </p>
      </section>

      <div className="mt-16">
        {candidatos.length === 0 ? (
          <p className="border-t border-tinta/12 py-12 font-sans text-base text-tinta/60">
            Todavía no hay nadie publicado. Los primeros registros están en revisión.
          </p>
        ) : (
          <VitrinaCandidatos candidatos={candidatos} />
        )}
      </div>

      <div className="mt-20 border-t border-tinta/12 pt-10">
        <p className="font-sans text-lg text-tinta">¿Estás buscando trabajo?</p>
        <Link
          href="/empleo/registro"
          className="mt-4 inline-block min-h-11 border border-terracota bg-terracota px-6 py-2.5 font-mono text-sm text-hueso transition-opacity hover:opacity-90"
        >
          Publicarme →
        </Link>
      </div>
    </main>
  );
}
