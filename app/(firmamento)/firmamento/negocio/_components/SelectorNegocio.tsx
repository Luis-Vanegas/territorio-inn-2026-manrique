import { elegirNegocio } from '@/lib/actions/elegirNegocio';
import type { NegocioCuenta } from '@/lib/firmamento/negocio';

/**
 * Selector de negocio: solo aparece si la cuenta tiene más de uno. Cada botón es
 * un envío del formulario (funciona sin JavaScript) que fija la cookie
 * `negocio_activo`; `aria-pressed` marca el activo y el texto lleva el estado,
 * así no depende del color. Objetivos de 44 px.
 */
export function SelectorNegocio({
  negocios,
  actual,
}: {
  negocios: NegocioCuenta[];
  actual: NegocioCuenta;
}) {
  if (negocios.length < 2) return null;

  return (
    <form action={elegirNegocio} aria-label="Elegir negocio" className="mb-6">
      <p className="font-sans text-sm text-tenue">Tienes {negocios.length} negocios. ¿Con cuál quieres trabajar?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {negocios.map((n) => {
          const activo = n.id === actual.id;
          return (
            <button
              key={n.id}
              type="submit"
              name="negocio"
              value={n.id}
              aria-pressed={activo}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 font-sans text-sm transition-colors ${
                activo
                  ? 'border-sodio bg-noche-activa font-medium text-estrella'
                  : 'border-trazo-2 text-tenue hover:bg-noche-3 hover:text-estrella'
              }`}
            >
              {activo && <span aria-hidden="true" className="text-sodio">✓</span>}
              {n.nombre}
            </button>
          );
        })}
      </div>
    </form>
  );
}
