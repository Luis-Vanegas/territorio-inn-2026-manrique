// El Enfoque: los 3 módulos futuros como índice de revista (número + nombre + línea), no como cards.
// La indentación alterna entre filas para romper la simetría del listado.
// Cada fila enlaza a su ruta stub (/empleo, /inventario-predictivo, /portafolios): existen como
// destino aunque todavía no tengan funcionalidad real detrás.

import Link from "next/link";
import { enfoque } from "@/lib/content";
import { ScrollReveal } from "./ScrollReveal";

export function EnfoqueSection() {
  return (
    <section id="enfoque" className="margen-editorial py-24 sm:py-32">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <ScrollReveal>
          <h2 className="font-display text-6xl font-medium leading-[0.95] text-tinta sm:text-7xl">
            {enfoque.titulo}
          </h2>
        </ScrollReveal>
        <span className="font-mono text-sm text-terracota">{enfoque.nota}</span>
      </div>

      <div className="mt-16 divide-y divide-tinta/15 border-t border-tinta/15">
        {enfoque.modulos.map((modulo, indice) => (
          <ScrollReveal key={modulo.numero} delay={indice * 0.1}>
            <Link
              href={`/${modulo.slug}`}
              className={`group flex flex-col gap-2 py-8 transition-colors sm:flex-row sm:items-baseline sm:gap-8 ${
                indice % 2 === 1 ? "sm:pl-16" : ""
              }`}
            >
              <span className="font-mono text-sm text-tinta/50">{modulo.numero}</span>
              <p className="font-display text-3xl font-medium text-tinta transition-transform group-hover:translate-x-2 group-hover:text-terracota sm:w-72">
                {modulo.nombre}
              </p>
              <p className="max-w-md font-sans text-base text-tinta/70">
                {modulo.descripcion}
              </p>
              <span className="font-mono text-sm text-terracota opacity-0 transition-opacity group-hover:opacity-100 sm:ml-auto">
                →
              </span>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
