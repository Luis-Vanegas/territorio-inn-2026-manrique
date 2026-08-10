// Hero: titular tesis a bleed contra el margen izquierdo, subtítulo desplazado a la derecha (asimetría
// real, no centrado), mapa de Manrique cruzando el fold inferior-derecho como elemento territorial dominante.

import { hero } from "@/lib/content";
import { MapaManrique } from "./MapaManrique";
import { ScrollReveal } from "./ScrollReveal";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden margen-editorial pt-12 pb-24 sm:pt-20">
      {/* El padding-top bajó de pt-32/pt-40: el SiteHeader sticky ya ocupa
          ~64-72px arriba, y sumar el padding viejo dejaba un salto enorme
          antes del titular. */}
      <div className="relative z-10 grid grid-cols-1 gap-y-10 lg:grid-cols-12">
        <ScrollReveal className="lg:col-span-12">
          <span className="font-mono text-xs tracking-[0.2em] text-terracota">
            {hero.etiqueta}
          </span>
        </ScrollReveal>

        <ScrollReveal delay={0.15} className="lg:col-span-8">
          <h1 className="break-words font-display text-[15vw] font-medium leading-[0.92] tracking-tight text-tinta sm:text-[13vw] lg:text-[8vw] xl:text-[7.5rem]">
            {hero.titular}
          </h1>
        </ScrollReveal>

        <ScrollReveal
          delay={0.3}
          className="lg:col-span-5 lg:col-start-8 lg:mt-16"
        >
          <p className="max-w-sm font-sans text-lg leading-relaxed text-tinta/80">
            {hero.subtitulo}
          </p>
        </ScrollReveal>
      </div>

      <MapaManrique className="pointer-events-none absolute -bottom-24 -right-24 z-0 h-[70vw] max-h-[640px] w-[70vw] max-w-[640px] text-tinta/25 sm:-bottom-16 sm:-right-16" />
    </section>
  );
}
