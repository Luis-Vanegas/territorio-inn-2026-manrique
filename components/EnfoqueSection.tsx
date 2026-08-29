// El Enfoque: los 3 módulos como índice de revista (número + nombre + línea), no como cards.
// La indentación alterna entre filas para romper la simetría del listado.
// Cada fila enlaza a su ruta real: Empleo y Aliados funcionan de verdad,
// Inventario predictivo todavía es un stub — por eso el estado se marca por
// fila y no con un "[ Próximamente ]" único que hoy sería falso para 2 de 3.

import Link from "next/link";
import { enfoque } from "@/lib/content";
import { ScrollReveal } from "./ScrollReveal";

export function EnfoqueSection() {
  return (
    <section id="enfoque" className="seccion">
      <ScrollReveal>
        <h2 className="font-display text-6xl font-medium leading-[0.95] text-tinta sm:text-7xl">
          {enfoque.titulo}
        </h2>
      </ScrollReveal>

      <div className="mt-10 divide-y divide-tinta/15 border-t border-tinta/15">
        {enfoque.modulos.map((modulo, indice) => (
          <ScrollReveal key={modulo.numero} delay={indice * 0.1}>
            <Link
              href={`/${modulo.slug}`}
              className={`group flex flex-col gap-2 py-8 transition-colors sm:flex-row sm:items-baseline sm:gap-8 ${
                indice % 2 === 1 ? "sm:pl-16" : ""
              }`}
            >
              <span className="font-mono text-sm text-tinta/50">{modulo.numero}</span>
              <p className="font-display text-3xl font-medium text-tinta transition-transform group-hover:translate-x-2 group-hover:text-terracota-texto sm:w-72">
                {modulo.nombre}
              </p>
              <p className="max-w-md font-sans text-base text-tinta/70">
                {modulo.descripcion}
              </p>

              {modulo.estado === "proximamente" ? (
                <span className="font-mono text-xs text-tinta/40 sm:ml-auto">
                  [ Próximamente ]
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-terracota-texto sm:ml-auto">
                  <span className="h-1.5 w-1.5 rounded-full bg-terracota" aria-hidden="true" />
                  en vivo
                </span>
              )}

              <span className="font-mono text-sm text-terracota-texto opacity-0 transition-opacity group-hover:opacity-100 sm:ml-4">
                →
              </span>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
