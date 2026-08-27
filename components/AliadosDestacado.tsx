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
import { enfoque } from "@/lib/content";
import { MapaAliadosDestacado } from "./MapaAliadosDestacado";
import { ScrollReveal } from "./ScrollReveal";

const MAXIMO_EN_MAPA = 30;

export async function AliadosDestacado() {
  const [aliados, conteos] = await Promise.all([
    listarAprobados(),
    contarAprobadosPorCategoria(),
  ]);

  const total = Object.values(conteos).reduce((a, b) => a + b, 0);
  // Aliados siempre está en enfoque.modulos (nunca se filtra), así que el find
  // nunca da undefined acá.
  const modulo = enfoque.modulos.find((m) => m.slug === "aliados")!;

  return (
    // Texto y mapa van lado a lado desde lg: apilados sumaban ~1130px de alto
    // para una sola idea, y en pantallas anchas el bloque de texto dejaba media
    // pantalla vacía a la derecha. Ahora el mapa ocupa ese vacío.
    <section className="seccion" aria-label="Aliados">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:items-center lg:gap-x-10">
        <ScrollReveal className="lg:col-span-5">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-terracota">
              <span className="h-1.5 w-1.5 rounded-full bg-terracota" aria-hidden="true" />
              {modulo.numero} · Aliados · en vivo
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
              : "¿Tienes un negocio o un oficio en Manrique?"}
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
              Sumar mi negocio →
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

        <ScrollReveal delay={0.15} className="lg:col-span-7">
          <MapaAliadosDestacado portafolios={aliados.slice(0, MAXIMO_EN_MAPA)} />

          {total === 0 && (
            <p className="mt-3 font-mono text-xs text-tinta/40">
              El mapa está vacío por ahora — sé el primer punto marcado.
            </p>
          )}
        </ScrollReveal>
      </div>
    </section>
  );
}
