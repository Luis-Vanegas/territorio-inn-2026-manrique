// Hero: titular tesis a bleed contra el margen izquierdo, subtítulo colgando debajo (asimetría real,
// no centrado), y el mapa de Manrique ocupando la columna derecha y sangrando fuera del margen.
//
// El mapa era `absolute -bottom-24 -right-24` dentro de una sección `min-h-screen`: la altura la
// fijaba el viewport, no el contenido, así que en pantallas anchas quedaban ~300px de aire muerto
// entre el subtítulo y el borde inferior, y el mapa se recortaba contra la esquina. Ahora el mapa es
// una celda más de la grilla: la sección mide lo que mide su contenido y el aire desaparece solo.

import Link from "next/link";
import { hero } from "@/lib/content";
import { CarruselFotos } from "./CarruselFotos";
import { ScrollReveal } from "./ScrollReveal";

export function Hero() {
  const gruposConCtas = hero.gruposCta.filter((grupo) =>
    hero.ctas.some((c) => c.tipo === grupo.tipo),
  );

  return (
    <section className="seccion overflow-hidden">
      <div className="grid grid-cols-1 items-center gap-y-12 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-7">
          <ScrollReveal>
            <span className="font-mono text-xs tracking-[0.2em] text-morado-texto">
              {hero.etiqueta}
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            {/* 10.5vw en móvil y no 13vw: el titular v3 trae «emprendimientos»
                y a 13vw esa palabra mide 381px contra 327px de ancho útil en un
                celular de 375px, así que `break-words` la partía al medio y SIN
                guion —«emprendimien / tos»—, que es justo donde el ojo tropieza.
                Medido en el navegador, no a ojo.
                Silabear no alcanzaba: hasta «emprendimien-» mide 334px, o sea
                que tampoco entraba y el navegador abandonaba la silabación.
                El cuerpo es la causa, no el guion.
                El número sale de que la palabra mide 7.8 veces el tamaño de
                fuente: para que entre hace falta cuerpo ≤ (ancho − 48px de
                margen) / 7.8, que a 320px —el iPhone SE, el más angosto que
                importa— da 10.87vw. 10.5vw deja aire.
                `hyphens-auto` se queda igual: si algún día vuelve a hacer falta
                la red de `break-words`, que al menos corte por sílaba y con
                guion. Es CSS nativo, no una librería de tipografía. */}
            <h1 className="mt-6 hyphens-auto break-words font-display text-[10.5vw] font-medium leading-[0.92] tracking-tight text-tinta sm:text-[11vw] lg:text-[5.6vw] xl:text-[6rem]">
              {hero.titular}
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <p className="mt-8 max-w-md font-sans text-lg leading-relaxed text-tinta/80">
              {hero.subtitulo}
            </p>
          </ScrollReveal>

          {/* Grilla de 2 columnas pensada para 4 caminos (ver lib/content.ts,
              hero.ctas v1: bifurcación buscar/ofrecer probada con una
              usuaria real el 2026-08-28). Desde la v2 el Hero empuja un solo
              CTA, pero la grilla se queda: `gruposConCtas` filtra los grupos
              sin botones y `sm:grid-cols-2` solo se aplica si sobra más de
              uno, así que un único CTA ocupa el ancho entero en vez de dejar
              la mitad derecha vacía. Si algún día vuelve a haber más de un
              camino, la grilla de 2 columnas ya está lista sin tocar esto. */}
          <ScrollReveal delay={0.45}>
            <div
              className={`mt-10 grid gap-8 sm:gap-10 ${gruposConCtas.length > 1 ? 'sm:grid-cols-2' : ''}`}
            >
              {gruposConCtas.map((grupo) => {
                const ctas = hero.ctas.filter((c) => c.tipo === grupo.tipo);

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
                          className="group flex min-h-[44px] items-center justify-between gap-3 border border-azul-texto bg-azul-texto text-hueso transition-colors hover:bg-transparent hover:text-azul-texto px-4 py-2.5 font-mono text-base leading-snug"
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
            secuencia de carga es etiqueta → titular → (subtítulo + fotos).

            self-stretch en vez del items-center de la grilla: centrada, la
            foto flotaba en el medio de una columna mucho más alta que ella y
            no se alineaba con nada. Estirada, arranca donde arranca la
            etiqueta y termina donde terminan los botones — un bloque, no algo
            suelto. */}
        <ScrollReveal delay={0.3} className="lg:col-span-5 lg:self-stretch">
          <CarruselFotos className="h-full" />
        </ScrollReveal>
      </div>
    </section>
  );
}
