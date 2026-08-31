// Carrusel de fotos del territorio para el inicio.
//
// ── Un carrusel es fácil de hacer inaccesible, así que: ──
//
// 1. Avanza solo cada 6 s, PERO con botón de pausa. Ese botón es lo que hace
//    que cumpla WCAG 2.2.2: la regla no prohíbe el movimiento automático,
//    exige poder detenerlo. Sin el botón esto sería una falla de nivel A, y
//    es especialmente hostil para quien lee despacio o usa lector de
//    pantalla: la foto le cambia debajo mientras la está oyendo describir.
//    Por eso además: se detiene solo al poner el mouse encima o al enfocar
//    con el teclado, arranca detenido si la persona pidió
//    `prefers-reduced-motion`, y tocar las flechas también lo detiene —
//    quien tomó el control manual no quiere que se lo saquen a los 6 s.
// 2. Los controles son <button> de verdad, con nombre accesible y 44px de
//    área táctil. Nada de <div onClick>.
// 3. Cada cambio se anuncia por una región aria-live: quien no ve la pantalla
//    se entera de que pasó algo y de qué foto está viendo.
// 4. Solo se monta la foto visible, así el lector no encuentra dos imágenes
//    donde la persona ve una.

'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';

const INTERVALO_MS = 6000;

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
    src: '/fotos/manrique-iglesia.jpg',
    ancho: 1080,
    alto: 823,
    alt: 'La aguja blanca de la iglesia de Manrique se levanta en el centro, rodeada hasta el horizonte por miles de casas de ladrillo a la vista trepando la ladera, con árboles asomando entre ellas.',
    pie: 'La iglesia de Manrique entre las casas',
  },
  {
    src: '/fotos/manrique-casas-arcoiris.jpg',
    ancho: 1400,
    alto: 1867,
    alt: 'Casas pintadas de amarillo, azul, rosado y naranja escalonadas sobre la ladera de Manrique, con un arcoíris que baja hasta el agua y se refleja en ella, y gente caminando por el puente.',
    pie: 'Las casas pintadas y el arcoíris',
  },
];

export function CarruselFotos({ className }: { className?: string }) {
  const [indice, setIndice] = useState(0);
  const foto = FOTOS[indice] ?? FOTOS[0];
  const mover = (paso: number) =>
    setIndice((n) => (n + paso + FOTOS.length) % FOTOS.length);

  // `matchMedia` no existe en el servidor, así que no se puede leer durante el
  // render sin romper la hidratación. `useSyncExternalStore` es la API hecha
  // para esto: tiene un snapshot aparte para el servidor (el tercer argumento)
  // y se resuscribe sola si la persona cambia la preferencia con el sitio
  // abierto. La alternativa —un `useState` corregido desde un efecto— provoca
  // un segundo render y el linter la marca con razón.
  const prefiereMenosMovimiento = useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', avisar);
      return () => mq.removeEventListener('change', avisar);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );

  // `null` = todavía nadie tocó el botón, así que manda la preferencia del
  // sistema. Una vez que la persona decide, su decisión le gana — incluso para
  // reanudar, porque `prefers-reduced-motion` es un valor por defecto sensato,
  // no una prohibición.
  const [pausaManual, setPausaManual] = useState<boolean | null>(null);
  const detenido = pausaManual ?? prefiereMenosMovimiento;

  // El mouse encima o el foco adentro congelan el avance, pero sin tocar
  // `pausaManual`: sacar el mouse no debe reanudar algo que la persona pausó.
  const encima = useRef(false);

  useEffect(() => {
    if (detenido) return;
    const id = setInterval(() => {
      if (!encima.current) setIndice((n) => (n + 1) % FOTOS.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [detenido]);

  // Tocar una flecha es tomar el control: el avance solo se detiene y no
  // vuelve a arrancar por su cuenta.
  const moverAMano = (paso: number) => {
    setPausaManual(true);
    mover(paso);
  };

  return (
    <section
      className={`flex flex-col ${className ?? ''}`}
      aria-roledescription="carrusel"
      aria-label="Fotos de Manrique"
      onMouseEnter={() => { encima.current = true; }}
      onMouseLeave={() => { encima.current = false; }}
      onFocusCapture={() => { encima.current = true; }}
      onBlurCapture={() => { encima.current = false; }}
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
          // 90 y no el 75 por defecto: el contenedor recorta con object-cover,
          // así que se ve un pedazo ampliado de la foto y los artefactos de
          // compresión saltan. Hay que declararlo en `images.qualities` de
          // next.config.mjs o Next lo degrada a 75 sin avisar.
          quality={90}
          sizes="(min-width: 1024px) 42vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="font-mono text-sm text-tinta/65">{foto.pie}</p>

        <div className="flex items-center gap-1">
          {/* El botón de pausa es lo que hace que el avance automático cumpla
              WCAG 2.2.2. Va primero para que el tabulador lo encuentre antes
              que las flechas. */}
          <button
            type="button"
            onClick={() => setPausaManual(!detenido)}
            aria-label={detenido ? 'Reanudar el paso automático de fotos' : 'Detener el paso automático de fotos'}
            className="flex h-11 w-11 items-center justify-center border border-tinta/55 font-mono text-base text-tinta transition-colors hover:border-terracota-texto hover:text-terracota-texto"
          >
            <span aria-hidden="true">{detenido ? '▶' : '❚❚'}</span>
          </button>

          <button
            type="button"
            onClick={() => moverAMano(-1)}
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
            onClick={() => moverAMano(1)}
            aria-label="Foto siguiente"
            className="flex h-11 w-11 items-center justify-center border border-tinta/55 font-mono text-base text-tinta transition-colors hover:border-terracota-texto hover:text-terracota-texto"
          >
            →
          </button>
        </div>
      </div>

      {/* `polite` solo cuando la persona movió el carrusel a mano. Mientras
          avanza solo va en `off`: anunciar cada cambio automático sería
          interrumpir al lector de pantalla cada 6 s con algo que nadie pidió.
          Es lo que recomienda el patrón de carrusel de la APG. */}
      <p aria-live={detenido ? 'polite' : 'off'} className="sr-only">
        Foto {indice + 1} de {FOTOS.length}: {foto.alt}
      </p>
    </section>
  );
}
