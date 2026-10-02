import type { ConvocatoriaParaTi } from '@/lib/db/convocatorias.repo';
import { fechaLarga } from '@/lib/geo/constelaciones';

/**
 * «Para ti»: convocatorias que un moderador aprobó, que siguen abiertas y que
 * aplican a la categoría de tus negocios. Cada una dice quién la publica y dónde
 * se encontró (fuente): el sitio no las inventa ni las garantiza, las reúne.
 */
export function ParaTi({ convocatorias }: { convocatorias: ConvocatoriaParaTi[] }) {
  return (
    <section aria-labelledby="para-ti" className="mt-16 border-t border-tinta/12 pt-10">
      <h2 id="para-ti" className="font-sans text-xs uppercase tracking-wider text-tinta/60">
        Para ti
      </h2>
      <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-tinta/65">
        Convocatorias abiertas que encajan con tu negocio. Las revisa una persona del equipo
        antes de mostrártelas; confirma siempre los requisitos en el sitio de quien convoca.
      </p>

      {convocatorias.length === 0 ? (
        <p className="mt-6 max-w-xl font-sans leading-relaxed text-tinta/70">
          Por ahora no hay convocatorias abiertas para ti. Cuando aparezca una, la mostramos aquí.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {convocatorias.map((c) => (
            <li key={c.id} className="flex flex-col border border-tinta/12 p-6">
              <h3 className="font-display text-lg font-medium leading-snug text-tinta">
                {c.titulo}
              </h3>
              <p className="mt-1 font-sans text-sm text-tinta/70">{c.entidad}</p>

              {c.resumen && (
                <p className="mt-3 font-sans text-sm leading-relaxed text-tinta/70">{c.resumen}</p>
              )}

              <p className="mt-4 font-sans text-sm text-tinta/80">
                {c.fecha_cierre ? (
                  <>
                    Cierra el <span className="font-cifra tabular-nums">{fechaLarga(c.fecha_cierre)}</span>
                  </>
                ) : (
                  'Sin fecha de cierre publicada'
                )}
              </p>
              <p className="mt-1 font-sans text-xs text-tinta/60">Fuente: {c.fuente}</p>

              <div className="mt-auto pt-5">
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-sm text-azul-texto underline decoration-azul underline-offset-4"
                >
                  Ver la convocatoria →
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
