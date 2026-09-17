import type { PasoFormalizacion } from '@/lib/formalizacion';

/**
 * Una tarjeta de trámite/apoyo/formación. Compartida entre la vista estática
 * de page.tsx y RutasPersonalizadas: antes eran dos copias del mismo JSX que
 * había que tocar dos veces con cada cambio de diseño.
 */
export function TarjetaPaso({ paso }: { paso: PasoFormalizacion }) {
  return (
    <li className="flex h-full flex-col border border-tinta/12 p-6 transition-colors hover:border-terracota">
      <h3 className="font-display text-xl font-medium text-tinta">{paso.titulo}</h3>

      <p className="mt-1 font-mono text-xs text-tinta/45">{paso.entidad}</p>

      <p className="mt-3 font-sans leading-relaxed text-tinta/70">{paso.resumen}</p>

      <div className="mt-4">
        <p className="font-mono text-xs text-tinta/45">Necesitas tener:</p>
        <ul className="mt-2 space-y-1">
          {paso.requisitos.map((requisito) => (
            <li key={requisito} className="font-sans text-sm text-tinta/70">
              · {requisito}
            </li>
          ))}
        </ul>
      </div>

      {/* mt-auto pega el enlace al piso: las tarjetas de una misma fila
          tienen textos de distinto largo y sin esto cada enlace queda a una
          altura diferente. */}
      <div className="mt-auto pt-6">
        <a
          href={paso.fuente}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-terracota-texto underline decoration-terracota underline-offset-4"
        >
          Ver en la página oficial ↗
        </a>
        <p className="mt-2 font-mono text-xs text-tinta/35">
          Enlace verificado el {paso.verificadoEn}
        </p>
      </div>
    </li>
  );
}
