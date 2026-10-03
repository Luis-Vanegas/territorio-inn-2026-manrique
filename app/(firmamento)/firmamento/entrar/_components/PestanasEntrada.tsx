'use client';

import { motion } from 'framer-motion';
import { useId, useRef, useState } from 'react';

import type { RolFirmamento } from '@/lib/firmamento/navegacion';

const PESTANAS: { rol: RolFirmamento; etiqueta: string }[] = [
  { rol: 'negocio', etiqueta: 'Mi negocio' },
  { rol: 'equipo', etiqueta: 'Equipo' },
  { rol: 'entidad', etiqueta: 'Entidad' },
];

/**
 * Las tres puertas de Firmamento como pestañas (patrón WAI-ARIA «Tabs» con
 * activación automática): `role="tablist"`, flechas izquierda y derecha, Inicio y
 * Fin; solo la pestaña activa entra en el orden de Tab (tabindex móvil) y el
 * panel se enfoca desde ella con Tab.
 *
 * Los tres paneles llegan ya armados desde el servidor (`paneles`) y se
 * renderizan todos; los inactivos van con `hidden`. Sin JavaScript se ve el panel
 * de la pestaña inicial (`?rol=` o «Mi negocio»).
 *
 * Movimiento: un fundido corto de 180 ms al CAMBIAR de pestaña, nunca al cargar
 * (`initial={false}`: el panel activo nace ya visible en el HTML del servidor,
 * y los inactivos están `hidden`). Con `prefers-reduced-motion` no hay fundido:
 * el panel cambia directo.
 */
export function PestanasEntrada({
  inicial,
  paneles,
}: {
  inicial: RolFirmamento;
  paneles: Record<RolFirmamento, React.ReactNode>;
}) {
  const [activa, setActiva] = useState<RolFirmamento>(inicial);
  // Se consulta al cambiar de pestaña y no con el hook `useReducedMotion`, que en
  // la hidratación queda con el valor del servidor (null) y no se actualiza.
  const [duracion, setDuracion] = useState(0.18);
  const base = useId();
  const botones = useRef<Record<string, HTMLButtonElement | null>>({});

  function elegir(rol: RolFirmamento, enfocar = false) {
    setDuracion(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.18);
    setActiva(rol);
    if (enfocar) botones.current[rol]?.focus();
  }

  function alTeclear(e: React.KeyboardEvent) {
    const i = PESTANAS.findIndex((p) => p.rol === activa);
    let destino: number | null = null;
    if (e.key === 'ArrowRight') destino = (i + 1) % PESTANAS.length;
    else if (e.key === 'ArrowLeft') destino = (i - 1 + PESTANAS.length) % PESTANAS.length;
    else if (e.key === 'Home') destino = 0;
    else if (e.key === 'End') destino = PESTANAS.length - 1;
    if (destino === null) return;
    e.preventDefault();
    elegir(PESTANAS[destino]!.rol, true);
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="¿Cómo participas en la red?"
        onKeyDown={alTeclear}
        className="grid grid-cols-3 gap-1 rounded-xl border border-trazo-2 bg-noche p-1"
      >
        {PESTANAS.map(({ rol, etiqueta }) => {
          const seleccionada = rol === activa;
          return (
            <button
              key={rol}
              ref={(el) => {
                botones.current[rol] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-pestana-${rol}`}
              aria-selected={seleccionada}
              aria-controls={`${base}-panel-${rol}`}
              tabIndex={seleccionada ? 0 : -1}
              onClick={() => elegir(rol)}
              className={`min-h-[44px] whitespace-nowrap rounded-lg px-1 font-sans text-sm transition-colors sm:text-[15px] ${
                seleccionada
                  ? 'bg-noche-activa font-medium text-estrella'
                  : 'text-tenue hover:bg-noche-3 hover:text-estrella'
              }`}
            >
              {etiqueta}
            </button>
          );
        })}
      </div>

      {PESTANAS.map(({ rol }) => (
        <motion.div
          key={rol}
          role="tabpanel"
          id={`${base}-panel-${rol}`}
          aria-labelledby={`${base}-pestana-${rol}`}
          hidden={rol !== activa}
          // Al activarse, el panel viene de opacity 0 (donde quedó mientras estaba
          // oculto) y sube 6 px; `initial={false}` evita animar en la primera carga.
          initial={false}
          animate={rol === activa ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          transition={{ duration: duracion, ease: 'easeOut' }}
          className="mt-5"
        >
          {paneles[rol]}
        </motion.div>
      ))}
    </div>
  );
}
