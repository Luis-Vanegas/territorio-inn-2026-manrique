import type { Metadata } from 'next';
import Link from 'next/link';

import {
  listarAprobados,
  listarCategorias,
  contarAprobadosPorCategoria,
} from '@/lib/db/portafolios.repo';
import { listarTodosLosCampos } from '@/lib/db/camposPersonalizados.repo';
import { enfoque } from '@/lib/content';
import type { DatosConstelaciones } from '@/lib/geo/constelaciones';
import { aplanarComercios, contarPorCategoria, unirCategorias } from '@/lib/geo/comerciosOsm';
// Import estático: solo viaja en el bundle del SERVIDOR (para los conteos del
// filtro). El navegador lo sigue pidiendo por fetch, ver lib/geo/constelaciones.ts.
import datosOsmJson from '@/public/firmamento/constelaciones.json';
import { VitrinaAliados } from './_components/VitrinaAliados';
import { FiltroCategorias } from './_components/FiltroCategorias';

const conteosOsm = contarPorCategoria(
  aplanarComercios(datosOsmJson as unknown as DatosConstelaciones),
);

const modulo = enfoque.modulos.find((m) => m.slug === 'aliados')!;

export const metadata: Metadata = {
  title: `${modulo.nombre} · Constelaciones`,
  description:
    'Aliados: el mapa de negocios y oficios de la Comuna 3 — Manrique, Medellín. Registro gratuito con revisión previa.',
};

// Sin cache de ruta: se renderiza por request. Las lecturas sí van cacheadas
// con etiqueta (lib/db/cache.ts) y se invalidan al moderar, así que un negocio
// recién aprobado se ve ya. Lo que NO funcionó fue `revalidate = 300` a nivel
// de ruta: sin invalidación por etiqueta, el negocio tardaba cinco minutos.
export const dynamic = 'force-dynamic';

export default async function AliadosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}) {
  const { categoria: categoriaActiva, q } = await searchParams;

  // Las tres consultas son independientes: en serie sumarían tres viajes a la
  // base antes del primer byte.
  const [aliados, categorias, conteos, definicionesCampos] = await Promise.all([
    listarAprobados(categoriaActiva),
    listarCategorias(),
    contarAprobadosPorCategoria(),
    listarTodosLosCampos(),
  ]);

  // El filtro ofrece todo lo que hay en el mapa: aliados y comercios de OSM.
  const oferta = unirCategorias(categorias, conteos, conteosOsm);
  const nombreCategoria = oferta.categorias.find((c) => c.id === categoriaActiva)?.nombre;
  const filtro = (
    <FiltroCategorias
      categorias={oferta.categorias}
      conteos={oferta.conteos}
      activa={categoriaActiva}
      total={oferta.total}
    />
  );

  return (
    <main className="seccion">
      <header className="max-w-3xl">
        <span className="inline-flex items-center gap-1.5 font-sans text-xs text-azul-texto">
          <span className="h-1.5 w-1.5 rounded-full bg-azul-texto" aria-hidden="true" />
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
            className="border border-azul-texto bg-azul-texto px-6 py-3 font-sans text-sm text-hueso transition-colors hover:bg-transparent hover:text-azul-texto"
          >
            Poner mi negocio en el mapa →
          </Link>

          <span className="font-sans text-xs text-tinta/60">
            Gratis · menos de 3 minutos · lo revisamos antes de publicarlo
          </span>
        </div>
      </header>

      {/* El mapa es lo primero y lo más grande de la página: es el elemento
          que hace tangible "esto existe de verdad", más que cualquier texto.
          Mapa y listado van juntos en un solo componente de cliente porque
          comparten estado: la ubicación del visitante y el punto tocado.
          Se monta SIEMPRE, aunque no haya aliados (en la categoría o en
          total): los comercios de OpenStreetMap también son parte de lo que
          se muestra, y la parte de aliados avisa que está vacía. */}
      <VitrinaAliados
        aliados={aliados}
        definicionesCampos={definicionesCampos}
        // Viene del buscador de la portada. Tope de largo: es texto de la URL.
        busquedaInicial={typeof q === 'string' ? q.slice(0, 100) : ''}
        categoriaActiva={categoriaActiva}
        nombreCategoria={nombreCategoria}
        filtro={filtro}
      />

      <Link
        href="/#enfoque"
        className="mt-24 inline-block font-sans text-sm text-tinta/65 underline decoration-azul underline-offset-4 hover:text-azul-texto"
      >
        ← Volver a Constelaciones
      </Link>
    </main>
  );
}
