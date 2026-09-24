'use client';

import Image from 'next/image';
import { useId, useRef, useState, type ReactNode } from 'react';

/**
 * Envuelve una foto en un botón que la abre en grande.
 *
 * Mismo criterio que VisorLaminas: `<dialog>` nativo (foco atrapado, Escape y
 * devolución del foco gratis), la imagen grande solo se monta con el visor
 * abierto y el scroll de atrás lo bloquea `body:has(dialog[open])` en
 * styles/globals.css. No se reutiliza VisorLaminas porque ese habla de
 * "láminas" y pagina; esto es una sola foto de cualquier origen (incluidas
 * las de Blob, de las que no guardamos ancho/alto — por eso `fill` +
 * `object-contain` en un marco fijo).
 *
 * `className` va al botón y reemplaza al contenedor que tenía la miniatura,
 * así cada lugar conserva su layout tal cual.
 */
export function FotoAmpliable({
  src,
  alt,
  className = '',
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  children: ReactNode;
}) {
  const idTitulo = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [abierto, setAbierto] = useState(false);

  const cerrar = () => {
    setAbierto(false);
    dialogo.current?.close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setAbierto(true);
          dialogo.current?.showModal();
        }}
        className={`cursor-zoom-in ${className}`}
      >
        {children}
        <span className="sr-only">Ampliar foto</span>
        {/* Visible siempre, no solo en hover: en el celular no hay hover y la
            persona tiene que saber que la foto se puede tocar. */}
        <span
          aria-hidden="true"
          className="absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center border border-tinta/15 bg-hueso/90 text-tinta"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4M11 8v6M8 11h6" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      <dialog
        ref={dialogo}
        aria-labelledby={idTitulo}
        onClose={() => setAbierto(false)}
        onClick={(e) => e.target === dialogo.current && cerrar()}
        className="m-auto w-[min(96vw,72rem)] max-w-none border border-tinta/20 bg-hueso p-0 text-tinta backdrop:bg-tinta/75"
      >
        <div className="flex items-center justify-between gap-4 border-b border-tinta/15 px-4 py-3">
          <h2 id={idTitulo} className="min-w-0 truncate font-sans text-sm text-tinta/70">
            {alt}
          </h2>
          <button
            type="button"
            onClick={cerrar}
            className="inline-flex min-h-[44px] shrink-0 items-center border border-tinta/40 px-4 font-sans text-sm text-tinta transition-colors hover:border-azul-texto hover:text-azul-texto"
          >
            Cerrar <span aria-hidden="true">&nbsp;✕</span>
          </button>
        </div>

        <div className="relative h-[80dvh] bg-tinta/[0.04]">
          {abierto && (
            <Image src={src} alt={alt} fill sizes="96vw" className="object-contain" />
          )}
        </div>
      </dialog>
    </>
  );
}
