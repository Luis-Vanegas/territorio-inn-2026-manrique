import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { listarCategorias } from '@/lib/db/portafolios.repo';
import { FormularioServicio } from './_components/FormularioServicio';

// Mismo interruptor que la vitrina: apagado, la ruta no existe.
const SERVICIOS_ACTIVO = process.env.NEXT_PUBLIC_MODULO_SERVICIOS === 'true';

export const metadata: Metadata = SERVICIOS_ACTIVO
  ? {
      title: 'Ofrecer mi servicio · Constelaciones',
      description:
        'Si prestás un servicio a domicilio en la Comuna 3 — Manrique, publicá tu oficio.',
    }
  : { title: 'Constelaciones', robots: { index: false, follow: false } };

export const dynamic = 'force-dynamic';

export default async function RegistroServicioPage() {
  if (!SERVICIOS_ACTIVO) notFound();

  // Misma taxonomía de oficios que los negocios: es lo que después permite
  // que una sola búsqueda devuelva las dos cosas.
  const categorias = await listarCategorias();

  return (
    <main className="seccion">
      <header className="max-w-3xl">
        <span className="font-mono text-xs text-tinta/50">Servicios</span>

        <h1 className="mt-4 font-display text-4xl font-medium leading-[1] text-tinta sm:text-6xl">
          Ofrecé tu servicio
        </h1>

        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
          Si arreglás electrodomésticos, hacés limpieza, instalaciones o
          cualquier oficio yendo hasta donde está el cliente, este formulario
          te publica para que la gente de la comuna te encuentre.
        </p>

        {/* Se dice arriba, no en la letra chica: la persona tiene que saber
            exactamente qué queda público ANTES de empezar a llenar. */}
        <div className="mt-8 border-l-2 border-tinta/20 pl-4">
          <p className="font-mono text-xs uppercase tracking-wider text-tinta/65">
            Qué queda público
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-tinta/70">
            Tu primer nombre y tu primer apellido, tu oficio, qué hacés, tus
            años de experiencia, los barrios donde atendés y tu teléfono.
          </p>
          <p className="mt-3 font-mono text-xs uppercase tracking-wider text-tinta/65">
            Qué no
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-tinta/70">
            Tu nombre completo y tu foto — te los pedimos siempre, pero no se
            publican en ningún lado: sirven solo para poder identificarte si
            llega a haber un problema. Tu dirección{' '}
            <strong className="font-medium text-tinta">no te la pedimos</strong>.
            Tampoco tu documento. El correo y las respuestas del último paso son
            solo para el equipo del proyecto y no se publican nunca.
          </p>
        </div>

        <p className="mt-6 font-sans text-sm leading-relaxed text-tinta/60">
          Antes de publicarse, un moderador revisa cada registro.{' '}
          <Link href="/legal/servicios" className="text-terracota underline underline-offset-2">
            Términos y tratamiento de datos de este módulo
          </Link>
          .
        </p>
      </header>

      <div className="mt-16 max-w-2xl">
        <FormularioServicio categorias={categorias} />
      </div>
    </main>
  );
}
