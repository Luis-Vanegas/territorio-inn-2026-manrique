'use client';

import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useId, useRef } from 'react';

/**
 * Pestañas por URL del panel (DESIGN.md › Firmamento con sesión). Un solo
 * componente para los dos niveles, así que se leen igual:
 *
 * - `nivel="principal"`: las pestañas del rol, bajo el encabezado del panel.
 * - `nivel="sub"`: las secciones de una pestaña del equipo y las vistas
 *   `?vista=` de una página (`SubPestanas`).
 *
 * Cada pestaña es un enlace (la página es de servidor y cada vista se puede
 * recargar o compartir). Activa = `aria-current`, peso y una raya `azul` que se
 * desliza entre pestañas (`layoutId`), no solo color. Con menos movimiento la
 * raya salta directo. Sin JS la raya está en el HTML del servidor, bajo la
 * activa.
 *
 * En pantallas angostas la fila se desplaza dentro de sí misma (nunca la página)
 * y, al cargar, lleva la pestaña activa a la vista.
 */
export type ItemPestana = {
  href: string;
  texto: string;
  /** Rótulo bajo `sm`, donde no cabe el largo. Debe contener palabras de `texto` (WCAG 2.5.3). */
  corta?: string;
  /** Insignia de lo que espera una decisión (`amarillo`; solo si es mayor que cero). */
  n?: number;
  /** Conteo neutro de lo que hay en la vista («Aprobados 120»): no es un pendiente. */
  cuenta?: number;
  /** Qué cuenta la insignia, para el lector de pantalla. Por defecto «pendientes». */
  unidad?: string;
  activo: boolean;
};

function Insignia({ n, unidad = 'pendientes' }: { n: number; unidad?: string }) {
  return (
    <span className="min-w-[22px] rounded-full bg-amarillo px-1.5 py-0.5 text-center font-sans text-xs font-medium leading-none tabular-nums text-noche">
      {n}
      <span className="sr-only"> {unidad}</span>
    </span>
  );
}

export function BarraPestanas({
  etiqueta,
  items,
  nivel = 'principal',
}: {
  etiqueta: string;
  items: ItemPestana[];
  nivel?: 'principal' | 'sub';
}) {
  const reducir = useReducedMotion();
  const grupo = useId();
  const fila = useRef<HTMLUListElement>(null);
  const principal = nivel === 'principal';

  // La activa a la vista dentro de su fila, sin mover la página en vertical.
  useEffect(() => {
    const ul = fila.current;
    const activa = ul?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!ul || !activa || ul.scrollWidth <= ul.clientWidth) return;
    ul.scrollLeft = activa.offsetLeft - (ul.clientWidth - activa.offsetWidth) / 2;
  }, [items]);

  return (
    <nav aria-label={etiqueta} className={principal ? '' : 'border-b border-tinta/12'}>
      <LayoutGroup id={grupo}>
        <ul
          ref={fila}
          className={`flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            principal ? 'gap-1 sm:gap-2' : 'gap-1'
          }`}
        >
          {items.map((it) => (
            <li key={it.href} className="shrink-0">
              <Link
                href={it.href}
                aria-current={it.activo ? 'page' : undefined}
                className={`relative inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-t-lg font-sans transition-colors focus-visible:[outline-offset:-3px] ${
                  principal ? 'px-3 text-base sm:px-4' : 'px-3 text-sm'
                } ${it.activo ? 'font-medium text-tinta' : 'text-tinta/70 hover:bg-tinta/5 hover:text-tinta'}`}
              >
                {it.corta ? (
                  <>
                    <span className="sm:hidden">{it.corta}</span>
                    <span className="hidden sm:inline">{it.texto}</span>
                  </>
                ) : (
                  it.texto
                )}
                {it.cuenta !== undefined && (
                  <span className="font-sans text-xs tabular-nums text-tinta/70">{it.cuenta}</span>
                )}
                {it.n ? <Insignia n={it.n} unidad={it.unidad} /> : null}
                {it.activo && (
                  <motion.span
                    layoutId="raya"
                    aria-hidden="true"
                    transition={reducir ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }}
                    className={`absolute inset-x-2 bottom-0 rounded-full bg-azul ${principal ? 'h-[3px]' : 'h-[2px]'}`}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </LayoutGroup>
    </nav>
  );
}

/**
 * Vistas de una página por URL (`?vista=`): la API de siempre (`etiqueta` e
 * `items` con `texto`, `n` y `activo`), ahora con el lenguaje de las pestañas.
 * Aquí `n` es lo que hay en la vista (un conteo neutro), no una insignia.
 */
export function SubPestanas({
  etiqueta,
  items,
}: {
  etiqueta: string;
  items: { href: string; texto: string; n?: number; activo: boolean }[];
}) {
  return (
    <BarraPestanas
      etiqueta={etiqueta}
      items={items.map(({ n, ...it }) => ({ ...it, cuenta: n }))}
      nivel="sub"
    />
  );
}
