import { svgForma } from '@/components/mapa/formas';
import { grupoDeCategoria } from '@/lib/categorias/grupos';
import { CLASES_PROPORCION, claseDeProporcion } from '@/lib/escalaSecuencial';
import { PALETA_NOCHE } from '@/lib/paleta';

/**
 * Matriz de confusión 12 × 12 del sugeridor de categoría, como mapa de calor SVG.
 *
 * Filas = la categoría real; columnas = lo que dijo el modelo. Cada celda se
 * colorea por la PARTE de los locales de esa categoría real que cayó ahí (no por
 * el conteo): así una categoría chica y una grande se leen igual y la diagonal
 * es el recall. El conteo va escrito en la celda; el color solo agrupa.
 *
 * Los ejes llevan números (1–12) y una clave debajo con la forma del grupo de
 * cada categoría: 12 nombres largos no caben en 320 px. El SVG es `aria-hidden`
 * y el lector de pantalla lee una tabla (en un `<div className="sr-only">`, que
 * conserva su semántica) con cada fila en palabras.
 *
 * Los colores salen de `lib/escalaSecuencial.ts`, con 4,5:1 medido para cada
 * número. Sin movimiento. Sin `use client`.
 */

const CELDA = 24;
const MARGEN = 24;
const LADO = MARGEN + CELDA * 12;

type Clase = { id: string; nombre: string; soporte: number };

export function MatrizConfusion({
  clases,
  matriz,
  descripcion,
  confusiones = 3,
}: {
  clases: Clase[];
  /** Filas = real, columnas = predicha. */
  matriz: number[][];
  /** `caption` de la tabla para lector de pantalla. */
  descripcion: string;
  /** Cuántas de las confusiones más grandes se escriben bajo la matriz. */
  confusiones?: number;
}) {
  const nombre = (i: number) => clases[i]?.nombre ?? '';

  const mayores = matriz
    .flatMap((fila, r) =>
      fila.map((n, c) => ({ r, c, n, de: clases[r]?.soporte ?? 0 })).filter((x) => x.r !== x.c && x.n > 0),
    )
    .sort((a, b) => b.n - a.n)
    .slice(0, confusiones);

  return (
    <div>
      <p className="font-sans text-sm leading-relaxed text-tenue">
        Cada fila es la categoría real de un local y cada columna lo que sugirió el modelo. La diagonal
        (con borde) son los aciertos.
      </p>

      <svg
        viewBox={`0 0 ${LADO} ${LADO}`}
        aria-hidden="true"
        focusable="false"
        className="mx-auto mt-3 block h-auto w-full max-w-[34rem]"
      >
        {clases.map((_, i) => (
          <g key={`eje-${i}`} className="font-cifra" fontSize="12" fill={PALETA_NOCHE.tenue}>
            <text x={MARGEN + CELDA * i + CELDA / 2} y={MARGEN / 2 + 4} textAnchor="middle">
              {i + 1}
            </text>
            <text x={MARGEN / 2} y={MARGEN + CELDA * i + CELDA / 2 + 4} textAnchor="middle">
              {i + 1}
            </text>
          </g>
        ))}

        {matriz.map((fila, r) =>
          fila.map((n, c) => {
            const soporte = clases[r]?.soporte || 1;
            const parte = (100 * n) / soporte;
            const clase = claseDeProporcion(parte);
            const x = MARGEN + CELDA * c;
            const y = MARGEN + CELDA * r;
            return (
              <g key={`${r}-${c}`}>
                <title>{`Real: ${nombre(r)}. Sugerido: ${nombre(c)}. ${n} de ${clases[r]?.soporte} locales.`}</title>
                <rect
                  x={x + 0.5}
                  y={y + 0.5}
                  width={CELDA - 1}
                  height={CELDA - 1}
                  fill={clase.relleno}
                  stroke={r === c ? PALETA_NOCHE.estrella : 'none'}
                  strokeWidth={r === c ? 1.5 : 0}
                />
                {n > 0 && (
                  <text
                    x={x + CELDA / 2}
                    y={y + CELDA / 2 + 4}
                    textAnchor="middle"
                    fontSize="12"
                    className="font-cifra"
                    fill={clase.texto}
                  >
                    {n}
                  </text>
                )}
              </g>
            );
          }),
        )}
      </svg>

      <p className="mt-3 font-sans text-sm font-medium text-estrella">Parte de los locales de esa fila</p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 font-sans text-sm text-estrella">
        {CLASES_PROPORCION.map((c) => (
          <li key={c.etiqueta} className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-4 w-6 border border-trazo-2"
              style={{ backgroundColor: c.relleno }}
            />
            {c.etiqueta}
          </li>
        ))}
      </ul>

      <ol className="mt-4 grid gap-x-6 gap-y-1 font-sans text-sm text-estrella sm:grid-cols-2" aria-label="Clave de los números">
        {clases.map((c, i) => (
          <li key={c.id} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-right font-cifra tabular-nums text-tenue">{i + 1}</span>
            <span
              aria-hidden="true"
              className="inline-flex shrink-0"
              dangerouslySetInnerHTML={{ __html: svgForma(grupoDeCategoria(c.id), 14) }}
            />
            <span className="min-w-0 break-words">{c.nombre}</span>
          </li>
        ))}
      </ol>

      {mayores.length > 0 && (
        <>
          <h4 className="mt-5 font-sans text-base font-medium text-estrella">Dónde más se equivoca</h4>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 font-sans text-base leading-relaxed text-estrella marker:text-sodio">
            {mayores.map((m) => (
              <li key={`${m.r}-${m.c}`}>
                Puso <span className="font-cifra tabular-nums">{m.n}</span> de los{' '}
                <span className="font-cifra tabular-nums">{m.de}</span> locales de {nombre(m.r)} en{' '}
                {nombre(m.c)} (<span className="font-cifra tabular-nums">{Math.round((100 * m.n) / (m.de || 1))} %</span>).
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="sr-only">
        <table>
          <caption>{descripcion}</caption>
          <thead>
            <tr>
              <th scope="col">Categoría real</th>
              <th scope="col">Locales</th>
              {clases.map((c, i) => (
                <th key={c.id} scope="col">
                  {`Sugerido ${i + 1}: ${c.nombre}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matriz.map((fila, r) => (
              <tr key={clases[r]?.id ?? r}>
                <th scope="row">{`${r + 1}: ${nombre(r)}`}</th>
                <td>{clases[r]?.soporte}</td>
                {fila.map((n, c) => (
                  <td key={c}>{n}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
