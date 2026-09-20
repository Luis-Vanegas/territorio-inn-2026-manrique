import Link from 'next/link';

import { EnlaceVolver } from '@/components/EnlaceVolver';
import { EtiquetaPagina } from '@/components/EtiquetaPagina';
import { GRUPOS, GUIAS, PRESENCIA_BAJADA } from '@/lib/presencia';
import { VisorLaminas } from './VisorLaminas';

/**
 * Índice de las guías de presencia.
 *
 * Compartido entre /presencia (el negocio registrado) y /admin/presencia (la
 * moderación). `base` es la ruta donde vive cada copia: los enlaces a cada
 * guía se arman a partir de ella, así que ninguna copia apunta a la otra.
 * Quien llama decide la puerta (sesión de vecino o de moderador); acá no se
 * autoriza nada.
 */
export function IndicePresencia({
  base,
  etiqueta,
  volver,
}: {
  base: string;
  etiqueta: string;
  volver: { href: string; etiqueta: string };
}) {
  return (
    <main className="seccion">
      <header className="max-w-3xl">
        <EtiquetaPagina>{etiqueta}</EtiquetaPagina>

        <h1 className="mt-4 font-display text-5xl font-medium leading-[0.95] text-tinta sm:text-7xl">
          Tu presencia
        </h1>

        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
          {PRESENCIA_BAJADA}
        </p>
      </header>

      {GRUPOS.map((grupo) => {
        const guias = GUIAS.filter((g) => g.grupo === grupo.id);

        return (
          <section
            key={grupo.id}
            aria-labelledby={`grupo-${grupo.id}`}
            className="mt-16 border-t border-tinta/12 pt-10"
          >
            <h2
              id={`grupo-${grupo.id}`}
              className="font-display text-2xl font-medium text-tinta sm:text-3xl"
            >
              {grupo.titulo}
            </h2>
            <p className="mt-2 max-w-xl font-sans text-tinta/70">{grupo.intro}</p>

            <ul role="list" className="mt-8 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {guias.map((guia) => (
                <li
                  key={guia.slug}
                  className="flex h-full flex-col border border-tinta/15 bg-white p-6"
                >
                  <h3 className="font-display text-xl font-medium text-tinta">{guia.titulo}</h3>
                  <p className="mt-3 font-sans leading-relaxed text-tinta/70">{guia.resumen}</p>

                  {/* Dos caminos a lo mismo, uno al lado del otro: leerla en la
                      página o ver la lámina tal como la diseñó el equipo. */}
                  <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-1 pt-6">
                    <Link
                      href={`${base}/${guia.slug}`}
                      className="inline-flex min-h-[44px] items-center font-mono text-sm text-terracota-texto underline decoration-terracota underline-offset-4"
                    >
                      Leer la guía →
                    </Link>
                    <VisorLaminas titulo={guia.titulo} laminas={guia.laminas} variante="enlace" />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <EnlaceVolver href={volver.href} className="mt-24">
        {volver.etiqueta}
      </EnlaceVolver>
    </main>
  );
}
