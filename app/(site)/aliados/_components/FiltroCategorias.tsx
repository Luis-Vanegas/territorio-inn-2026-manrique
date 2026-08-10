import Link from 'next/link';
import type { Categoria } from '@/lib/db/portafolios.repo';

/**
 * Filtro por categoría.
 *
 * Son <Link> y no botones con estado de cliente: el filtro vive en la URL
 * (?categoria=moda), así se puede compartir, volver atrás con el navegador y
 * el server hace la consulta filtrada. Cero JavaScript de por medio.
 */

export function FiltroCategorias({
  categorias,
  conteos,
  activa,
  total,
}: {
  categorias: Categoria[];
  conteos: Record<string, number>;
  activa?: string;
  total: number;
}) {
  // Una categoría sin emprendimientos aprobados solo ofrece un callejón sin
  // salida: se muestran únicamente las que tienen algo detrás.
  const conResultados = categorias.filter((c) => (conteos[c.id] ?? 0) > 0);

  if (conResultados.length === 0) return null;

  const estilo = (seleccionada: boolean) =>
    [
      'inline-flex items-baseline gap-1.5 border px-3 py-1.5 font-mono text-xs transition-colors',
      seleccionada
        ? 'border-terracota bg-terracota text-hueso'
        : 'border-tinta/15 text-tinta/65 hover:border-terracota hover:text-terracota',
    ].join(' ');

  return (
    <nav aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
      <Link
        href="/aliados"
        className={estilo(!activa)}
        aria-current={!activa ? 'page' : undefined}
      >
        Todos
        <span className="opacity-60">{total}</span>
      </Link>

      {conResultados.map((c) => (
        <Link
          key={c.id}
          href={`/aliados?categoria=${c.id}`}
          className={estilo(activa === c.id)}
          aria-current={activa === c.id ? 'page' : undefined}
        >
          {c.nombre}
          <span className="opacity-60">{conteos[c.id]}</span>
        </Link>
      ))}
    </nav>
  );
}
