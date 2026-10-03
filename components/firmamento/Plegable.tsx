'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState, useSyncExternalStore } from 'react';

const sinSuscripcion = () => () => {};

/**
 * Bloque que se pliega: un `<details>` nativo con el despliegue animado.
 *
 * Lo usan `Tarjeta plegable` (paneles y guías de /formalizacion) y el menú de
 * roles de la puerta. Es la única pieza plegable del sitio: no escribas otra.
 *
 * ── Sin JavaScript ──
 * Antes de hidratar el contenido está en el HTML dentro del `<details>`, así que
 * el navegador lo abre y lo cierra solo (y lo encuentra con Ctrl+F, y lo abre al
 * llegar por un `#ancla` que cae adentro). `aria-expanded` no se escribe en el
 * HTML del servidor: sin JS quedaría desactualizado al primer toque, y el
 * `<details>` ya anuncia su estado.
 *
 * ── Con JavaScript ──
 * El `summary` toma el control (`preventDefault`): al abrir, el contenido entra
 * con un fundido y 6 px de desplazamiento; al cerrar sale con un fundido y recién
 * entonces se cierra el `<details>`. Solo `opacity` y `transform` (DESIGN.md ›
 * Movimiento), así que no se anima la altura: el alto cambia de una, el contenido
 * llega suave. Con menos movimiento, todo es directo.
 *
 * `name` agrupa varios como acordeón exclusivo (uno abierto a la vez), con el
 * atributo nativo del `<details>`: el navegador cierra los otros y su `toggle`
 * sincroniza el estado.
 *
 * `ancla`: el `id` del contenido. Después de hidratar, un plegable cerrado no
 * tiene su contenido en el DOM, así que el navegador ya no puede abrirlo solo al
 * llegar por `#ancla`; lo hace el efecto de abajo.
 */
export function Plegable({
  resumen,
  children,
  abierto: inicial = false,
  name,
  ancla,
  className,
  claseResumen,
  claseContenido,
}: {
  /** Lo que va dentro del `<summary>`: el título y, si hace falta, un conteo. Nada interactivo. */
  resumen: React.ReactNode;
  children: React.ReactNode;
  /** Abierto en el HTML del servidor. */
  abierto?: boolean;
  name?: string;
  ancla?: string;
  className?: string;
  claseResumen?: string;
  claseContenido?: string;
}) {
  const [abierto, setAbierto] = useState(inicial);
  const [saliendo, setSaliendo] = useState(false);
  // false en el HTML del servidor y en la hidratación; true después, en el cliente.
  const hidratado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const reducir = useReducedMotion();

  useEffect(() => {
    if (!ancla) return;
    const revisar = () => {
      if (window.location.hash !== `#${ancla}`) return;
      setAbierto(true);
      requestAnimationFrame(() => document.getElementById(ancla)?.scrollIntoView({ block: 'start' }));
    };
    revisar();
    window.addEventListener('hashchange', revisar);
    return () => window.removeEventListener('hashchange', revisar);
  }, [ancla]);

  const duracion = reducir ? 0 : 0.2;

  return (
    <details
      name={name}
      open={abierto || saliendo}
      onToggle={(e) => {
        // Cambios que no hizo el summary: el acordeón exclusivo cerró este, o el
        // navegador lo abrió (búsqueda en la página, ancla).
        const nativo = e.currentTarget.open;
        if (!nativo && (abierto || saliendo)) {
          setAbierto(false);
          setSaliendo(false);
        } else if (nativo && !abierto && !saliendo) {
          setAbierto(true);
        }
      }}
      className={className}
    >
      <summary
        aria-expanded={hidratado ? abierto : undefined}
        onClick={(e) => {
          e.preventDefault();
          if (abierto) {
            setAbierto(false);
            setSaliendo(true);
          } else {
            setSaliendo(false);
            setAbierto(true);
          }
        }}
        className={`cursor-pointer list-none [&::-webkit-details-marker]:hidden ${claseResumen ?? ''}`}
      >
        {resumen}
      </summary>

      {/* Antes de hidratar el contenido va siempre (lo muestra o esconde el
          navegador); después, solo abierto. La misma `key` evita que se vuelva a
          montar al hidratar. */}
      <AnimatePresence initial={false} onExitComplete={() => setSaliendo(false)}>
        {(abierto || !hidratado) && (
          <motion.div
            key="contenido"
            id={ancla}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: reducir ? 0 : 0.12 } }}
            transition={{ duration: duracion, ease: 'easeOut' }}
            className={`scroll-mt-40 ${claseContenido ?? ''}`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </details>
  );
}
