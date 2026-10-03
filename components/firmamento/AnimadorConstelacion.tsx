'use client';

import { useEffect, useRef } from 'react';

/**
 * Coreografía de la Constelación viva (DESIGN.md › Firmamento › Constelación
 * viva). Recibe el SVG ya dibujado por el servidor y lo anima UNA vez con
 * Anime.js cuando entra en pantalla.
 *
 * Anime.js no está en el bundle inicial: se pide con `import()` por módulos
 * (timeline, svg, utils) recién cuando la pieza se ve y solo si la persona no
 * pidió menos movimiento. Si no carga, se revela todo de una
 * (`cielo-vivo--listo`). El brillo en reposo es CSS y se pausa fuera de
 * pantalla con `cielo-vivo--visible`.
 */

export type VarianteConstelacion = 'completa' | 'compacta';

// Milisegundos. Ningún tramo pasa de 900 ms; la secuencia entera es la excepción
// documentada en DESIGN.md › Movimiento.
const TIEMPOS = {
  completa: {
    contorno: 900,
    barrios: [500, 700, 40],
    estrellas: [1200, 500, 3],
    lineas: [2100, 700, 30],
    destacadas: [3200, 600, 120],
  },
  compacta: {
    contorno: 700,
    barrios: [300, 500, 25],
    estrellas: [800, 400, 2],
    lineas: [1500, 600, 20],
    destacadas: null,
  },
} as const;

export function AnimadorConstelacion({
  variante,
  className,
  style,
  children,
}: {
  variante: VarianteConstelacion;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    const revelar = () => raiz.classList.add('cielo-vivo--listo');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revelar();
      return;
    }

    let cancelado = false;
    let detener: (() => void) | undefined;

    const visibilidad = new IntersectionObserver(([e]) =>
      raiz.classList.toggle('cielo-vivo--visible', Boolean(e?.isIntersecting)),
    );
    visibilidad.observe(raiz);

    const arranque = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        arranque.disconnect();
        Promise.all([import('animejs/timeline'), import('animejs/svg'), import('animejs/utils')])
          .then(([{ createTimeline }, { createDrawable }, { stagger }]) => {
            if (cancelado) return;
            const t = TIEMPOS[variante];
            const fase = (nombre: string) =>
              Array.from(raiz.querySelectorAll<HTMLElement | SVGElement>(`[data-fase="${nombre}"]`));
            // Los trazos se ocultan por el trazo (draw '0 0'), no por opacidad.
            const trazo = (nombre: string) => {
              const els = fase(nombre);
              const dibujables = createDrawable(els);
              els.forEach((el) => (el.style.opacity = '1'));
              return dibujables;
            };
            const dibujo = { draw: ['0 0', '0 1'] };

            const tl = createTimeline({
              defaults: { ease: 'outQuad' },
              onComplete: () => raiz.classList.add('cielo-vivo--reposo'),
            });
            tl.add(fase('fondo'), { opacity: [0, 1], duration: t.contorno }, 0)
              .add(trazo('contorno'), { ...dibujo, duration: t.contorno, ease: 'inOutSine' }, 0)
              .add(trazo('barrio'), { ...dibujo, duration: t.barrios[1], delay: stagger(t.barrios[2]) }, t.barrios[0])
              .add(
                fase('estrella'),
                { opacity: [0, 1], scale: [0.2, 1], duration: t.estrellas[1], delay: stagger(t.estrellas[2]) },
                t.estrellas[0],
              )
              .add(trazo('linea'), { ...dibujo, duration: t.lineas[1], delay: stagger(t.lineas[2]) }, t.lineas[0]);
            if (t.destacadas) {
              const [inicio, duracion, escalon] = t.destacadas;
              tl.add(fase('halo'), { opacity: [0, 1], scale: [0.6, 1], duration: duracion, delay: stagger(escalon) }, inicio)
                .add(
                  fase('nombre'),
                  { opacity: [0, 1], translateY: [6, 0], duration: duracion, delay: stagger(escalon) },
                  inicio + 150,
                );
            }
            detener = () => tl.pause();
          })
          .catch(revelar);
      },
      { threshold: 0.25 },
    );
    arranque.observe(raiz);

    return () => {
      cancelado = true;
      arranque.disconnect();
      visibilidad.disconnect();
      detener?.();
    };
  }, [variante]);

  return (
    <div ref={ref} className={`cielo-vivo ${className ?? ''}`} style={style}>
      {children}
    </div>
  );
}
