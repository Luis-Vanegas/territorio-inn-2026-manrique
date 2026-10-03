import { grupoDeCategoria } from '@/lib/categorias/grupos';
import { svgForma } from '@/components/mapa/formas';
import type { DatosAbiertos } from '@/lib/db/datos.repo';
import { fechaLarga } from '@/lib/geo/constelaciones';
import { CELDA_PEQUENA } from '@/lib/privacidad/kAnonimato';

/**
 * Cómo se reparte la red por categoría. Sale de `por_categoria` de los datos
 * abiertos, ya con la regla k = 5 y la celda complementaria: lo que se ve acá es
 * lo mismo que publica `/api/datos`.
 *
 * Cada fila lleva la FORMA de su grupo (DESIGN.md › Categorías): el color solo la
 * refuerza. La barra de una celda «<5» queda vacía a propósito: dibujarla con un
 * largo revelaría el número que se escondió.
 */
export function ComposicionRed({ datos }: { datos: DatosAbiertos | null }) {
  const fuente = 'Constelaciones · Manrique, aliados aprobados por moderación (datos abiertos, regla k = 5)';

  if (!datos) {
    return (
      <div className="border border-trazo bg-noche-2 p-5">
        <h2 className="font-sans text-lg font-medium text-estrella">Composición de la red</h2>
        <p role="status" className="mt-3 font-sans text-base leading-relaxed text-tenue">
          No pudimos consultar la red en este momento. Vuelve a intentarlo en unos minutos.
        </p>
      </div>
    );
  }

  const filas = datos.por_categoria;
  const ocultas = filas.filter((f) => f.negocios === CELDA_PEQUENA).length;
  const maximo = Math.max(1, ...filas.map((f) => (typeof f.negocios === 'number' ? f.negocios : 0)));

  return (
    <div className="border border-trazo bg-noche-2 p-5">
      <h2 className="font-sans text-lg font-medium text-estrella">Composición de la red</h2>
      <p className="mt-2 font-sans text-sm leading-relaxed text-tenue">
        {filas.length} categorías activas
        {ocultas > 0 ? `; ${ocultas} salen como «${CELDA_PEQUENA}»` : ''}. Una celda con menos de 5 negocios
        no muestra su número, para que nadie pueda reconocer a una persona (Ley 1581 de 2012).
      </p>

      <ul className="mt-4">
        {filas.map((f) => {
          const grupo = grupoDeCategoria(f.id);
          const oculta = f.negocios === CELDA_PEQUENA;
          return (
            <li key={f.id} className="border-b border-trazo py-2.5 last:border-b-0">
              <div className="flex items-baseline justify-between gap-4 font-sans text-sm text-estrella">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-flex shrink-0 self-center"
                    dangerouslySetInnerHTML={{ __html: svgForma(grupo, 16) }}
                  />
                  <span className="min-w-0 break-words">{f.nombre}</span>
                </span>
                <span className="shrink-0 font-cifra tabular-nums text-sodio">
                  {f.negocios}
                  {oculta && <span className="sr-only"> (menos de 5 negocios)</span>}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 bg-noche-3" aria-hidden="true">
                {!oculta && (
                  <div
                    className="h-full"
                    style={{ width: `${(Number(f.negocios) / maximo) * 100}%`, backgroundColor: grupo.color }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 font-cifra text-xs leading-relaxed text-tenue">
        Fuente: {fuente} · consultado el {fechaLarga(datos.generado_en)}
      </p>
    </div>
  );
}
