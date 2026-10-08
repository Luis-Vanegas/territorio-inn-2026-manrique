// Sobre nosotros: sin título propio (el h1 de la página ya lo da), cuerpo tipo artículo de revista.

import { reto } from "@/lib/content";
import { ScrollReveal } from "./ScrollReveal";

export function RetoSection() {
  return (
    <section className="seccion">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-x-8">
        <ScrollReveal delay={0.1} className="space-y-6 lg:col-span-8">
          {reto.parrafos.map((parrafo) => (
            <p key={parrafo} className="font-sans text-lg leading-relaxed text-tinta/85">
              {parrafo}
            </p>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
