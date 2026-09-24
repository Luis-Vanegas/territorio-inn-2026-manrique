import Link from 'next/link';

import { EnlaceVolver } from '@/components/EnlaceVolver';
import { EtiquetaPagina } from '@/components/EtiquetaPagina';
import { IconoContacto } from '@/components/iconos/IconoContacto';
import { vecinas, type Guia } from '@/lib/marca';
import { Secciones } from './Secciones';
import { VisorLaminas } from './VisorLaminas';

/**
 * Una guía completa. Compartida entre /marca/[guia] y
 * /admin/marca/[guia]; ver IndiceMarca para el porqué de `base`.
 */
export function GuiaMarca({
  guia,
  base,
  etiqueta,
}: {
  guia: Guia;
  base: string;
  etiqueta: string;
}) {
  const { anterior, siguiente } = vecinas(guia.slug);

  return (
    <main className="seccion">
      <EnlaceVolver href={base}>← Marca</EnlaceVolver>

      <header className="mt-10 max-w-3xl">
        <div className="flex items-center gap-3">
          <EtiquetaPagina>{etiqueta}</EtiquetaPagina>
          {guia.red && <IconoContacto tipo={guia.red} className="h-7 w-7 shrink-0" />}
        </div>

        <h1 className="mt-4 font-display text-4xl font-medium leading-[1] text-tinta sm:text-6xl">
          {guia.titulo}
        </h1>

        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
          {guia.bajada}
        </p>

        {/* Las láminas originales, visibles de entrada: tocar cualquiera abre
            el visor en esa lámina. Quien prefiere ver la imagen del equipo en
            vez de la página no tiene que buscarla detrás de un botón. */}
        <div className="mt-8">
          <VisorLaminas titulo={guia.titulo} laminas={guia.laminas} variante="miniaturas" />
        </div>

        {/* Índice de la guía: en pantallas chicas evita bajar a ciegas hasta
            la sección que interesa. */}
        <nav aria-label="En esta guía" className="mt-6">
          <ol
            role="list"
            className="flex list-none flex-wrap gap-x-6 font-sans text-sm text-tinta/70"
          >
            {guia.secciones.map((seccion, i) => (
              <li key={seccion.kicker}>
                <a
                  href={`#seccion-${i}`}
                  className="inline-flex min-h-[44px] items-center underline decoration-azul underline-offset-4 hover:text-azul-texto"
                >
                  {seccion.kicker}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <Secciones secciones={guia.secciones} />

      <nav
        aria-label="Otras guías"
        className="mt-8 flex flex-col gap-6 border-t border-tinta/12 pt-10 sm:flex-row sm:justify-between"
      >
        {anterior ? (
          <Link href={`${base}/${anterior.slug}`} className="max-w-xs">
            <span className="font-sans text-sm uppercase tracking-wider text-tinta/70">
              ← Guía anterior
            </span>
            <span className="mt-2 block font-display text-xl text-tinta hover:text-azul-texto">
              {anterior.titulo}
            </span>
          </Link>
        ) : (
          <span />
        )}

        {siguiente && (
          <Link href={`${base}/${siguiente.slug}`} className="max-w-xs sm:text-right">
            <span className="font-sans text-sm uppercase tracking-wider text-tinta/70">
              Siguiente guía →
            </span>
            <span className="mt-2 block font-display text-xl text-tinta hover:text-azul-texto">
              {siguiente.titulo}
            </span>
          </Link>
        )}
      </nav>
    </main>
  );
}
