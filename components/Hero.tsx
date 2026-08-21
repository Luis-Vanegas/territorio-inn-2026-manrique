// Hero: titular tesis a bleed contra el margen izquierdo, subtítulo colgando debajo (asimetría real,
// no centrado), y el mapa de Manrique ocupando la columna derecha y sangrando fuera del margen.
//
// El mapa era `absolute -bottom-24 -right-24` dentro de una sección `min-h-screen`: la altura la
// fijaba el viewport, no el contenido, así que en pantallas anchas quedaban ~300px de aire muerto
// entre el subtítulo y el borde inferior, y el mapa se recortaba contra la esquina. Ahora el mapa es
// una celda más de la grilla: la sección mide lo que mide su contenido y el aire desaparece solo.

import { hero } from "@/lib/content";
import { MapaManrique } from "./MapaManrique";
import { ScrollReveal } from "./ScrollReveal";

export function Hero() {
  return (
    <section className="seccion overflow-hidden">
      <div className="grid grid-cols-1 items-center gap-y-12 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-7">
          <ScrollReveal>
            <span className="font-mono text-xs tracking-[0.2em] text-terracota">
              {hero.etiqueta}
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <h1 className="mt-6 break-words font-display text-[13vw] font-medium leading-[0.92] tracking-tight text-tinta sm:text-[11vw] lg:text-[5.6vw] xl:text-[6rem]">
              {hero.titular}
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <p className="mt-8 max-w-md font-sans text-lg leading-relaxed text-tinta/80">
              {hero.subtitulo}
            </p>
          </ScrollReveal>
        </div>

        {/* El mapa entra con el mismo delay que el subtítulo: la secuencia de
            carga es etiqueta → titular → (subtítulo + territorio) a la vez. */}
        <ScrollReveal delay={0.3} className="lg:col-span-5 lg:mr-[calc(var(--margen-editorial)*-1)]">
          <MapaManrique className="pointer-events-none ml-auto h-auto w-full max-w-[300px] text-tinta/25 sm:max-w-[380px] lg:max-w-[460px]" />
        </ScrollReveal>
      </div>
    </section>
  );
}
