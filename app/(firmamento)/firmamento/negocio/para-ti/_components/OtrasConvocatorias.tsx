import type { ConvocatoriaParaTi } from '@/lib/db/convocatorias.repo';
import { fechaLarga } from '@/lib/geo/constelaciones';

/**
 * «Otras convocatorias abiertas»: aprobadas y vigentes que NO encajan con la
 * categoría o la formalidad de tus negocios. Lista compacta (una fila, un enlace
 * a la fuente oficial): están para que no se pierda una que igual te sirva o que
 * le puedas pasar a un vecino, no para competir con las tuyas.
 */
export function OtrasConvocatorias({ convocatorias }: { convocatorias: ConvocatoriaParaTi[] }) {
  return (
    <ul className="divide-y divide-tinta/12">
      {convocatorias.map((c) => (
        <li key={c.id} className="py-3 first:pt-0 last:pb-0">
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center break-words font-sans text-base text-azul-texto underline underline-offset-4"
          >
            {c.titulo}
            <span className="sr-only"> (fuente oficial, se abre en otra pestaña)</span>
          </a>
          <p className="font-sans text-sm text-tinta/70">
            {c.entidad}
            {' · '}
            {c.fecha_cierre ? (
              <>
                cierra el <span className="tabular-nums">{fechaLarga(c.fecha_cierre)}</span>
              </>
            ) : (
              'sin fecha de cierre publicada'
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}
