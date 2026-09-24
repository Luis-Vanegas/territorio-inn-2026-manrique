import Link from 'next/link';

/**
 * Filtro por estado de las colas de moderación (aliados, peticiones, empleo).
 * Es navegación por `?estado=` y no pestañas de cliente: la página es de
 * servidor y cada estado es una URL que se puede compartir o recargar.
 */
export function PestanasEstado<T extends string>({
  ruta,
  estados,
  activo,
  conteos,
}: {
  ruta: string;
  estados: readonly { id: T; etiqueta: string }[];
  activo: T;
  conteos: Record<T, number>;
}) {
  return (
    <nav aria-label="Filtrar por estado" className="mt-8 flex flex-wrap gap-2">
      {estados.map((e) => {
        const esActivo = e.id === activo;
        return (
          <Link
            key={e.id}
            href={`${ruta}?estado=${e.id}`}
            aria-current={esActivo ? 'page' : undefined}
            className={[
              'inline-flex items-baseline gap-1.5 border px-3 py-1.5 font-sans text-xs transition-colors',
              esActivo
                ? 'border-azul-texto bg-azul-texto text-hueso'
                : 'border-tinta/15 text-tinta/65 hover:border-azul-texto hover:text-azul-texto',
            ].join(' ')}
          >
            {e.etiqueta}
            <span className="opacity-60">{conteos[e.id]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
