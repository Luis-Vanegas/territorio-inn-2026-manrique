import type { Metadata } from 'next';
import Link from 'next/link';

import {
  listarAprobados,
  listarCategorias,
  contarAprobadosPorCategoria,
} from '@/lib/db/portafolios.repo';
import { listarTodosLosCampos } from '@/lib/db/camposPersonalizados.repo';
import { enfoque } from '@/lib/content';
import { MapaAliados } from '@/components/MapaAliados';
import { TarjetaEmprendimiento } from './_components/TarjetaEmprendimiento';
import { FiltroCategorias } from './_components/FiltroCategorias';

const modulo = enfoque.modulos.find((m) => m.slug === 'aliados')!;

export const metadata: Metadata = {
  title: `${modulo.nombre} · Territorio INN 2026`,
  description:
    'Aliados: el mapa de negocios y oficios de la Comuna 3 — Manrique, Medellín. Registro gratuito con revisión previa.',
};

// Sin cache de ruta: el mapa refleja lo que hay en la base ahora.
//
// Se intentó `revalidate = 300` y el resultado fue que un negocio recién
// aprobado no aparecía hasta cinco minutos después. Son tres queries a un
// índice parcial sobre una tabla de escala barrial — cachear eso es optimizar
// lo que no duele y romper lo que sí importa.
export const dynamic = 'force-dynamic';

export default async function AliadosPage({
  searchParams,
}: {
  searchParams: { categoria?: string };
}) {
  const categoriaActiva = searchParams.categoria;

  // Las tres consultas son independientes: en serie sumarían tres viajes a la
  // base antes del primer byte.
  const [aliados, categorias, conteos, definicionesCampos] = await Promise.all([
    listarAprobados(categoriaActiva),
    listarCategorias(),
    contarAprobadosPorCategoria(),
    listarTodosLosCampos(),
  ]);

  const total = Object.values(conteos).reduce((a, b) => a + b, 0);
  const nombreCategoria = categorias.find((c) => c.id === categoriaActiva)?.nombre;

  return (
    <main className="margen-editorial py-16 sm:py-24">
      <header className="max-w-3xl">
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-terracota">
          <span className="h-1.5 w-1.5 rounded-full bg-terracota" aria-hidden="true" />
          {modulo.numero} · en vivo
        </span>

        <h1 className="mt-4 font-display text-5xl font-medium leading-[0.95] text-tinta sm:text-7xl">
          {modulo.nombre}
        </h1>

        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
          Manrique produce, repara, cocina y enseña. Este es el mapa de quienes
          lo hacen — con nombre, dirección exacta y forma de contacto directo.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href="/aliados/registro"
            className="border border-terracota bg-terracota px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-terracota"
          >
            Poner mi negocio en el mapa →
          </Link>

          <span className="font-mono text-xs text-tinta/45">
            Gratis · menos de 3 minutos · lo revisamos antes de publicarlo
          </span>
        </div>
      </header>

      {total === 0 ? (
        <section className="mt-16 border-t border-tinta/12 pt-10">
          <p className="max-w-md font-sans text-tinta/60">
            Todavía no hay negocios publicados. Los registros pasan por
            revisión antes de aparecer en el mapa.
          </p>
          <p className="mt-3 max-w-md font-sans text-tinta/60">
            Si tenés un negocio en la Comuna 3,{' '}
            <Link
              href="/aliados/registro"
              className="underline decoration-terracota underline-offset-4 hover:text-terracota"
            >
              sé el primero en aparecer
            </Link>
            .
          </p>
        </section>
      ) : (
        <>
          {/* El mapa es lo primero y lo más grande de la página: es el elemento
              que hace tangible "esto existe de verdad", más que cualquier texto. */}
          <section className="mt-14" aria-label="Mapa de negocios aliados">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
                Dónde están
              </h2>
              <span className="font-mono text-xs text-tinta/40">
                {aliados.length} {aliados.length === 1 ? 'negocio' : 'negocios'} en el mapa
              </span>
            </div>

            <div className="mt-4 h-[460px] w-full overflow-hidden border border-tinta/12 sm:h-[600px] lg:h-[680px]">
              <MapaAliados portafolios={aliados} />
            </div>

            <p className="mt-3 font-mono text-xs text-tinta/40">
              Tocá un punto terracota para ver el negocio.
            </p>
          </section>

          <section className="mt-20" aria-label="Listado de negocios aliados">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
                Quiénes son
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

            {aliados.length === 0 ? (
              <p className="mt-10 border-t border-tinta/12 pt-8 font-sans text-tinta/60">
                No hay negocios en {nombreCategoria ?? 'esa categoría'} por ahora.{' '}
                <Link
                  href="/aliados"
                  className="underline decoration-terracota underline-offset-4 hover:text-terracota"
                >
                  Ver todos
                </Link>
                .
              </p>
            ) : (
              <div className="mt-10">
                {aliados.map((p, i) => (
                  <TarjetaEmprendimiento
                    key={p.id}
                    portafolio={p}
                    indice={i}
                    definicionesCampos={definicionesCampos}
                  />
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
