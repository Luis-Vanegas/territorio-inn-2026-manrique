import { Estrella } from './Estrella';

/**
 * Bloque de cifras y mapas de los paneles. Se llamaba «ventana de noche», pero
 * Luis (4-oct) pidió los paneles enteros con los colores del tema, como la
 * portada: ya no prende `.modo-noche`, solo enmarca con `tinta/12`. Lo de adentro
 * (`Kpi`, `Tarjeta`, `BarrasCategoria`) trae sus variantes de día y de noche, así
 * que sigue al selector de tema sin tocar cada pantalla.
 * ponytail: se conserva el nombre para no tocar los 10 archivos que lo importan.
 *
 * Con `titulo` es una `section` con su h2; sin él, un `div` (la página ya
 * nombra lo que hay adentro).
 */
export function VentanaNoche({
  titulo,
  id,
  descripcion,
  accion,
  pie,
  children,
  className = '',
}: {
  titulo?: string;
  /** Id del título; obligatorio si hay `titulo`. */
  id?: string;
  /** Una frase bajo el título: qué se está mirando. */
  descripcion?: React.ReactNode;
  /** Un enlace al lado del título («Ver el Firmamento»). */
  accion?: React.ReactNode;
  /** Lo que va debajo: una línea de fuente, una nota. */
  pie?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const Etiqueta = titulo ? 'section' : 'div';
  return (
    <Etiqueta
      aria-labelledby={titulo ? id : undefined}
      className={`min-w-0 rounded-2xl border border-tinta/12 px-4 py-5 sm:px-6 sm:py-6 ${className}`}
    >
      {titulo && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 id={id} className="flex items-center gap-2.5 font-display text-xl font-medium leading-snug text-tinta">
              <Estrella tamano={16} color="currentColor" className="shrink-0 text-morado" />
              {titulo}
            </h2>
            {descripcion && <p className="mt-1 max-w-2xl font-sans text-sm leading-relaxed text-tinta/70">{descripcion}</p>}
          </div>
          {accion}
        </div>
      )}
      {children}
      {pie && <div className="mt-4 font-sans text-xs leading-relaxed text-tinta/70">{pie}</div>}
    </Etiqueta>
  );
}
