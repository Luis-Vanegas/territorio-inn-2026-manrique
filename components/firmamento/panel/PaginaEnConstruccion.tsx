import Link from 'next/link';

import { NAV, type RolFirmamento } from '@/lib/firmamento/navegacion';
import { Estrella } from '../Estrella';

/**
 * Estado vacío honesto de una sección que todavía no existe: dice que no está
 * lista y no rellena el espacio con cifras ni ejemplos. Su contenido es de la
 * Ola 2 (docs/plan-firmamento-2026-10.md); cuando una sección se construya, su
 * `page.tsx` reemplaza a este componente. El título de la página (h1) lo pone la
 * barra superior del panel, por eso aquí el encabezado es un h2.
 */
export function PaginaEnConstruccion({ titulo, rol }: { titulo: string; rol: RolFirmamento }) {
  const inicio = NAV[rol][0]!;

  return (
    <section
      aria-labelledby="titulo-construccion"
      className="max-w-xl rounded-xl border border-trazo bg-noche-2 p-6 sm:p-8"
    >
      <Estrella tamano={22} />
      <h2 id="titulo-construccion" className="mt-4 font-display text-3xl font-medium text-estrella">
        En construcción
      </h2>
      <p className="mt-3 font-sans text-base leading-relaxed text-tenue">
        «{titulo}» todavía no está lista. Cuando lo esté, la encontrarás aquí con
        datos reales; mientras tanto no mostramos cifras de ejemplo.
      </p>

      {titulo !== inicio.etiqueta && (
        <Link
          href={inicio.href}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-lg border border-trazo-2 px-4 font-sans text-sm text-estrella hover:bg-noche-3"
        >
          Volver al inicio del panel
        </Link>
      )}
    </section>
  );
}
