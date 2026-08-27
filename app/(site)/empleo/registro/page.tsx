import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { FormularioCandidato } from './_components/FormularioCandidato';

// Mismo interruptor que la vitrina: apagado, la ruta no existe.
const EMPLEO_ACTIVO = process.env.NEXT_PUBLIC_MODULO_EMPLEO === 'true';

export const metadata: Metadata = EMPLEO_ACTIVO
  ? {
      title: 'Publicarme · Constelaciones',
      description: 'Si buscas trabajo en la Comuna 3 — Manrique, publica tu perfil.',
    }
  : { title: 'Constelaciones', robots: { index: false, follow: false } };

export const dynamic = 'force-dynamic';

export default function RegistroCandidatoPage() {
  if (!EMPLEO_ACTIVO) notFound();

  return (
    <main className="seccion">
      <header className="max-w-3xl">
        <span className="font-mono text-xs text-tinta/50">Empleo</span>

        <h1 className="mt-4 font-display text-4xl font-medium leading-[1] text-tinta sm:text-6xl">
          Publica que estás buscando trabajo
        </h1>

        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
          Contale a la comuna qué sabes hacer y qué tipo de trabajo buscas.
          Quien necesite a alguien como vos te contacta directo.
        </p>

        {/* Se dice arriba, no en la letra chica: qué queda público antes de
            empezar a llenar. */}
        <div className="mt-8 border-l-2 border-tinta/20 pl-4">
          <p className="font-mono text-xs uppercase tracking-wider text-tinta/65">
            Qué te pedimos
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-tinta/70">
            Tu nombre, tu teléfono, tu nivel de formación, qué sabes hacer y
            qué tipo de trabajo buscas. Nada más — sin dirección, sin correo,
            sin documento.
          </p>
        </div>

        <p className="mt-6 font-sans text-sm leading-relaxed text-tinta/60">
          Antes de publicarse, un moderador revisa cada registro.{' '}
          <Link href="/legal/empleo" className="text-terracota underline underline-offset-2">
            Términos y tratamiento de datos de este módulo
          </Link>
          .
        </p>
      </header>

      <div className="mt-16 max-w-2xl">
        <FormularioCandidato />
      </div>
    </main>
  );
}
