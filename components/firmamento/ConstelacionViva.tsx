import type { Forma, IdGrupo } from '@/lib/categorias/grupos';
import { GRUPOS } from '@/lib/categorias/grupos';
import { CIELO_VIVO } from '@/lib/firmamento/cieloVivo';
import { PALETA_NOCHE } from '@/lib/paleta';
import { pathEstrella } from '@/components/mapa/formas';
import { AnimadorConstelacion, type VarianteConstelacion } from './AnimadorConstelacion';

/**
 * La Constelación viva (DESIGN.md › Firmamento › Constelación viva): contorno de
 * la Comuna 3, sus 15 barrios, los comercios de OpenStreetMap con la forma y el
 * color de su grupo y las líneas de cada constelación. Es un Server Component:
 * el HTML trae el SVG en su estado FINAL (se ve sin JavaScript) y
 * `AnimadorConstelacion` solo lo coreografía con Anime.js al entrar en pantalla.
 *
 * Cada pieza animable lleva `data-fase`; el CSS de `.cielo-vivo`
 * (styles/globals.css) la oculta solo cuando hay JS y no se pidió menos movimiento.
 */

const R = 3.6;

/** Las 6 formas centradas en (0, 0): se dibujan una vez y cada comercio es un `<use>`. */
const FORMAS: Record<Forma, string> = {
  circulo: `M${-R} 0a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0Z`,
  anillo: `M${-R} 0a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0Z`,
  cuadrado: `M-3.2 -3.2H3.2V3.2H-3.2Z`,
  rombo: `M0 -4.2L4.2 0L0 4.2L-4.2 0Z`,
  triangulo: `M0 -4L4.2 3.4H-4.2Z`,
  cruz: 'M-1.3 -4H1.3V-1.3H4V1.3H1.3V4H-1.3V1.3H-4V-1.3H-1.3Z',
};

const GRUPO = Object.fromEntries(GRUPOS.map((g) => [g.id, g])) as Record<IdGrupo, (typeof GRUPOS)[number]>;

export function ConstelacionViva({
  variante = 'completa',
  className = '',
}: {
  variante?: VarianteConstelacion;
  className?: string;
}) {
  const c = CIELO_VIVO;
  const completa = variante === 'completa';
  const id = (forma: string) => `cv-${variante}-${forma}`;
  const nombres = c.destacadas.map((d) => d.nombre);
  const descripcion = `Mapa de la Comuna 3, Manrique, con sus ${c.conteo.barrios} barrios y ${c.conteo.comercios} comercios mapeados en OpenStreetMap. Los que quedan cerca forman ${c.conteo.constelaciones} constelaciones; las más grandes están en ${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}.`;

  return (
    // El aspect-ratio deja que quien la use fije el ancho (columna) o el alto (franja).
    <AnimadorConstelacion
      variante={variante}
      className={`relative ${className}`}
      style={{ aspectRatio: `${c.ancho} / ${c.alto}` }}
    >
      <svg
        viewBox={`0 0 ${c.ancho} ${c.alto}`}
        className="block h-full w-full"
        {...(completa ? { role: 'img', 'aria-label': descripcion } : { 'aria-hidden': true, focusable: 'false' })}
      >
        <defs>
          {(Object.keys(FORMAS) as Forma[]).map((f) => (
            <path key={f} id={id(f)} d={FORMAS[f]} />
          ))}
        </defs>

        <path data-fase="fondo" d={c.contorno} fill={PALETA_NOCHE['noche-2']} />

        <g fill="none" stroke={PALETA_NOCHE['trazo-2']} strokeWidth={0.75} strokeOpacity={0.7}>
          {c.barrios.map((d, i) => (
            <path key={i} data-fase="barrio" d={d} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          ))}
        </g>

        <path
          data-fase="contorno"
          d={c.contorno}
          fill="none"
          stroke={PALETA_NOCHE.tenue}
          strokeWidth={completa ? 1.5 : 1.25}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        <g fill="none" stroke={PALETA_NOCHE['noche-azul']} strokeOpacity={0.85} strokeWidth={1.25} strokeLinecap="round">
          {c.lineas.map((d, i) => (
            <path key={i} data-fase="linea" d={d} vectorEffect="non-scaling-stroke" />
          ))}
        </g>

        {completa &&
          c.destacadas.map((d) => (
            <g key={d.codigo} data-fase="halo">
              <circle
                className="cielo-vivo__halo"
                cx={d.x}
                cy={d.y}
                r={d.radio}
                fill={PALETA_NOCHE.sodio}
                fillOpacity={0.06}
                stroke={PALETA_NOCHE.sodio}
                strokeOpacity={0.8}
                strokeWidth={1.25}
                vectorEffect="non-scaling-stroke"
              />
              <path d={pathEstrella(d.x, d.y, 7)} fill={PALETA_NOCHE.sodio} />
            </g>
          ))}

        {c.estrellas.map((e, i) => {
          const g = GRUPO[e.grupo];
          const hueca = g.forma === 'anillo';
          return (
            <use
              key={i}
              data-fase="estrella"
              href={`#${id(g.forma)}`}
              x={e.x}
              y={e.y}
              fill={hueca ? 'none' : g.color}
              stroke={hueca ? g.color : undefined}
              strokeWidth={hueca ? 1.6 : undefined}
            />
          );
        })}
      </svg>

      {completa && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {c.destacadas.map((d, i) => (
            <span
              key={d.codigo}
              className={`absolute -translate-x-1/2 -translate-y-[calc(100%+0.6rem)] ${i >= 3 ? 'hidden sm:block' : ''}`}
              style={{ left: `${(d.x / c.ancho) * 100}%`, top: `${((d.y - d.radio) / c.alto) * 100}%` }}
            >
              <span
                data-fase="nombre"
                className="block whitespace-nowrap rounded-full border border-trazo bg-noche/85 px-2.5 py-0.5 font-sans text-xs font-medium text-estrella sm:text-sm"
              >
                {d.nombre}
              </span>
            </span>
          ))}
        </div>
      )}
    </AnimadorConstelacion>
  );
}

/** La línea de fuente de la pieza: va donde el componente se use, debajo del grupo. */
export function fuenteConstelacionViva(): string {
  return `Fuente: © colaboradores de OpenStreetMap (ODbL), datos al ${CIELO_VIVO.fechaOsm}; constelaciones por cercanía (HDBSCAN); barrios: Alcaldía de Medellín.`;
}

export const CONTEO_CONSTELACION_VIVA = CIELO_VIVO.conteo;
