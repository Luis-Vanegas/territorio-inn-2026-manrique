import type { ConvocatoriaParaTi } from '@/lib/db/convocatorias.repo';
import { fechaLarga } from '@/lib/geo/constelaciones';

/**
 * Convocatorias de «Para ti»: aprobadas por una persona del equipo, abiertas y
 * que le aplican a algún negocio de la cuenta. Cada una dice quién la publica,
 * cuándo cierra y dónde se encontró; el sitio las reúne, no las garantiza. Dos
 * acciones de 44 px: «Fuente oficial» (la página de quien convoca) y
 * «Compartir» por WhatsApp (el título, la entidad y el enlace oficial).
 * `max` recorta para la tarjeta del inicio.
 */
function mensajeCompartir(c: ConvocatoriaParaTi): string {
  const cierre = c.fecha_cierre ? ` Cierra el ${fechaLarga(c.fecha_cierre)}.` : '';
  return `Mira esta convocatoria: ${c.titulo}, de ${c.entidad}.${cierre} Más información: ${c.url}`;
}

export function ListaConvocatorias({
  convocatorias,
  max,
  compacta = false,
}: {
  convocatorias: ConvocatoriaParaTi[];
  max?: number;
  /** Una sola columna, para cuando la lista va en media pantalla. */
  compacta?: boolean;
}) {
  const lista = max ? convocatorias.slice(0, max) : convocatorias;

  return (
    <ul className={`grid gap-4 ${compacta ? "" : "lg:grid-cols-2"}`}>
      {lista.map((c) => (
        <li key={c.id} className="flex min-w-0 flex-col rounded-xl border border-tinta/12 bg-tinta/5 p-4 sm:p-5">
          <p className="font-sans text-sm text-tinta/70">
            {c.entidad}
            {c.tema && <> · {c.tema}</>}
          </p>
          <h3 className="mt-1 font-display text-xl font-medium leading-snug text-tinta">{c.titulo}</h3>
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
          <p className="mt-1 font-sans text-xs text-tinta/70 tabular-nums">Fuente: {c.fuente}</p>

          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-tinta/55 px-4 font-sans text-sm text-tinta hover:bg-hueso"
            >
              Fuente oficial
              <span className="sr-only"> de {c.titulo} (se abre en otra pestaña)</span>
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(mensajeCompartir(c))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-tinta/55 px-4 font-sans text-sm text-tinta hover:bg-hueso"
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
