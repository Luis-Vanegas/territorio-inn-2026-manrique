import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { listarServiciosAprobados } from '@/lib/db/servicios.repo';
import { VitrinaServicios } from './_components/VitrinaServicios';

// Módulo tras interruptor: apagado, la ruta devuelve 404 real y ni siquiera
// aparece en el menú (ver lib/content.ts). Se prende primero en preproducción.
const SERVICIOS_ACTIVO = process.env.NEXT_PUBLIC_MODULO_SERVICIOS === 'true';

export const metadata: Metadata = SERVICIOS_ACTIVO
  ? {
      title: 'Servicios · Constelaciones',
      description:
        'Personas de la Comuna 3 — Manrique que prestan su oficio a domicilio: técnicos, limpieza, instalaciones y más.',
    }
  : { title: 'Constelaciones', robots: { index: false, follow: false } };

// Misma razón que /aliados: un servicio recién aprobado tiene que verse ya,
// no cuando expire un cache.
export const dynamic = 'force-dynamic';

export default async function ServiciosPage() {
  if (!SERVICIOS_ACTIVO) notFound();

  const servicios = await listarServiciosAprobados();

  return (
    <main className="seccion">
      <header className="max-w-3xl">
        <span className="font-mono text-xs text-tinta/50">Servicios</span>

        <h1 className="mt-4 font-display text-5xl font-medium leading-[0.95] text-tinta sm:text-7xl">
          Quién viene a tu casa
        </h1>

        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
          Personas de Manrique que prestan su oficio yendo hasta donde está el
          cliente. A diferencia de{' '}
          <Link href="/aliados" className="text-terracota underline underline-offset-2">
            Aliados
          </Link>
          , acá no hay un local al que ir: son personas que se desplazan.
        </p>
      </header>

      {/* Los descargos van arriba y visibles, no en la letra chica. Publicar
          personas que entran a casas ajenas obliga a decir con claridad qué
          significa —y qué no significa— aparecer en esta lista. */}
      <section className="mt-12 max-w-3xl border-l-2 border-terracota bg-terracota/[0.04] px-5 py-5">
        <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/70">
          Antes de contratar
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-tinta/75">
          Constelaciones es un <strong className="font-medium text-tinta">directorio</strong>.
          No emplea ni contrata a estas personas, no interviene en los pagos, no
          certifica su competencia técnica y no responde por los servicios
          acordados. Cuando una ficha dice «aceptó el compromiso» significa que
          esa persona entregó sus datos a conciencia y se comprometió por
          escrito a unas reglas de conducta — no es una verificación de
          identidad ni de antecedentes, ni una garantía sobre su trabajo.
        </p>
        <ul className="mt-4 flex list-disc flex-col gap-1.5 pl-4 font-sans text-sm leading-relaxed text-tinta/75">
          <li>Pedí el documento cuando llegue.</li>
          <li>Acordá el precio y el alcance antes de que empiece.</li>
          <li>Evitá dejar a alguien solo en tu casa.</li>
        </ul>
        <p className="mt-4 font-sans text-sm text-tinta/70">
          ¿Un problema con alguien de esta lista?{' '}
          <Link href="/contacto" className="text-terracota underline underline-offset-2">
            Reportalo acá
          </Link>{' '}
          — el perfil se suspende mientras se revisa.
        </p>
      </section>

      <div className="mt-16">
        {servicios.length === 0 ? (
          <p className="border-t border-tinta/12 py-12 font-sans text-base text-tinta/60">
            Todavía no hay servicios publicados. Los primeros registros están en
            revisión.
          </p>
        ) : (
          <VitrinaServicios servicios={servicios} />
        )}
      </div>

      <div className="mt-20 border-t border-tinta/12 pt-10">
        <p className="font-sans text-lg text-tinta">¿Prestás un servicio a domicilio?</p>
        <Link
          href="/servicios/registro"
          className="mt-4 inline-block min-h-11 border border-terracota bg-terracota px-6 py-2.5 font-mono text-sm text-hueso transition-opacity hover:opacity-90"
        >
          Publicar mi oficio →
        </Link>
      </div>
    </main>
  );
}
