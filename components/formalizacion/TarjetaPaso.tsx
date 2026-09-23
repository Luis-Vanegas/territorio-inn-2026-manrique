import { ETIQUETA_TIPO, type PasoFormalizacion } from '@/lib/formalizacion';
import { IconoTipoPaso } from './IconoTipoPaso';

/** Con más de esto, los requisitos se colapsan en un `<details>` para que la
 *  tarjeta no crezca más que el resto de la fila. */
const UMBRAL_REQUISITOS_COLAPSADOS = 3;

/**
 * Una tarjeta de trámite/apoyo/formación. Compartida entre la vista estática
 * de page.tsx y RutasPersonalizadas: antes eran dos copias del mismo JSX que
 * había que tocar dos veces con cada cambio de diseño.
 */
export function TarjetaPaso({ paso }: { paso: PasoFormalizacion }) {
  const requisitosLargos = paso.requisitos.length > UMBRAL_REQUISITOS_COLAPSADOS;

  return (
    <li className="flex h-full flex-col border border-tinta/12 p-5 transition-colors hover:border-azul">
      <div className="flex items-center gap-1.5 text-morado-texto">
        <IconoTipoPaso tipo={paso.tipo} className="h-4 w-4 shrink-0" />
        <span className="font-mono text-xs uppercase tracking-wider">
          {ETIQUETA_TIPO[paso.tipo]}
        </span>
      </div>

      <h3 className="mt-2 font-display text-lg font-medium leading-tight text-tinta">
        {paso.titulo}
      </h3>

      <p className="mt-0.5 font-mono text-xs text-tinta/60">{paso.entidad}</p>

      <p className="mt-2 font-sans text-sm leading-relaxed text-tinta/70">{paso.resumen}</p>

      <div className="mt-3">
        {requisitosLargos ? (
          // Nativo, sin JS: mismo patrón que ModuloDesplegable pero a escala
          // de tarjeta — acá no hace falta el +/− ni el conteo aparte.
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 font-mono text-xs text-tinta/60 underline decoration-azul/40 underline-offset-4 [&::-webkit-details-marker]:hidden">
              Necesitas tener ({paso.requisitos.length})
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3 shrink-0 transition-transform group-open:rotate-180"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <ul className="mt-2 space-y-1">
              {paso.requisitos.map((requisito) => (
                <li key={requisito} className="font-sans text-sm text-tinta/70">
                  · {requisito}
                </li>
              ))}
            </ul>
          </details>
        ) : (
          <>
            <p className="font-mono text-xs text-tinta/60">Necesitas tener:</p>
            <ul className="mt-1 space-y-1">
              {paso.requisitos.map((requisito) => (
                <li key={requisito} className="font-sans text-sm text-tinta/70">
                  · {requisito}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* mt-auto pega el bloque de enlace al piso: las tarjetas de una misma
          fila tienen textos de distinto largo y sin esto cada una queda a una
          altura diferente. */}
      <div className="mt-auto pt-4">
        <a
          href={paso.fuente}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 border border-azul-texto/40 px-3 py-1.5 font-mono text-xs text-azul-texto transition-colors hover:border-azul-texto"
        >
          Ver en la página oficial
          <span aria-hidden="true">↗</span>
        </a>
        <p className="mt-2 font-mono text-xs text-tinta/60">
          Enlace verificado el {paso.verificadoEn}
        </p>
      </div>
    </li>
  );
}
