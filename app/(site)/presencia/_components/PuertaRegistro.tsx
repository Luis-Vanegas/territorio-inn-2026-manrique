import Link from 'next/link';

import { EnlaceVolver } from '@/components/EnlaceVolver';
import { EtiquetaPagina } from '@/components/EtiquetaPagina';

/**
 * Lo que ve quien llega sin sesión: de qué trata, nunca el contenido.
 *
 * Misma decisión que la vista previa de /formalizacion: pedir la cuenta antes
 * de decir qué gana con ella espanta a quien llega por primera vez. Las guías
 * se nombran; su contenido no viaja al navegador porque el `return` de la
 * página corta antes de renderizarlo.
 */
export function PuertaRegistro({
  titulo,
  bajada,
  guias,
  volver,
}: {
  titulo: string;
  bajada: string;
  /** Títulos de las guías, para que se vea qué hay adentro. */
  guias?: string[];
  volver: { href: string; etiqueta: string };
}) {
  return (
    <main className="seccion">
      <div className="mx-auto max-w-2xl">
        <header>
          <EtiquetaPagina>solo para registrados</EtiquetaPagina>

          <h1 className="mt-4 font-display text-5xl font-medium leading-[0.95] text-tinta sm:text-6xl">
            {titulo}
          </h1>

          <p className="mt-6 font-sans text-lg leading-relaxed text-tinta/70">{bajada}</p>
        </header>

        {guias && (
          <section className="mt-12 border-t border-tinta/12 pt-10">
            <h2 className="font-mono text-sm uppercase tracking-wider text-tinta/70">
              Lo que encuentras adentro
            </h2>
            <ul className="mt-6 space-y-2 font-sans text-lg text-tinta">
              {guias.map((guia) => (
                <li key={guia}>· {guia}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12 border-t border-tinta/12 pt-10">
          <p className="font-sans leading-relaxed text-tinta/70">
            Es un regalo del equipo de Constelaciones para los negocios de la
            Comuna 3. Solo pedimos que registres el tuyo, porque así podemos
            darte visibilidad en el directorio.
          </p>

          <Link
            href="/entrar"
            className="mt-8 inline-block border border-terracota-texto bg-terracota-texto px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-terracota-texto"
          >
            Entrar o registrarme →
          </Link>
        </section>

        <EnlaceVolver href={volver.href} className="mt-20">
          {volver.etiqueta}
        </EnlaceVolver>
      </div>
    </main>
  );
}
