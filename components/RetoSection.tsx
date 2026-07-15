// El Reto: título en columna angosta a la izquierda, cuerpo en columna ancha tipo artículo de revista.
// El pull-quote rompe el grid con una regla vertical terracota en vez de comillas decorativas.

import { reto } from "@/lib/content";
import { ScrollReveal } from "./ScrollReveal";

export function RetoSection() {
  return (
    <section className="margen-editorial py-24 sm:py-32">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
        <ScrollReveal className="lg:col-span-4">
          <h2 className="font-display text-6xl font-medium leading-[0.95] text-tinta sm:text-7xl">
            {reto.titulo}
          </h2>
        </ScrollReveal>

        <div className="lg:col-span-7 lg:col-start-6">
          <ScrollReveal delay={0.1} className="space-y-6">
            {reto.parrafos.map((parrafo) => (
              <p key={parrafo} className="font-sans text-lg leading-relaxed text-tinta/85">
                {parrafo}
              </p>
            ))}
          </ScrollReveal>

          <ScrollReveal delay={0.2} className="mt-14 border-l-2 border-terracota pl-6">
            <p className="font-display text-3xl italic leading-snug text-terracota sm:text-4xl">
              {reto.cita}
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
