import type { ReactNode } from 'react';

/**
 * Sección de contenido plegable — `<details>` nativo, cero JavaScript.
 *
 * Mismo lenguaje que ya usa `AccesoPorEnlace` (+/− en vez de una flecha: acá
 * se expande contenido, no se abre un menú de navegación, y esa distinción ya
 * existe en el sistema — MenuUsuario usa flecha justo porque es lo otro).
 *
 * ── Por qué existe ──
 *
 * /formalizacion mostraba cada trámite, apoyo, tipo de formación y video
 * siempre desplegado: para ver el catálogo completo había que bajar toda la
 * página. Plegado por módulo, la persona ve de entrada de qué se trata cada
 * uno y abre solo el que le interesa.
 *
 * ── Por qué el `id` va en el contenido y no en `<details>` ──
 *
 * `/mi-cuenta` enlaza directo a "#videos". Los navegadores modernos expanden
 * automáticamente un `<details>` cerrado cuando el fragmento de la URL cae
 * DENTRO de su contenido oculto — pero solo si el elemento con ese `id` está
 * genuinamente oculto. Puesto en el `<details>` mismo no serviría: el
 * `<summary>` siempre es visible, así que el navegador no tendría nada que
 * revelar y el link llegaría a un acordeón cerrado.
 */
export function ModuloDesplegable({
  titulo,
  cantidad,
  abierto,
  id,
  children,
}: {
  titulo: string;
  /** Se muestra al lado del título, sin más adorno que el número — ya se ve qué cuenta por el título mismo. */
  cantidad?: number;
  /** Abierto de entrada. Sin esto, cada módulo arranca cerrado. */
  abierto?: boolean;
  id?: string;
  children: ReactNode;
}) {
  return (
    <details open={abierto} className="group mt-6 border-t border-tinta/12 pt-6 first:mt-0">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
        <span className="flex items-baseline gap-3">
          <h2 className="font-display text-2xl font-medium text-tinta sm:text-3xl">{titulo}</h2>
          {cantidad !== undefined && (
            <span className="font-mono text-xs text-tinta/45">{cantidad}</span>
          )}
        </span>

        {/* aria-hidden: <details> ya anuncia su estado al lector de pantalla. */}
        <span className="shrink-0 font-mono text-xl text-tinta/40" aria-hidden="true">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">−</span>
        </span>
      </summary>

      <div id={id} className="mt-8">
        {children}
      </div>
    </details>
  );
}
