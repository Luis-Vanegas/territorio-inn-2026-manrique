import { svgForma } from '@/components/mapa/formas';
import type { Grupo } from '@/lib/categorias/grupos';
import { PALETA_NOCHE } from '@/lib/paleta';
import { CELDA_PEQUENA } from '@/lib/privacidad/kAnonimato';

/**
 * Barras horizontales: la única implementación del sitio (composición de la red,
 * categorías de OSM, resumen del equipo, estadísticas, F1 del modelo, barrios).
 *
 * - **No depende del color**: cada fila con grupo lleva la FORMA de su grupo
 *   (DESIGN.md › Categorías) y el número escrito; la barra solo lo refuerza.
 * - **Celda «<5»** (regla k = 5): el número sale como «<5» y la barra queda
 *   VACÍA. Dibujarla con un largo revelaría el valor que se escondió.
 * - **Lector de pantalla**: la lista visible va `aria-hidden` y en su lugar se
 *   lee una tabla con `caption`, dentro de un `<div className="sr-only">`. El
 *   contenedor es necesario: una `<table>` con `sr-only` directa pierde su
 *   semántica de tabla en algunos navegadores.
 * - Sin movimiento: no hay nada que animar ni que dependa de JavaScript.
 *
 * Usa los tokens `tinta` / `hueso`, que `.modo-noche` redefine: se ve bien en
 * una ventana de noche y en un panel de día. Sin `use client`: lo renderizan
 * tanto el servidor como componentes de cliente.
 */

export type FilaBarra = {
  id: string;
  nombre: string;
  /** Un conteo, una medida, o «<5» para una celda suprimida. */
  valor: number | typeof CELDA_PEQUENA;
  /** Forma y color de su grupo de categoría. Sin grupo: sin forma y barra neutra. */
  grupo?: Grupo;
  /** Pisa el color de la barra (p. ej. la escala del mapa de barrios). */
  color?: string;
  /** Dato corto que acompaña al valor, p. ej. «3 publicados» o «959 locales». */
  nota?: string;
};

const NEUTRO = PALETA_NOCHE['noche-azul'];

/**
 * Pista + relleno, sin texto. La usan las barras y la barra «Tu ficha está al N %»
 * (que pone encima su propio `role="meter"`). `proporcion` va de 0 a 1.
 */
export function PistaBarra({
  proporcion,
  color = NEUTRO,
  redonda = false,
  className = 'h-2',
  children,
}: {
  proporcion: number;
  color?: string;
  redonda?: boolean;
  className?: string;
  /** Marcas encima de la pista (la línea de referencia). */
  children?: React.ReactNode;
}) {
  const p = Math.min(1, Math.max(0, proporcion));
  const forma = redonda ? 'rounded-full' : '';
  return (
    <div className={`relative w-full bg-tinta/10 ${forma} ${className}`} aria-hidden="true">
      <div
        className={`h-full ${forma}`}
        // Con valor positivo, 2 px mínimo: una barra de 0,3 % no debe desaparecer.
        style={{ width: `${p * 100}%`, minWidth: p > 0 ? 2 : 0, backgroundColor: color }}
      />
      {children}
    </div>
  );
}

function formatear(n: number, decimales: number): string {
  return n.toLocaleString('es-CO', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}

export function BarrasCategoria({
  filas,
  descripcion,
  columna,
  encabezado = 'Categoría',
  decimales = 0,
  maximo,
  referencia,
  vacio = 'Todavía no hay datos.',
  className = '',
}: {
  filas: FilaBarra[];
  /** Lo que dice el lector de pantalla al llegar a la tabla (`caption`). */
  descripcion: string;
  /** Encabezado de la columna del valor: «Comercios», «F1», «Aliados». */
  columna: string;
  /** Encabezado de la columna del nombre. */
  encabezado?: string;
  decimales?: number;
  /** Valor al que llega la barra entera; por defecto, el mayor de las filas. */
  maximo?: number;
  /** Línea vertical sobre cada pista (p. ej. el F1 macro) con su explicación escrita. */
  referencia?: { valor: number; etiqueta: string };
  vacio?: string;
  className?: string;
}) {
  if (filas.length === 0) {
    return <p className={`font-sans text-sm leading-relaxed text-tenue ${className}`}>{vacio}</p>;
  }

  const numericos = filas.flatMap((f) => (typeof f.valor === 'number' ? [f.valor] : []));
  const tope = Math.max(maximo ?? Math.max(...numericos, 0), Number.EPSILON);
  const hayNota = filas.some((f) => f.nota);

  return (
    <div className={className}>
      <ul aria-hidden="true" className="space-y-3">
        {filas.map((f) => {
          const oculta = f.valor === CELDA_PEQUENA;
          const n = typeof f.valor === 'number' ? f.valor : 0;
          return (
            <li key={f.id}>
              <div className="flex items-baseline justify-between gap-3 font-sans text-sm text-tinta">
                <span className="flex min-w-0 items-center gap-2">
                  {f.grupo && (
                    <span
                      className="inline-flex shrink-0 self-center"
                      dangerouslySetInnerHTML={{ __html: svgForma(f.grupo, 16) }}
                    />
                  )}
                  <span className="min-w-0 break-words">{f.nombre}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="font-cifra tabular-nums text-tinta">
                    {oculta ? CELDA_PEQUENA : formatear(n, decimales)}
                  </span>
                  {f.nota && <span className="ml-2 text-xs text-tenue">{f.nota}</span>}
                </span>
              </div>
              <PistaBarra
                className="mt-1.5 h-2"
                proporcion={oculta ? 0 : n / tope}
                color={f.color ?? f.grupo?.color ?? NEUTRO}
              >
                {referencia && (
                  <div
                    className="absolute -bottom-0.5 -top-0.5 w-0.5 bg-tinta"
                    style={{ left: `${Math.min(1, referencia.valor / tope) * 100}%` }}
                  />
                )}
              </PistaBarra>
            </li>
          );
        })}
      </ul>

      {referencia && (
        <p className="mt-3 flex items-center gap-2 font-sans text-sm leading-snug text-tenue">
          <span aria-hidden="true" className="inline-block h-3.5 w-0.5 shrink-0 bg-tinta" />
          {referencia.etiqueta}
        </p>
      )}

      <div className="sr-only">
        <table>
          <caption>{descripcion}</caption>
          <thead>
            <tr>
              <th scope="col">{encabezado}</th>
              <th scope="col">{columna}</th>
              {hayNota && <th scope="col">Detalle</th>}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id}>
                <th scope="row">
                  {f.nombre}
                  {f.grupo ? `, grupo ${f.grupo.nombre}, forma de ${f.grupo.formaNombre}` : ''}
                </th>
                <td>{f.valor === CELDA_PEQUENA ? 'menos de 5' : formatear(f.valor, decimales)}</td>
                {hayNota && <td>{f.nota ?? ''}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
