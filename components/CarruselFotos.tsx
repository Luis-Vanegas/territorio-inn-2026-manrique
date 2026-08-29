// Carrusel de fotos del territorio para el inicio.
//
// ── Un carrusel es fácil de hacer inaccesible, así que: ──
//
// 1. NO avanza solo. Contenido que se mueve sin que la persona lo pida rompe
//    WCAG 2.2.2, y es especialmente hostil para quien lee despacio o usa
//    lector de pantalla: la foto le cambia debajo mientras la está oyendo
//    describir. Si más adelante alguien quiere autoplay, hay que agregar un
//    botón de pausa; sin ese botón, no.
// 2. Los controles son <button> de verdad, con nombre accesible y 44px de
//    área táctil. Nada de <div onClick>.
// 3. Cada cambio se anuncia por una región aria-live: quien no ve la pantalla
//    se entera de que pasó algo y de qué foto está viendo.
// 4. Solo se monta la foto visible, así el lector no encuentra dos imágenes
//    donde la persona ve una.

'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Foto {
  src: string;
  ancho: number;
  alto: number;
  alt: string;
  pie: string;
}

// Tupla no vacía en vez de Foto[]: con noUncheckedIndexedAccess, así el
// compilador sabe que FOTOS[0] existe y el fallback de abajo no necesita un
// non-null assertion para convencerlo.
const FOTOS: [Foto, ...Foto[]] = [
  {
    src: '/fotos/manrique-tejados.jpg',
    ancho: 1200,
    alto: 650,
    alt: 'Tejados de barro de Manrique vistos desde lo alto, con la torre de la iglesia del barrio entre las casas y el centro de Medellín y las montañas al fondo.',
    pie: 'Manrique desde lo alto',
  },
  {
    src: '/fotos/casas-de-colores.jpg',
    ancho: 720,
    alto: 480,
    alt: 'Casas de Manrique pintadas de colores vivos, escalonadas sobre la ladera, con un arcoíris formándose sobre el agua en primer plano.',
    pie: 'Las casas pintadas de Manrique',
  },
];

export function CarruselFotos({ className }: { className?: string }) {
  const [indice, setIndice] = useState(0);
  const foto = FOTOS[indice] ?? FOTOS[0];
  const mover = (paso: number) =>
    setIndice((n) => (n + paso + FOTOS.length) % FOTOS.length);

  return (
    <section
      className={`flex flex-col ${className ?? ''}`}
      aria-roledescription="carrusel"
      aria-label="Fotos de Manrique"
    >
      {/* min-h en mobile porque ahí la columna no tiene altura propia; en
          escritorio la hereda del texto de al lado y la foto la llena. */}
      <div className="relative min-h-[260px] flex-1 overflow-hidden">
        <Image
          key={foto.src}
          src={foto.src}
          alt={foto.alt}
          width={foto.ancho}
          height={foto.alto}
          priority
          sizes="(min-width: 1024px) 42vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="font-mono text-sm text-tinta/65">{foto.pie}</p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => mover(-1)}
            aria-label="Foto anterior"
            className="flex h-11 w-11 items-center justify-center border border-tinta/55 font-mono text-base text-tinta transition-colors hover:border-terracota-texto hover:text-terracota-texto"
          >
            ←
          </button>

          {/* El contador es texto, no puntitos de color: se lee sin depender
              de distinguir un tono de otro. */}
          <p className="w-14 text-center font-mono text-sm text-tinta/65">
            {indice + 1} / {FOTOS.length}
          </p>

          <button
            type="button"
            onClick={() => mover(1)}
            aria-label="Foto siguiente"
            className="flex h-11 w-11 items-center justify-center border border-tinta/55 font-mono text-base text-tinta transition-colors hover:border-terracota-texto hover:text-terracota-texto"
          >
            →
          </button>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        Foto {indice + 1} de {FOTOS.length}: {foto.alt}
      </p>
    </section>
  );
}
