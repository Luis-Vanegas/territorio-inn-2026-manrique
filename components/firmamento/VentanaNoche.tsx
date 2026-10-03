import { Estrella } from './Estrella';

/**
 * Una «ventana» de noche dentro de una página de día (DESIGN.md › Firmamento con
 * sesión): el día es para hacer cosas y la noche para leer datos, así que las
 * bandas de cifras y los mapas van aquí y el resto de la página sigue de día.
 *
 * Es la misma noche que la banda de la portada (`MetricasSection`): fondo
 * `noche`, título en Fraunces `estrella` con la estrella `sodio`. `.modo-noche`
 * redefine `hueso`/`tinta`, así que lo de adentro (`Kpi`, `Tarjeta`, el mapa)
 * toma la paleta de noche sin clases propias, y el foco pasa a `sodio`. No sigue
 * el selector de tema: es noche también con el sitio en claro.
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
      className={`modo-noche min-w-0 rounded-2xl px-4 py-5 sm:px-6 sm:py-6 ${className}`}
    >
      {titulo && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 id={id} className="flex items-center gap-2.5 font-display text-xl font-medium leading-snug text-estrella">
              <Estrella tamano={16} className="shrink-0" />
              {titulo}
            </h2>
            {descripcion && <p className="mt-1 max-w-2xl font-sans text-sm leading-relaxed text-tenue">{descripcion}</p>}
          </div>
          {accion}
        </div>
      )}
      {children}
      {pie && <div className="mt-4 font-sans text-xs leading-relaxed text-tenue">{pie}</div>}
    </Etiqueta>
  );
}
