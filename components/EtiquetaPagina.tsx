import type { ReactNode } from 'react';

/**
 * «● tu espacio · …»: el punto azul + la etiqueta que abre una página.
 *
 * `text-sm` (14 px) y no los 12 px que usa el resto del sitio para etiquetas:
 * para quien lee con la vista cansada o desde un celular gama media, 12 px
 * mono se queda corto.
 */
export function EtiquetaPagina({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-sm text-azul-texto">
      <span className="h-1.5 w-1.5 rounded-full bg-azul-texto" aria-hidden="true" />
      {children}
    </span>
  );
}
