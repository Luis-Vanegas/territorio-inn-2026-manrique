/**
 * Índice pegajoso con las letras griegas (docs/plan-diseno-2026-10.md §8).
 * Queda justo bajo el encabezado del sitio (64 px en móvil, 72 desde `sm`).
 * En pantallas angostas se desplaza hacia los lados DENTRO de su barra (no la
 * página); cada enlace mide 44 px de alto.
 */
export type EntradaIndice = { id: string; letra: string; nombre: string };

export function IndiceSecciones({ entradas }: { entradas: EntradaIndice[] }) {
  return (
    <nav
      aria-label="Secciones de Firmamento"
      className="sticky top-16 z-40 border-b border-trazo bg-noche/95 backdrop-blur sm:top-[4.5rem]"
    >
      <ul className="margen-editorial flex gap-1 overflow-x-auto py-1.5">
        {entradas.map((e) => (
          <li key={e.id} className="shrink-0">
            <a
              href={`#${e.id}`}
              className="inline-flex min-h-[44px] items-center gap-2 px-3 font-sans text-sm text-tenue transition-colors hover:bg-noche-3 hover:text-estrella"
            >
              <span aria-hidden="true" className="font-italica text-xl leading-none text-sodio">
                {e.letra}
              </span>
              {e.nombre}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
