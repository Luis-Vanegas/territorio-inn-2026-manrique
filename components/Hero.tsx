// Hero: titular tesis a bleed contra el margen izquierdo, subtítulo colgando debajo (asimetría real,
// no centrado), y el mapa de Manrique ocupando la columna derecha y sangrando fuera del margen.
//
// El mapa era `absolute -bottom-24 -right-24` dentro de una sección `min-h-screen`: la altura la
// fijaba el viewport, no el contenido, así que en pantallas anchas quedaban ~300px de aire muerto
// entre el subtítulo y el borde inferior, y el mapa se recortaba contra la esquina. Ahora el mapa es
// una celda más de la grilla: la sección mide lo que mide su contenido y el aire desaparece solo.

import Link from "next/link";
import { hero } from "@/lib/content";
import { ConstelacionBarrios } from "./ConstelacionBarrios";
import { ScrollReveal } from "./ScrollReveal";

export function Hero() {
  return (
    <section className="seccion overflow-hidden">
      <div className="grid grid-cols-1 items-center gap-y-12 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-7">
          <ScrollReveal>
            <span className="font-mono text-xs tracking-[0.2em] text-terracota-texto">
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

          {/* Bifurcación de intención: negocio vs servicio, buscar vs ofrecer
              son 4 caminos reales con rutas propias — no un único CTA que
              asume que todo el mundo llega a registrar algo.

              Iban los cuatro en una fila con flex-wrap, dos rellenos y dos
              con borde. Eso dejaba la lógica "buscar vs ofrecer" viviendo
              únicamente en el color (WCAG 1.4.1) y además hacía que dos
              botones le gritaran más fuerte que los otros dos, sin que nadie
              hubiera decidido comunicar esa jerarquía.

              Ahora son dos bloques con encabezado de texto y los cuatro
              botones con el mismo peso: el agrupamiento se comunica por
              posición y por palabra, que se leen sin depender de distinguir
              matices. Lo más fuerte del hero vuelve a ser el titular, que es
              donde está la pregunta que el visitante tiene que responder.
              Decisión de la usuaria de la prueba (2026-08-28). */}
          <ScrollReveal delay={0.45}>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:gap-10">
              {hero.gruposCta.map((grupo) => {
                const ctas = hero.ctas.filter((c) => c.tipo === grupo.tipo);
                if (ctas.length === 0) return null;

                return (
                  <div key={grupo.tipo} className="flex flex-col">
                    <h2 className="font-mono text-sm uppercase tracking-[0.15em] text-tinta/65">
                      {grupo.titulo}
                    </h2>
                    {/* Sin números mágicos: las dos celdas de la grilla de
                        arriba ya miden lo mismo (align-items: stretch), así
                        que alcanza con que la lista ocupe todo el alto de su
                        celda y reparta las filas en partes iguales. El botón
                        cuyo texto envuelve define la altura y los otros tres
                        la acompañan. */}
                    <div className="mt-3 grid flex-1 auto-rows-fr gap-2">
                      {ctas.map((cta) => (
                        <Link
                          key={cta.href}
                          href={cta.href}
                          className="group flex min-h-[44px] items-center justify-between gap-3 border border-tinta/55 px-4 py-2.5 font-mono text-base leading-snug text-tinta transition-colors hover:border-terracota-texto hover:text-terracota-texto"
                        >
                          {cta.etiqueta}
                          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                            →
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        </div>

        {/* El territorio entra con el mismo delay que el subtítulo: la
            secuencia de carga es etiqueta → titular → (subtítulo + territorio)
            a la vez. Ya no sangra fuera del margen: el mapa lo hacía porque era
            un gráfico que ganaba con el bleed, pero acá hay texto, y el texto
            se lee mejor dentro de la grilla editorial que colgando del borde. */}
        <ScrollReveal delay={0.3} className="lg:col-span-5">
          <ConstelacionBarrios className="w-full lg:pl-4" />
        </ScrollReveal>
      </div>
    </section>
  );
}
