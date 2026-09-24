'use client';

import { useId, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { Asesor } from '@/components/Asesor';
import type { EstadoAsesor } from '@/lib/validation/asesor.schema';

/**
 * Botón redondo abajo a la derecha que abre el asesor desde cualquier página.
 *
 * Solo se monta con sesión (vecino o moderador): lo decide app/(site)/layout.tsx,
 * que además elige la action. Eso es presentación — cada action revalida la
 * sesión por su cuenta.
 *
 * `<dialog>` modal por lo mismo que VisorLaminas y FotoAmpliable: foco
 * atrapado, Escape y devolución del foco sin código propio. El Asesor queda
 * montado aunque el panel esté cerrado, así la última respuesta sigue ahí si
 * la persona lo cierra para mirar algo y vuelve a abrirlo.
 */
export function AsesorFlotante({
  accion,
  descripcion,
}: {
  accion: (anterior: EstadoAsesor, formData: FormData) => Promise<EstadoAsesor>;
  descripcion: string;
}) {
  const pathname = usePathname();
  const idTitulo = useId();
  const dialogo = useRef<HTMLDialogElement>(null);

  // La ficha del negocio ya trae el asesor en la página: dos cajas iguales
  // en la misma pantalla confunden más de lo que ayudan.
  if (pathname.startsWith('/aliados/estado/')) return null;

  const cerrar = () => dialogo.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogo.current?.showModal()}
        aria-label="Abrir el asesor: pregunta sobre trámites y apoyos"
        title="Asesor de formalización"
        className="fixed bottom-4 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-azul-texto text-hueso shadow-lg ring-4 ring-hueso transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-azul sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
      >
        {/* Burbuja de conversación con un destello: "alguien que te responde". */}
        <svg viewBox="0 0 24 24" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" aria-hidden="true">
          <path
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3h8A2.5 2.5 0 0 1 17 5.5v6a2.5 2.5 0 0 1-2.5 2.5H9l-4 3.5V14h-.5A.5.5 0 0 1 4 13.5v-8Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M19 11.5v3a2.5 2.5 0 0 1-2.5 2.5H13l3 3v-3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            opacity=".55"
          />
          <path d="M10.5 6l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7.7-1.6Z" fill="currentColor" />
        </svg>
      </button>

      <dialog
        ref={dialogo}
        aria-labelledby={idTitulo}
        onClick={(e) => e.target === dialogo.current && cerrar()}
        // Móvil: hoja a lo ancho desde abajo. Escritorio: panel pegado al botón.
        // `inset-auto` anula el centrado del <dialog> modal para poder anclarlo.
        className="inset-auto bottom-0 left-0 right-0 m-0 max-h-[88dvh] w-full max-w-none border border-tinta/20 bg-hueso p-0 text-tinta shadow-2xl backdrop:bg-tinta/40 sm:bottom-24 sm:left-auto sm:right-6 sm:w-[26rem]"
      >
        <div className="flex max-h-[88dvh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-tinta/15 px-5 py-3">
            <div>
              <p className="font-sans text-xs uppercase tracking-wider text-morado-texto">Asesor</p>
              <h2 id={idTitulo} className="font-display text-lg font-medium leading-tight">
                ¿En qué te ayudo?
              </h2>
            </div>
            <button
              type="button"
              onClick={cerrar}
              className="inline-flex min-h-[44px] shrink-0 items-center border border-tinta/40 px-4 font-sans text-sm transition-colors hover:border-azul-texto hover:text-azul-texto"
            >
              Cerrar <span aria-hidden="true">&nbsp;✕</span>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-4">
            <Asesor accion={accion} descripcion={descripcion} variante="panel" />
          </div>
        </div>
      </dialog>
    </>
  );
}
