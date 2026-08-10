// El Equipo: fichas editoriales separadas por una regla superior fina, sin sombras ni bordes redondeados.
// La numeración mono ("01 — 02 — 03") reemplaza al ícono genérico como detalle tipográfico.

import Image from "next/image";
import { equipo } from "@/lib/team";
import { ScrollReveal } from "./ScrollReveal";

export function EquipoSection() {
  return (
    <section className="margen-editorial py-24 sm:py-32">
      <ScrollReveal>
        <h2 className="font-display text-6xl font-medium leading-[0.95] text-tinta sm:text-7xl">
          El equipo
        </h2>
      </ScrollReveal>

      <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 lg:grid-cols-3">
        {equipo.map((miembro, indice) => (
          <ScrollReveal
            key={`${miembro.nombre}-${indice}`}
            delay={indice * 0.1}
            className="border-t-2 border-terracota pt-6"
          >
            <span className="font-mono text-xs text-tinta/50">
              {String(indice + 1).padStart(2, "0")}
            </span>

            {miembro.foto ? (
              <div className="relative mt-4 h-16 w-16 overflow-hidden rounded-full bg-tinta/5">
                <Image
                  src={miembro.foto}
                  alt={miembro.nombre}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                aria-hidden
                className="mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-terracota font-mono text-lg text-hueso"
              >
                {miembro.iniciales}
              </div>
            )}

            <p className="mt-5 font-display text-2xl font-medium text-tinta">
              {miembro.nombre}
            </p>
            <p className="mt-1 font-sans text-sm text-tinta/70">
              {miembro.programaInstitucion}
            </p>
            <p className="mt-1 font-mono text-xs text-terracota">{miembro.rol}</p>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
