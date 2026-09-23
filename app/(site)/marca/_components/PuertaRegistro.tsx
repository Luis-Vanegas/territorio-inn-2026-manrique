import Image from 'next/image';
import Link from 'next/link';

import { EnlaceVolver } from '@/components/EnlaceVolver';
import { EtiquetaPagina } from '@/components/EtiquetaPagina';
import { IconoContacto } from '@/components/iconos/IconoContacto';
import type { Lamina, RedSocial } from '@/lib/marca';

/** Lo mínimo de una guía para mostrar su portada — no el objeto `Guia`
 *  completo, que trae secciones que acá nunca se renderizan. */
export type VistaPreviaGuia = { titulo: string; portada?: Lamina; red?: RedSocial };

/**
 * Lo que ve quien llega sin sesión: de qué trata, nunca el contenido.
 *
 * Misma decisión que la vista previa de /formalizacion: pedir la cuenta antes
 * de decir qué gana con ella espanta a quien llega por primera vez. Las
 * guías se muestran como portadas (primera lámina de cada una) para que la
 * primera impresión sea visual, no una lista de texto — pero sin link: son
 * solo una vista previa, el contenido real queda del otro lado del registro.
 */
export function PuertaRegistro({
  titulo,
  bajada,
  guias,
  volver,
}: {
  titulo: string;
  bajada: string;
  /** Portada + título de cada guía, para que se vea qué hay adentro. */
  guias?: VistaPreviaGuia[];
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
          <section className="mt-10 border-t border-tinta/12 pt-8">
            <h2 className="font-mono text-sm uppercase tracking-wider text-tinta/70">
              Lo que encuentras adentro
            </h2>
            <ul
              role="list"
              className="mt-6 grid list-none grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6"
            >
              {guias.map((guia) => (
                <li key={guia.titulo} className="flex flex-col border border-tinta/15 bg-hueso">
                  {guia.portada && (
                    <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-tinta/15 bg-tinta/[0.04]">
                      {/* object-contain: son infografías con texto — recortarlas
                          se come lo que las hace reconocibles de un vistazo. */}
                      <Image
                        src={guia.portada.src}
                        alt=""
                        fill
                        sizes="(min-width: 1280px) 16vw, (min-width: 640px) 30vw, 45vw"
                        className="object-contain"
                      />
                      {guia.red && (
                        <span className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center border border-tinta/15 bg-hueso">
                          <IconoContacto tipo={guia.red} className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  )}
                  <p className="p-2.5 font-sans text-sm leading-snug text-tinta">{guia.titulo}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 border-t border-tinta/12 pt-8">
          <p className="font-sans leading-relaxed text-tinta/70">
            Es un regalo del equipo de Constelaciones para los negocios de la
            Comuna 3. Solo pedimos que registres el tuyo, porque así podemos
            darte visibilidad en el directorio.
          </p>

          <Link
            href="/entrar"
            className="mt-8 inline-block border border-azul-texto bg-azul-texto px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-azul-texto"
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
