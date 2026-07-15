// La Comuna 3 — Manrique: 3 KPIs en JetBrains Mono, gigantes, con altura escalonada para que no lea
// como un dashboard de 3 columnas idénticas sino como una infografía editorial.

import { comuna } from "@/lib/content";
import { ScrollReveal } from "./ScrollReveal";

const DESPLAZAMIENTOS = ["lg:mt-0", "lg:mt-16", "lg:mt-4"];

export function ComunaSection() {
  return (
    <section className="margen-editorial py-24 sm:py-32">
      <ScrollReveal>
        <h2 className="font-display text-6xl font-medium leading-[0.95] text-tinta sm:text-7xl">
          {comuna.titulo}
        </h2>
      </ScrollReveal>

      <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3">
        {comuna.kpis.map((kpi, indice) => (
          <ScrollReveal
            key={kpi.etiqueta}
            delay={indice * 0.1}
            className={DESPLAZAMIENTOS[indice]}
          >
            <p className="font-mono text-6xl font-medium text-terracota sm:text-7xl">
              {kpi.valor}
            </p>
            <p className="mt-3 font-sans text-base font-medium text-tinta">
              {kpi.etiqueta}
            </p>
            <p className="mt-1 font-mono text-xs text-tinta/50">{kpi.contexto}</p>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
