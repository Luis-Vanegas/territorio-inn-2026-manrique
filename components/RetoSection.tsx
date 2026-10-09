// Sobre nosotros: sin título propio (el h1 de la página ya lo da). Ocupa todo el
// ancho: la pregunta como entrada y el texto en dos columnas desde lg, para que se
// lea de corrido y baje a las fotos del equipo.

import { reto } from "@/lib/content";
import { ScrollReveal } from "./ScrollReveal";

export function RetoSection() {
  return (
    <section className="seccion">
      <ScrollReveal delay={0.1}>
        <p className="font-display text-2xl font-medium leading-snug text-tinta sm:text-3xl">
          {reto.pregunta}
        </p>
        <div className="mt-6 gap-x-12 lg:columns-2">
          {reto.parrafos.map((parrafo, i) => (
            <p
              key={parrafo}
              className={`break-inside-avoid font-sans text-lg leading-relaxed text-tinta/85 ${
                i === reto.parrafos.length - 1 ? "font-medium text-tinta" : ""
              } ${i > 0 ? "mt-6" : ""}`}
            >
              {parrafo}
            </p>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
