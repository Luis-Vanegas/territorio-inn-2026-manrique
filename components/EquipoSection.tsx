// El Equipo: fichas editoriales separadas por una regla superior fina, sin sombras ni bordes redondeados.
// La numeración mono ("01 — 02 — 03") reemplaza al ícono genérico como detalle tipográfico.
//
// La foto va grande y rectangular, como las de los negocios en Aliados — no un
// avatar circular chico. Un círculo de 64px no alcanza para reconocer una cara;
// acá el retrato ocupa todo el ancho de la columna, en formato vertical.

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

      <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
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
              <div className="relative mt-4 aspect-[4/5] w-full overflow-hidden bg-tinta/5">
                <Image
                  src={miembro.foto}
                  alt={miembro.nombre}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            ) : (
              // Mismo formato y tamaño que la foto real: así una ficha sin
              // foto todavía no rompe la alineación de la grilla con las que
              // ya la tienen cargada.
              <div
                aria-hidden
                className="mt-4 flex aspect-[4/5] w-full items-center justify-center bg-terracota font-mono text-6xl text-hueso"
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
            {miembro.rol && (
              <p className="mt-1 font-mono text-xs text-terracota">{miembro.rol}</p>
            )}
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
