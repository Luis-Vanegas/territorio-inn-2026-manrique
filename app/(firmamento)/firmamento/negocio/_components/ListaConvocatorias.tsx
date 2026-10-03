import { CLASE_BOTON_PANEL } from '@/components/firmamento/panel/Tarjeta';
import type { ConvocatoriaParaTi } from '@/lib/db/convocatorias.repo';
import { fechaLarga } from '@/lib/geo/constelaciones';

/**
 * Convocatorias de «Para ti»: aprobadas por una persona del equipo, abiertas y
 * que le aplican a algún negocio de la cuenta. Cada una dice quién la publica,
 * cuándo cierra y dónde se encontró; el sitio las reúne, no las garantiza. Dos
 * acciones de 44 px: «Fuente oficial» (la página de quien convoca) y
 * «Compartir» por WhatsApp (el título, la entidad y el enlace oficial).
 * `max` recorta para el inicio.
 *
 * Es una lista de filas dentro de una `Tarjeta` (la página la pone), no una
 * tarjeta por convocatoria: así no hay marcos dentro de marcos.
 */
function mensajeCompartir(c: ConvocatoriaParaTi): string {
  const cierre = c.fecha_cierre ? ` Cierra el ${fechaLarga(c.fecha_cierre)}.` : '';
  return `Mira esta convocatoria: ${c.titulo}, de ${c.entidad}.${cierre} Más información: ${c.url}`;
}

export function ListaConvocatorias({
  convocatorias,
  max,
}: {
  convocatorias: ConvocatoriaParaTi[];
  max?: number;
}) {
  const lista = max ? convocatorias.slice(0, max) : convocatorias;

  return (
    <ul className="divide-y divide-tinta/12">
      {lista.map((c) => (
        <li key={c.id} className="flex min-w-0 flex-col gap-4 py-5 first:pt-0 last:pb-0 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 md:max-w-2xl">
            <p className="font-sans text-sm text-tinta/70">
              {c.entidad}
              {c.tema && <> · {c.tema}</>}
            </p>
            <h3 className="mt-1 break-words font-display text-xl font-medium leading-snug text-tinta">{c.titulo}</h3>
            {c.resumen && <p className="mt-2 font-sans text-sm leading-relaxed text-tinta/70">{c.resumen}</p>}

            <p className="mt-3 font-sans text-sm text-tinta">
              {c.fecha_cierre ? (
                <>
                  Cierra el <span className="tabular-nums">{fechaLarga(c.fecha_cierre)}</span>
                </>
              ) : (
                'Sin fecha de cierre publicada'
              )}
            </p>
            <p className="mt-1 font-sans text-xs text-tinta/70">Fuente: {c.fuente}</p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 md:flex-col">
            <a href={c.url} target="_blank" rel="noopener noreferrer" className={CLASE_BOTON_PANEL}>
              Fuente oficial
              <span className="sr-only"> de {c.titulo} (se abre en otra pestaña)</span>
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(mensajeCompartir(c))}`}
              target="_blank"
              rel="noopener noreferrer"
              className={CLASE_BOTON_PANEL}
            >
              Compartir por WhatsApp
              <span className="sr-only">: {c.titulo} (se abre en otra pestaña)</span>
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
