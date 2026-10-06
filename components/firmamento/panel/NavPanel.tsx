'use client';

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

import { gruposDe, itemActual, NAV, type ItemNav, type RolFirmamento } from '@/lib/firmamento/navegacion';
import { Insignia } from './Pestanas';

/**
 * Menú de los paneles de Firmamento (solo con sesión: el sitio público no lo
 * usa). Dos presentaciones de la MISMA lista, que sale de `gruposDe`:
 *
 * - `NavLateral`: columna fija a la izquierda desde `lg`, con los grupos del
 *   equipo (Hoy, Red, Datos, Guías) como encabezados.
 * - `NavMovil`: bajo `lg`, un botón con ícono (☰) que abre la misma lista en un
 *   cajón desde la izquierda. Se cierra con Escape, con el fondo o al navegar.
 *
 * Lo que depende de la ruta actual (ítem activo y título) es lo único del
 * armazón que necesita JavaScript de cliente (`usePathname`), así que vive aquí
 * y `PanelShell` sigue siendo de servidor. En el HTML del servidor ya sale todo
 * marcado: la ruta se conoce al renderizar.
 *
 * `insignias` va por `href` (p. ej. «moderación: 5 pendientes»).
 */
type Insignias = Record<string, number>;

function ListaNav({
  rol,
  insignias,
  actual,
  raya,
}: {
  rol: RolFirmamento;
  insignias: Insignias;
  actual: ItemNav;
  /** `layoutId` de la marca del activo: distinto por presentación para que no salte entre las dos. */
  raya: string;
}) {
  const reducir = useReducedMotion();
  const grupo = useId();
  return (
    <LayoutGroup id={grupo}>
      <div className="flex flex-col gap-5">
        {gruposDe(rol).map((g) => (
          <div key={g.titulo ?? g.items[0]!.href}>
            {g.titulo && (
              // Mayúsculas: etiqueta corta de sección (DESIGN.md › Tipografía).
              <p className="mb-1 px-3 font-sans text-xs font-medium uppercase tracking-wider text-tinta/60">
                {g.titulo}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {g.items.map((it) => {
                const activo = it === actual; // una página oculta (el registro) no marca ninguna
                const n = insignias[it.href];
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={activo ? 'page' : undefined}
                      className={`relative flex min-h-[44px] items-center gap-2 rounded-lg px-3 font-sans text-[15px] transition-colors ${
                        activo ? 'bg-tinta/[0.06] font-medium text-tinta' : 'text-tinta/75 hover:bg-tinta/5 hover:text-tinta'
                      }`}
                    >
                      {activo && (
                        <motion.span
                          layoutId={raya}
                          aria-hidden="true"
                          transition={reducir ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }}
                          className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-azul"
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate">{it.etiqueta}</span>
                      {n ? <Insignia n={n} unidad={it.unidad} /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </LayoutGroup>
  );
}

function useActual(rol: RolFirmamento) {
  return itemActual(usePathname(), NAV[rol]);
}

/** Columna izquierda del panel desde `lg`. `PanelShell` la oculta bajo `lg`. */
export function NavLateral({ rol, insignias = {} }: { rol: RolFirmamento; insignias?: Insignias }) {
  const actual = useActual(rol);
  return (
    <nav aria-label="Secciones del panel">
      <ListaNav rol={rol} insignias={insignias} actual={actual} raya="raya-lateral" />
    </nav>
  );
}

/** Botón ☰ y cajón del menú bajo `lg`. Muestra un punto si hay pendientes. */
export function NavMovil({ rol, insignias = {} }: { rol: RolFirmamento; insignias?: Insignias }) {
  const ruta = usePathname();
  const actual = itemActual(ruta, NAV[rol]);
  const reducir = useReducedMotion();
  // Se guarda la ruta donde se abrió: al navegar ya no coincide y el cajón se cierra solo.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const abierto = abiertoEn === ruta;
  const setAbierto = (si: boolean) => setAbiertoEn(si ? ruta : null);
  const cerrar = useRef<HTMLButtonElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const cajon = useRef<HTMLDivElement>(null);
  const idCajon = useId();
  const pendientes = Object.values(insignias).reduce((t, n) => t + n, 0);

  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cerrar.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbiertoEn(null);
      if (e.key !== 'Tab' || !cajon.current) return;
      // aria-modal no atrapa el foco: sin esto, Tab sale del cajón al panel tapado.
      const focos = cajon.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      const primero = focos[0];
      const ultimo = focos[focos.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo?.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero?.focus();
      }
    };
    document.addEventListener('keydown', alTeclear);
    const botonMenu = boton.current;
    return () => {
      document.body.style.overflow = previo;
      document.removeEventListener('keydown', alTeclear);
      botonMenu?.focus();
    };
  }, [abierto]);

  const transicion = reducir ? { duration: 0 } : { type: 'tween' as const, duration: 0.22, ease: 'easeOut' as const };

  return (
    <>
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls={idCajon}
        onClick={() => setAbierto(true)}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-tinta/15 text-tinta hover:bg-tinta/5"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <span className="sr-only">Abrir el menú{pendientes ? ` (${pendientes} pendientes)` : ''}</span>
        {pendientes > 0 && (
          <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-amarillo ring-2 ring-hueso" />
        )}
      </button>

      <AnimatePresence>
        {abierto && (
          <div className="fixed inset-0 z-50">
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 bg-tinta/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transicion}
              onClick={() => setAbierto(false)}
            />
            <motion.div
              ref={cajon}
              id={idCajon}
              role="dialog"
              aria-modal="true"
              aria-label="Menú del panel"
              className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col overflow-y-auto bg-hueso px-3 pb-8 pt-4 shadow-xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={transicion}
            >
              <div className="mb-4 flex items-center justify-between px-3">
                <p className="font-display text-lg font-medium text-tinta">Menú</p>
                <button
                  ref={cerrar}
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-tinta hover:bg-tinta/5"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                  <span className="sr-only">Cerrar el menú</span>
                </button>
              </div>
              <nav aria-label="Secciones del panel">
                <ListaNav rol={rol} insignias={insignias} actual={actual} raya="raya-movil" />
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/** El título de la sección actual: el único h1 del panel. */
export function TituloPanel({ rol }: { rol: RolFirmamento }) {
  const actual = useActual(rol);
  return (
    <h1 className="break-words font-display text-3xl font-medium leading-tight text-tinta sm:text-4xl">
      {actual.etiqueta}
    </h1>
  );
}
