// Galería fotográfica de Aliados: grid de las fotos que subieron los negocios
// al registrarse, en columnas hacia abajo. Complementa a AliadosDestacado (mapa
// + CTA) con algo más visual e inmediato — ver de un vistazo que hay negocios
// reales, con cara, detrás del mapa.
//
// Solo entran los aprobados con foto_url: un negocio sin foto no deja un
// hueco gris en la grilla, simplemente no aparece acá (sigue viéndose en el
// mapa y en la lista de /aliados).
//
// Server Component: trae sus propios datos, mismo criterio que AliadosDestacado.

import Link from "next/link";
import Image from "next/image";
import { listarAprobados } from "@/lib/db/portafolios.repo";
import { ScrollReveal } from "./ScrollReveal";

const MAXIMO = 12;

export async function GaleriaAliados() {
  const aliados = await listarAprobados();
  const conFoto = aliados.filter((a) => a.foto_url).slice(0, MAXIMO);

  if (conFoto.length === 0) return null;

  return (
    <section className="seccion" aria-label="Galería de negocios aliados">
      <ScrollReveal>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-4xl font-medium leading-[0.95] text-tinta sm:text-5xl">
            Caras del barrio
          </h2>
          <Link
            href="/aliados"
            className="font-mono text-sm text-tinta/55 underline decoration-terracota underline-offset-4 hover:text-terracota-texto"
          >
            Ver todos →
          </Link>
        </div>
      </ScrollReveal>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {conFoto.map((portafolio, indice) => (
          <ScrollReveal key={portafolio.id} delay={Math.min(indice, 4) * 0.06}>
            <Link
              href={`/aliados#${portafolio.id}`}
              className="group relative block aspect-square w-full overflow-hidden bg-tinta/5"
            >
              <Image
                src={portafolio.foto_url!}
                alt={`Fotografía de ${portafolio.nombre}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 17vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-tinta/70 px-2.5 py-2 font-mono text-[11px] text-hueso opacity-0 transition-opacity group-hover:opacity-100">
                {portafolio.nombre}
              </span>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
