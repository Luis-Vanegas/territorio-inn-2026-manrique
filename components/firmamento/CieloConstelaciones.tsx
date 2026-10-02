'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { PALETA_NOCHE } from '@/lib/paleta';
import { pathEstrella } from '@/components/mapa/formas';
import type { Cielo } from '@/app/(site)/firmamento/datos';

/**
 * El cielo de hoy: los comercios de OpenStreetMap dentro del contorno de la
 * Comuna 3, con las líneas del árbol de expansión mínima de cada constelación.
 * Es el mismo dato del mapa de más abajo, sin el fondo de calles.
 *
 * Movimiento (docs/plan-diseno-2026-10.md §4), todo con framer-motion y solo
 * `opacity` y el trazo (`pathLength`):
 * - Las líneas se trazan de 0 a 1 al entrar en pantalla, escalonadas; ninguna
 *   dura más de 900 ms en total.
 * - Las estrellas parpadean muy leve (0,6 ↔ 1, de 3 a 6 s), desfasadas en 4
 *   grupos (4 animaciones y no 320).
 * - Con `prefers-reduced-motion` todo aparece directo y no parpadea.
 *
 * Visible sin JavaScript: el HTML del servidor trae el trazo en 0 (así lo rinde
 * framer), pero `.linea-cielo` (styles/globals.css) lo anula sin `js` y lo
 * revela a los 4 s si el bundle no llega.
 */

const R_CONSTELACION = 5;
const R_SUELTA = 3;
const GRUPOS_PARPADEO = 4;

const estrella = ([x, y]: [number, number], r: number) => pathEstrella(x, y, r);

export function CieloConstelaciones({ cielo, descripcion }: { cielo: Cielo; descripcion: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const enVista = useInView(ref, { once: true, amount: 0.3 });
  const sinMovimiento = useReducedMotion();

  // Las estrellas de constelación se reparten en grupos para el parpadeo.
  const grupos: string[] = Array.from({ length: GRUPOS_PARPADEO }, () => '');
  cielo.constelaciones.forEach((c) =>
    c.estrellas.forEach((p, i) => {
      const g = i % GRUPOS_PARPADEO;
      grupos[g] += estrella(p, R_CONSTELACION);
    }),
  );
  const sueltos = cielo.sueltos.map((p) => estrella(p, R_SUELTA)).join('');

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${cielo.ancho} ${cielo.alto}`}
      role="img"
      aria-label={descripcion}
      className="mx-auto block h-auto w-full max-w-[560px]"
    >
      <path
        d={cielo.contorno}
        fill={PALETA_NOCHE['noche-2']}
        stroke={PALETA_NOCHE['trazo-2']}
        strokeWidth={1}
        strokeLinejoin="round"
      />

      <g stroke={PALETA_NOCHE['noche-azul']} strokeOpacity={0.75} strokeWidth={1.5} fill="none">
        {cielo.constelaciones.map((c, i) => (
          <motion.path
            key={c.id}
            d={c.lineas}
            className="linea-cielo"
            initial={sinMovimiento ? false : { pathLength: 0 }}
            animate={sinMovimiento || enVista ? { pathLength: 1 } : {}}
            transition={{ duration: 0.65, delay: i * 0.0125, ease: 'easeOut' }}
          />
        ))}
      </g>

      <path d={sueltos} fill={PALETA_NOCHE.tenue} fillOpacity={0.7} />

      {grupos.map((d, g) => (
        <motion.path
          key={g}
          d={d}
          fill={PALETA_NOCHE.estrella}
          animate={sinMovimiento ? { opacity: 1 } : { opacity: [0.6, 1] }}
          transition={
            sinMovimiento
              ? { duration: 0 }
              : {
                  duration: 3 + g, // 3, 4, 5 y 6 s
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                  delay: g * 0.7,
                }
          }
        />
      ))}
    </svg>
  );
}
