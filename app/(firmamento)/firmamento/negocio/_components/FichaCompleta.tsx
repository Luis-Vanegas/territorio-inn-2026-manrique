import type { PasoFicha } from '@/lib/firmamento/ficha';

/**
 * Barra «Tu ficha está al N %». Es un `meter` con su valor en texto: la barra
 * es refuerzo, el porcentaje está escrito. Estático (no hay movimiento que
 * respetar).
 */
export function BarraFicha({ porcentaje }: { porcentaje: number }) {
  return (
    <div>
      <p className="font-sans text-base font-medium text-tinta">
        Tu ficha está al <span className="tabular-nums">{porcentaje} %</span>
      </p>
      <div
        role="meter"
        aria-label="Qué tan completa está tu ficha"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentaje}
        aria-valuetext={`${porcentaje} por ciento`}
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-tinta/5"
      >
        <div className="h-full rounded-full bg-azul-texto" style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
}

/**
 * Lista de lo que suma a la ficha. Cada paso dice si está hecho con un símbolo y
 * con texto («Listo» / «Falta»), no solo con el color de la marca.
 */
export function ChecklistFicha({ pasos }: { pasos: PasoFicha[] }) {
  return (
    <ul className="divide-y divide-tinta/12">
      {pasos.map((p) => (
        <li key={p.id} className="flex items-start gap-3 py-3">
          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm ${
              p.hecho ? 'border-azul text-azul-texto' : 'border-azul text-azul-texto'
            }`}
          >
            {p.hecho ? '✓' : '+'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-sans text-base text-tinta">
              {p.etiqueta}
              <span className="sr-only">{p.hecho ? ': listo' : ': falta'}</span>
            </span>
            {!p.hecho && <span className="mt-0.5 block font-sans text-sm leading-snug text-tinta/70">{p.ayuda}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
