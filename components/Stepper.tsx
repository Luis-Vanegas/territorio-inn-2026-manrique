'use client';

import { useId, type ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * Formulario por pasos.
 *
 * Adaptado —no copiado— de React Bits (reactbits.dev/components/stepper). El
 * original usa píldoras redondeadas, sombras y círculos numerados; acá la
 * numeración va en JetBrains Mono con bordes finos, que es el lenguaje del
 * resto del sitio (ver docs/decisiones-diseno.md). Se usa `framer-motion`, que
 * ya estaba instalado: React Bits importa de `motion/react`, que es el mismo
 * paquete renombrado y con la misma API — cero dependencias nuevas.
 *
 * ── La decisión que importa ──
 *
 * TODOS los pasos quedan montados en el DOM; los inactivos se ocultan con el
 * atributo `hidden`. Es tentador desmontarlos para "ahorrar", y es un bug:
 * un input desmontado no existe para el FormData, así que al enviar se
 * perderían en silencio todas las respuestas de los pasos que no están a la
 * vista. Ocultar en vez de desmontar también evita que el foco por teclado
 * caiga en un campo invisible — `hidden` lo saca del orden de tabulación.
 *
 * Por eso mismo, los campos NO llevan `required` de HTML: un control inválido
 * y oculto hace que el navegador aborte el submit con "not focusable" y sin
 * mensaje útil. La validación real es Zod, del lado del servidor y del
 * cliente, con el mismo schema.
 */

export type Paso = {
  titulo: string;
  ayuda?: string;
  contenido: ReactNode;
};

export function Stepper({
  pasos,
  actual,
  onCambiar,
  pie,
}: {
  pasos: Paso[];
  actual: number;
  onCambiar: (indice: number) => void;
  pie: ReactNode;
}) {
  const idBase = useId();

  return (
    <div>
      {/* Indicador. Es una lista de botones reales, no adornos: quien ya llenó
          el paso 3 y quiere corregir el 1 no debería tener que retroceder de
          a uno. */}
      <nav aria-label="Pasos del formulario">
        <ol className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-tinta/12 pb-5">
          {pasos.map((paso, i) => {
            const esActual = i === actual;
            const yaPaso = i < actual;

            return (
              <li key={paso.titulo}>
                <button
                  type="button"
                  onClick={() => onCambiar(i)}
                  aria-current={esActual ? 'step' : undefined}
                  className="group flex items-baseline gap-2 text-left"
                >
                  <span
                    className={`font-mono text-xs tabular-nums transition-colors ${
                      esActual
                        ? 'text-terracota'
                        : yaPaso
                          ? 'text-tinta/65'
                          : 'text-tinta/35'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`font-sans text-sm transition-colors ${
                      esActual
                        ? 'text-tinta'
                        : 'text-tinta/45 group-hover:text-tinta/75'
                    }`}
                  >
                    {paso.titulo}
                  </span>
                </button>

                {esActual && (
                  // layoutId hace que la línea se deslice de un paso al otro
                  // en vez de desaparecer y reaparecer.
                  <motion.div
                    layoutId={`${idBase}-marca`}
                    className="mt-2 h-px bg-terracota"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* aria-live: quien usa lector de pantalla tiene que enterarse de que
          cambió el paso, porque visualmente es obvio y para él no. */}
      <p className="sr-only" aria-live="polite">
        Paso {actual + 1} de {pasos.length}: {pasos[actual]?.titulo}
      </p>

      <div className="mt-10">
        {pasos.map((paso, i) => (
          <div key={paso.titulo} hidden={i !== actual}>
            <motion.div
              // NO lleva `key` con el paso actual, y esto es lo importante de
              // todo el componente: una key que cambia desmonta y vuelve a
              // montar el nodo, y con él se van los valores de todos los
              // inputs no controlados — o sea, lo que la persona escribió en
              // los otros pasos. Se envía un formulario vacío y el servidor
              // responde "escribí tu nombre" sobre un campo que está lleno.
              //
              // La animación se consigue con `animate`, que interpola sobre el
              // MISMO nodo cuando cambia el paso activo. `initial={false}`
              // evita que los cuatro pasos animen a la vez en el primer render.
              initial={false}
              animate={i === actual ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              // Corta: 0.25s. Una transición larga en un formulario se vuelve
              // un peaje que se paga en cada paso.
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <h2 className="font-display text-3xl font-medium leading-tight text-tinta">
                {paso.titulo}
              </h2>
              {paso.ayuda && (
                <p className="mt-2 max-w-xl font-sans text-sm leading-relaxed text-tinta/60">
                  {paso.ayuda}
                </p>
              )}
              <div className="mt-8">{paso.contenido}</div>
            </motion.div>
          </div>
        ))}
      </div>

      <div className="mt-12 border-t border-tinta/12 pt-6">{pie}</div>
    </div>
  );
}
