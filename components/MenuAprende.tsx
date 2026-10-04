'use client';

// «Aprende ▾»: el desplegable del menú con Formalización, Marca y Ventas.
//
// Es un botón con aria-expanded (no un enlace ni un hover): abre con Enter,
// Espacio o la flecha hacia abajo; cierra con Esc (y el foco vuelve al botón),
// con un clic afuera o cuando el foco sale del panel. En el menú ☰ del móvil es
// el mismo botón, pero el panel se despliega en línea (`enLinea`) en vez de
// flotar, porque ya está dentro de otro panel.
//
// La animación (fade corto con framer-motion) se salta con «menos movimiento».
// El panel solo existe tras un clic, así que nada visible depende de JS.

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useId, useRef, useState } from 'react';

export type EnlaceMenu = { href: string; etiqueta: string };

export function MenuAprende({
  enlaces,
  pathname,
  enLinea = false,
  claseBoton,
}: {
  enlaces: EnlaceMenu[];
  pathname: string;
  enLinea?: boolean;
  claseBoton: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const idPanel = useId();
  const menosMovimiento = useReducedMotion();

  // Al navegar, el panel se cierra: el header vive en el layout y no se desmonta.
  const [rutaVista, setRutaVista] = useState(pathname);
  if (rutaVista !== pathname) {
    setRutaVista(pathname);
    setAbierto(false);
  }

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abierto]);

  function alTeclear(e: React.KeyboardEvent) {
    if (e.key === 'Escape' && abierto) {
      e.stopPropagation();
      setAbierto(false);
      boton.current?.focus();
    }
  }

  // Con la flecha hacia abajo el foco va al primer enlace, pero el panel recién
  // existe tras el render: se enfoca desde el efecto, no en el manejador.
  const enfocarAlAbrir = useRef(false);
  useEffect(() => {
    if (abierto && enfocarAlAbrir.current) {
      raiz.current?.querySelector<HTMLElement>('ul a')?.focus();
    }
    enfocarAlAbrir.current = false;
  }, [abierto]);

  function abrirYEnfocar() {
    enfocarAlAbrir.current = true;
    setAbierto(true);
  }

  return (
    <div
      ref={raiz}
      className={enLinea ? 'flex flex-col' : 'relative'}
      onKeyDown={alTeclear}
      onBlur={(e) => {
        // Sin relatedTarget (clic en Safari, que no enfoca enlaces) no se cierra: el clic llega solo.
        const destino = e.relatedTarget as Node | null;
        if (abierto && destino && !raiz.current?.contains(destino)) setAbierto(false);
      }}
    >
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={() => setAbierto((a) => !a)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            abrirYEnfocar();
          }
        }}
        className={`${claseBoton} ${enLinea ? 'w-full justify-between text-left' : 'gap-1.5'}`}
      >
        Aprende
        <span
          aria-hidden="true"
          className={`inline-block text-xs transition-transform ${abierto ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.ul
            id={idPanel}
            initial={menosMovimiento ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={menosMovimiento ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: menosMovimiento ? 0 : 0.15, ease: 'easeOut' }}
            className={
              enLinea
                ? 'ml-3 flex flex-col border-l border-tinta/12'
                : 'absolute left-0 top-full z-50 mt-1 flex w-64 flex-col border border-tinta/12 bg-hueso p-2 shadow-[0_4px_20px_rgb(11_16_38/0.08)]'
            }
          >
            {enlaces.map((e) => {
              const esta = pathname.startsWith(e.href);
              return (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    aria-current={esta ? 'page' : undefined}
                    className={`inline-flex min-h-[44px] w-full items-center px-3 font-sans text-base transition-colors hover:bg-tinta/[0.04] hover:text-morado-texto ${
                      esta ? 'font-medium text-tinta underline decoration-azul decoration-2 underline-offset-8' : 'text-tinta/75'
                    }`}
                  >
                    {e.etiqueta}
                  </Link>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
