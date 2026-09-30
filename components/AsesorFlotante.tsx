'use client';

import { useId, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { Asesor, IconoAgente } from '@/components/Asesor';
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
        <IconoAgente className="h-7 w-7 sm:h-8 sm:w-8" />
      </button>

      <dialog
        ref={dialogo}
        aria-labelledby={idTitulo}
        onClick={(e) => e.target === dialogo.current && cerrar()}
        // Móvil: pantalla completa, que con el teclado abierto es lo único
        // que deja ver la conversación. Escritorio: panel a todo el alto
        // pegado a la derecha. `inset-0` + `max-*-none` anulan el centrado y
        // los topes que el navegador le pone al <dialog> modal.
        className="inset-0 m-0 h-dvh max-h-none w-full max-w-none border-tinta/15 bg-hueso p-0 text-tinta shadow-2xl backdrop:bg-tinta/40 sm:left-auto sm:w-[28rem] sm:border-l"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-tinta/15 px-4 py-3 sm:px-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-azul-texto text-hueso">
              <IconoAgente className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={idTitulo} className="font-display text-lg font-medium leading-tight">
                Asesor de formalización
              </h2>
              <p className="font-sans text-xs text-tinta/60">Trámites, apoyos y formación</p>
            </div>
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar el asesor"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-tinta/70 transition-colors hover:bg-tinta/[0.06] hover:text-tinta"
            >
              <span aria-hidden="true" className="font-sans text-xl">✕</span>
            </button>
          </div>

          <Asesor accion={accion} descripcion={descripcion} variante="panel" />
        </div>
      </dialog>
    </>
  );
}
