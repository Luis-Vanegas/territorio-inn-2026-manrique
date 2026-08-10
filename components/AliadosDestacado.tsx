// Sección destacada de Aliados en el home, justo después del Hero.
//
// Es la pieza central del pedido: Aliados tiene que ser lo primero que capta
// la atención de alguien que entra al sitio, con el mapa real (no una
// ilustración) y el registro a un clic — no enterrado en el índice de módulos
// de más abajo.
//
// Server Component: trae sus propios datos, así Home no necesita ser async
// solo para esta sección.

import Link from "next/link";
import { listarAprobados, contarAprobadosPorCategoria } from "@/lib/db/portafolios.repo";
import { MapaAliados } from "./MapaAliados";
import { ScrollReveal } from "./ScrollReveal";

const MAXIMO_EN_MAPA = 30;

export async function AliadosDestacado() {
  const [aliados, conteos] = await Promise.all([
    listarAprobados(),
    contarAprobadosPorCategoria(),
  ]);

  const total = Object.values(conteos).reduce((a, b) => a + b, 0);

  return (
    <section className="margen-editorial py-20 sm:py-28" aria-label="Aliados">
      <ScrollReveal>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-terracota">
            <span className="h-1.5 w-1.5 rounded-full bg-terracota" aria-hidden="true" />
            03 · Aliados · en vivo
          </span>

          {total > 0 && (
            <span className="font-mono text-xs text-tinta/45">
              {total} {total === 1 ? "negocio" : "negocios"} ya en el mapa
            </span>
          )}
        </div>

        <h2 className="mt-4 max-w-2xl font-display text-4xl font-medium leading-[1.02] text-tinta sm:text-6xl">
          {total > 0
            ? "Los negocios de Manrique, con nombre y dirección."
            : "Poné tu negocio en el mapa de Manrique."}
        </h2>

        <p className="mt-5 max-w-lg font-sans text-lg leading-relaxed text-tinta/70">
          Aliados es el directorio público de negocios y oficios de la Comuna 3.
          Cualquiera puede sumarse: es gratis, toma menos de 3 minutos y queda
          visible para todo el barrio.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href="/aliados/registro"
            className="border border-terracota bg-terracota px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-terracota"
          >
            Registrar mi negocio →
          </Link>

          {total > 0 && (
            <Link
              href="/aliados"
              className="font-mono text-sm text-tinta/55 underline decoration-terracota underline-offset-4 hover:text-terracota"
            >
              Ver el mapa completo
            </Link>
          )}
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <div className="mt-12 h-[380px] w-full overflow-hidden border border-tinta/12 sm:h-[460px]">
          <MapaAliados portafolios={aliados.slice(0, MAXIMO_EN_MAPA)} />
        </div>

        {total === 0 && (
          <p className="mt-3 font-mono text-xs text-tinta/40">
            El mapa está vacío por ahora — sé el primer punto marcado.
          </p>
        )}
      </ScrollReveal>
    </section>
  );
}
