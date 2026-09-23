'use client';

import Image from 'next/image';
import { useId, useRef, useState } from 'react';

import type { Lamina } from '@/lib/marca';

/**
 * Visor de la lámina original que hizo el equipo.
 *
 * ── Por qué existe ──
 *
 * Las guías se recrearon en la página como texto real (se lee en cualquier
 * pantalla, con lector de pantalla, sin zoom). Pero la lámina es el material
 * que el equipo diseñó, y a veces alguien la quiere ver tal cual, compararla
 * con la versión de la página o guardarla para mandarla por WhatsApp. Este
 * visor es ese atajo: un botón, la lámina, y listo.
 *
 * ── Por qué `<dialog>` nativo ──
 *
 * `showModal()` atrapa el foco, cierra con Escape y devuelve el foco al botón
 * que lo abrió, sin una línea de JavaScript nuestro (docs/sistema-diseno-a11y.md,
 * sección 5). La imagen solo se monta con el visor abierto: mientras está
 * cerrado no cuesta ni un byte de red.
 *
 * Es un componente de cliente porque `showModal()` es una API del navegador;
 * lo demás de /marca sigue siendo de servidor.
 *
 * ── La variante `miniaturas` ──
 *
 * GuiaMarca quiere las láminas visibles de entrada, no escondidas detrás de
 * un botón de texto. En vez de un visor aparte, esta variante pinta una
 * grilla de imágenes reales que abren el mismo `<dialog>` en la lámina que
 * tocaste: un solo modal para todo /marca, cero lógica duplicada.
 */

const ESTILO_BOTON: Record<'boton' | 'enlace', string> = {
  boton:
    'border border-azul-texto px-5 text-azul-texto transition-colors hover:bg-azul-texto hover:text-hueso',
  enlace: 'text-azul-texto underline decoration-azul underline-offset-4',
};

const ESTILO_ACCION =
  'inline-flex min-h-[44px] items-center border border-tinta/40 px-4 font-mono text-sm text-tinta transition-colors hover:border-azul-texto hover:text-azul-texto disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-tinta/40 disabled:hover:text-tinta';

export function VisorLaminas({
  titulo,
  laminas,
  variante = 'boton',
}: {
  titulo: string;
  laminas: Lamina[];
  variante?: 'boton' | 'enlace' | 'miniaturas';
}) {
  const idTitulo = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const cuerpo = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [actual, setActual] = useState(0);

  const total = laminas.length;
  const lamina = laminas[actual];

  if (!lamina) return null;

  // Cerrar por el botón o por el fondo actualiza el estado acá mismo. El evento
  // `close` del <dialog> cubre Escape, pero no se depende de él para lo demás.
  // El scroll de la página de atrás lo bloquea CSS (`body:has(dialog[open])`,
  // styles/globals.css): sigue al atributo `open`, no a un estado que pueda
  // desincronizarse.
  const cerrar = () => {
    setAbierto(false);
    dialogo.current?.close();
  };

  const ir = (n: number) => {
    setActual(Math.min(Math.max(n, 0), total - 1));
    // La lámina nueva arranca desde arriba, no a la altura donde quedó la anterior.
    cuerpo.current?.scrollTo({ top: 0 });
  };

  const abrirEn = (n: number) => {
    setActual(n);
    setAbierto(true);
    dialogo.current?.showModal();
  };

  return (
    <>
      {variante === 'miniaturas' ? (
        <ul role="list" className="grid list-none grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {laminas.map((l, i) => (
            <li key={l.src}>
              <button
                type="button"
                onClick={() => abrirEn(i)}
                className="group relative block aspect-[3/4] w-full overflow-hidden border border-tinta/15 bg-tinta/[0.04]"
              >
                {/* object-contain: son infografías con texto, no fotos — object-cover
                    en un marco 3:4 fijo se come el texto de las láminas apaisadas
                    (crea-contenido, ~1.78) y recorta los bordes de las verticales. */}
                <Image
                  src={l.src}
                  alt={`Miniatura ${i + 1} de ${total} de la guía «${titulo}»`}
                  fill
                  sizes="(min-width: 1024px) 18vw, (min-width: 640px) 22vw, 30vw"
                  className="object-contain transition-transform group-hover:scale-105"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <button
          type="button"
          onClick={() => abrirEn(0)}
          className={`inline-flex min-h-[44px] items-center gap-2 font-mono text-sm ${ESTILO_BOTON[variante]}`}
        >
          Ver la lámina original{total > 1 && ` (${total})`}
        </button>
      )}

      <dialog
        ref={dialogo}
        aria-labelledby={idTitulo}
        onClose={() => setAbierto(false)}
        // Clic en el fondo oscuro = cerrar. El panel de adentro ocupa todo el
        // <dialog>, así que solo el ::backdrop llega con `target` = el <dialog>.
        onClick={(e) => e.target === dialogo.current && cerrar()}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') ir(actual + 1);
          if (e.key === 'ArrowLeft') ir(actual - 1);
        }}
        className="m-auto w-[min(96vw,64rem)] max-w-none border border-tinta/20 bg-hueso p-0 text-tinta backdrop:bg-tinta/75"
      >
        <div className="flex max-h-[94dvh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-tinta/15 px-4 py-3 sm:px-6">
            <h2 id={idTitulo} className="font-display text-lg font-medium sm:text-xl">
              {titulo}
            </h2>
            <button
              type="button"
              onClick={cerrar}
              className={ESTILO_ACCION}
            >
              Cerrar <span aria-hidden="true">&nbsp;✕</span>
            </button>
          </div>

          <div ref={cuerpo} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-tinta/[0.04] p-3 sm:p-6">
            {abierto && (
              <Image
                key={lamina.src}
                // Solo se monta porque la persona pidió verla: no hay nada que diferir.
                priority
                src={lamina.src}
                alt={`Lámina original${total > 1 ? ` ${actual + 1} de ${total}` : ''} de la guía «${titulo}»`}
                width={lamina.ancho}
                height={lamina.alto}
                sizes="(min-width: 1024px) 960px, 96vw"
                className={`mx-auto h-auto w-full border border-tinta/15 ${
                  lamina.ancho > lamina.alto ? 'max-w-5xl' : 'max-w-3xl'
                }`}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-tinta/15 px-4 py-3 sm:px-6">
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => ir(actual - 1)}
                  disabled={actual === 0}
                  className={ESTILO_ACCION}
                >
                  ← Anterior
                </button>
                {/* aria-live: al cambiar de lámina, el lector de pantalla anuncia dónde está. */}
                <p aria-live="polite" className="font-mono text-sm text-tinta/70">
                  Lámina {actual + 1} de {total}
                </p>
                <button
                  type="button"
                  onClick={() => ir(actual + 1)}
                  disabled={actual === total - 1}
                  className={ESTILO_ACCION}
                >
                  Siguiente →
                </button>
              </>
            )}

            <span className="flex flex-wrap gap-3 sm:ml-auto">
              {/* `download` funciona porque la imagen es del mismo origen. */}
              <a href={lamina.src} download className={ESTILO_ACCION}>
                Descargar
              </a>
              {/* En el celular, abrirla aparte es la forma de ampliarla con los dedos. */}
              <a
                href={lamina.src}
                target="_blank"
                rel="noopener noreferrer"
                className={ESTILO_ACCION}
              >
                Abrir y ampliar ↗
              </a>
            </span>
          </div>
        </div>
      </dialog>
    </>
  );
}
