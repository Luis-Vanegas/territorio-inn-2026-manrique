import Image from 'next/image';
import Link from 'next/link';

import { EnlaceVolver } from '@/components/EnlaceVolver';
import { EtiquetaPagina } from '@/components/EtiquetaPagina';
import { IconoContacto } from '@/components/iconos/IconoContacto';
import { GRUPOS, GUIAS, MARCA_BAJADA } from '@/lib/marca';

/**
 * Índice de las guías de marca.
 *
 * Compartido entre /marca (el negocio registrado) y /admin/marca (la
 * moderación). `base` es la ruta donde vive cada copia: los enlaces a cada
 * guía se arman a partir de ella, así que ninguna copia apunta a la otra.
 * Quien llama decide la puerta (sesión de vecino o de moderador); acá no se
 * autoriza nada.
 */
export function IndiceMarca({
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
          Marca
        </h1>

        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
          {MARCA_BAJADA}
        </p>
      </header>

      {GRUPOS.map((grupo) => {
        const guias = GUIAS.filter((g) => g.grupo === grupo.id);

        return (
          <section
            key={grupo.id}
            aria-labelledby={`grupo-${grupo.id}`}
            className="mt-12 border-t border-tinta/12 pt-8"
          >
            <h2
              id={`grupo-${grupo.id}`}
              className="font-display text-2xl font-medium text-tinta sm:text-3xl"
            >
              {grupo.titulo}
            </h2>
            <p className="mt-2 max-w-xl font-sans text-tinta/70">{grupo.intro}</p>

            <ul role="list" className="mt-8 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {guias.map((guia) => {
                const portada = guia.laminas[0];

                return (
                  <li
                    key={guia.slug}
                    className="flex h-full flex-col border border-tinta/15 bg-hueso"
                  >
                    {/* Portada de la guía: la primera lámina, para que el
                        índice se vea (y no solo se lea) antes de entrar. */}
                    {portada && (
                      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-tinta/15 bg-tinta/[0.04]">
                        {/* object-contain: son infografías con texto, no fotos — recortarlas
                            (object-cover) se come el texto de los bordes. El fondo tinta/[0.04]
                            rellena el espacio que deja el "letterbox" de láminas más angostas
                            o más apaisadas que el marco 4:3. */}
                        <Image
                          src={portada.src}
                          alt={`Portada de la guía «${guia.titulo}»`}
                          fill
                          sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                          className="object-contain"
                        />
                        {guia.red && (
                          <span className="absolute right-3 top-3 grid h-10 w-10 place-items-center border border-tinta/15 bg-hueso">
                            <IconoContacto tipo={guia.red} className="h-6 w-6" />
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="font-display text-xl font-medium text-tinta">{guia.titulo}</h3>
                      <p className="mt-3 font-sans leading-relaxed text-tinta/70">{guia.resumen}</p>

                      {/* Un solo camino, a propósito.
                          Acá había dos enlaces —«Leer la guía» y «Ver la lámina
                          original»— y hacían dudar sin ofrecer nada distinto: la
                          guía ya abre con las láminas originales en miniatura
                          arriba de todo (ver components/marca/GuiaMarca.tsx), así
                          que el segundo enlace era una segunda puerta a la misma
                          habitación. Quien entra ve la original de una, y además
                          puede leerla. */}
                      <div className="mt-auto pt-6">
                        <Link
                          href={`${base}/${guia.slug}`}
                          className="inline-flex min-h-[44px] items-center font-sans text-sm text-azul-texto underline decoration-azul underline-offset-4"
                        >
                          Ver la guía →
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
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
