import type { Metadata } from 'next';
import Link from 'next/link';

import {
  listarAprobados,
  listarCategorias,
  contarAprobadosPorCategoria,
} from '@/lib/db/portafolios.repo';
import { enfoque } from '@/lib/content';
import { MapaPortafolios } from './_components/MapaPortafolios';
import { TarjetaEmprendimiento } from './_components/TarjetaEmprendimiento';
import { FiltroCategorias } from './_components/FiltroCategorias';

const modulo = enfoque.modulos.find((m) => m.slug === 'portafolios')!;

export const metadata: Metadata = {
  title: `${modulo.nombre} · Territorio INN 2026`,
  description:
    'Vitrina digital de los emprendimientos y oficios de la Comuna 3 — Manrique, Medellín.',
};

// Sin cache de ruta: la vitrina refleja lo que hay en la base ahora.
//
// Se intentó `revalidate = 300` y el resultado fue que un emprendimiento recién
// aprobado no aparecía hasta cinco minutos después. Son tres queries a un
// índice parcial sobre una tabla de escala barrial — cachear eso es optimizar
// lo que no duele y romper lo que sí importa.
export const dynamic = 'force-dynamic';

export default async function PortafoliosPage({
  searchParams,
}: {
  searchParams: { categoria?: string };
}) {
  const categoriaActiva = searchParams.categoria;

  // Las tres consultas son independientes: en serie sumarían tres viajes a la
  // base antes del primer byte.
  const [portafolios, categorias, conteos] = await Promise.all([
    listarAprobados(categoriaActiva),
    listarCategorias(),
    contarAprobadosPorCategoria(),
  ]);

  const total = Object.values(conteos).reduce((a, b) => a + b, 0);
  const nombreCategoria = categorias.find((c) => c.id === categoriaActiva)?.nombre;

  return (
    <main className="margen-editorial py-24 sm:py-32">
      <header className="max-w-3xl">
        <span className="font-mono text-xs text-tinta/50">{modulo.numero}</span>

        <h1 className="mt-4 font-display text-5xl font-medium leading-[0.95] text-tinta sm:text-7xl">
          {modulo.nombre}
        </h1>

        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
          Manrique produce, repara, cocina y enseña. Esta es la vitrina de quienes
          lo hacen — con nombre, dirección y forma de contacto.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href="/portafolios/registro"
            className="border border-terracota bg-terracota px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-terracota"
          >
            Poner mi negocio en el mapa →
          </Link>

          <span className="font-mono text-xs text-tinta/45">
            Gratis · menos de 3 minutos
          </span>
        </div>
      </header>

      {total === 0 ? (
        <section className="mt-20 border-t border-tinta/12 pt-10">
          <p className="max-w-md font-sans text-tinta/60">
            Todavía no hay emprendimientos publicados. Los registros pasan por
            revisión antes de aparecer acá.
          </p>
          <p className="mt-3 max-w-md font-sans text-tinta/60">
            Si tenés un negocio en la Comuna 3,{' '}
            <Link
              href="/portafolios/registro"
              className="underline decoration-terracota underline-offset-4 hover:text-terracota"
            >
              sé el primero en registrarte
            </Link>
            .
          </p>
        </section>
      ) : (
        <>
          <section className="mt-20" aria-label="Mapa de emprendimientos">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
                01 · Dónde están
              </h2>
              <span className="font-mono text-xs text-tinta/40">
                {portafolios.length}{' '}
                {portafolios.length === 1 ? 'emprendimiento' : 'emprendimientos'}
              </span>
            </div>

            <div className="mt-5 h-[420px] w-full border border-tinta/12 sm:h-[560px]">
              <MapaPortafolios portafolios={portafolios} />
            </div>
          </section>

          <section className="mt-20" aria-label="Listado de emprendimientos">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
                02 · Quiénes son
              </h2>
            </div>

            <div className="mt-5">
              <FiltroCategorias
                categorias={categorias}
                conteos={conteos}
                activa={categoriaActiva}
                total={total}
              />
            </div>

            {portafolios.length === 0 ? (
              <p className="mt-10 border-t border-tinta/12 pt-8 font-sans text-tinta/60">
                No hay emprendimientos en {nombreCategoria ?? 'esa categoría'} por ahora.{' '}
                <Link
                  href="/portafolios"
                  className="underline decoration-terracota underline-offset-4 hover:text-terracota"
                >
                  Ver todos
                </Link>
                .
              </p>
            ) : (
              <div className="mt-10">
                {portafolios.map((p, i) => (
                  <TarjetaEmprendimiento key={p.id} portafolio={p} indice={i} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Link
        href="/#enfoque"
        className="mt-24 inline-block font-mono text-sm text-tinta/50 underline decoration-terracota underline-offset-4 hover:text-terracota"
      >
        ← Volver a Territorio INN 2026
      </Link>
    </main>
  );
}
