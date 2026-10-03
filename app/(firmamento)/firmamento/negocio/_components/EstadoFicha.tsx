import Link from 'next/link';

import type { EstadoPortafolio } from '@/lib/db/portafolios.repo';

/**
 * Qué pasa con la ficha, dicho con palabras y con una marca de forma distinta
 * por estado (no solo el color del borde). La aprobada solo se anuncia cuando
 * `conAprobada`: en el inicio, lo normal no necesita un aviso.
 */
export function EstadoFicha({
  estado,
  motivo,
  conAprobada = false,
  enlaceFicha = false,
}: {
  estado: EstadoPortafolio;
  motivo: string | null;
  conAprobada?: boolean;
  /** En el inicio el aviso lleva al formulario; en la propia ficha ya está ahí. */
  enlaceFicha?: boolean;
}) {
  if (estado === 'aprobado') {
    if (!conAprobada) return null;
    return (
      <div role="status" className="rounded-xl border border-azul/60 bg-hueso p-4">
        <p className="font-sans text-base font-medium text-tinta">
          <span aria-hidden="true" className="mr-2 text-azul-texto">✓</span>
          Tu ficha está publicada
        </p>
        <p className="mt-1 font-sans text-sm leading-relaxed text-tinta/70">
          Lo que cambies aquí se publica apenas guardes, sin esperar una revisión. El equipo puede
          ajustar algo después si hace falta.
        </p>
      </div>
    );
  }

  if (estado === 'rechazado') {
    return (
      <div role="alert" className="rounded-xl border border-amarillo bg-hueso p-4">
        <p className="font-sans text-base font-medium text-tinta">
          <span aria-hidden="true" className="mr-2 text-morado-texto">!</span>
          No pudimos publicar tu ficha todavía
        </p>
        {motivo && <p className="mt-2 font-sans text-base leading-relaxed text-tinta">{motivo}</p>}
        <p className="mt-2 font-sans text-sm leading-relaxed text-tinta/70">
          Corrige lo que haga falta y guarda: la volvemos a revisar.
        </p>
        {enlaceFicha && (
          <Link
            href="/firmamento/negocio/ficha"
            className="mt-3 inline-flex min-h-[44px] items-center rounded-lg bg-azul-texto px-4 font-sans text-sm font-medium text-hueso"
          >
            Corregir mi ficha
          </Link>
        )}
      </div>
    );
  }

  return (
    <div role="status" className="rounded-xl border border-azul/60 bg-hueso p-4">
      <p className="font-sans text-base font-medium text-tinta">
        <span aria-hidden="true" className="mr-2 text-azul-texto">◔</span>
        Estamos revisando tu ficha
      </p>
      <p className="mt-1 font-sans text-sm leading-relaxed text-tinta/70">
        Apenas la aprobemos aparece en el mapa y empiezas a ver aquí tus números. Mientras tanto
        puedes completarla.
      </p>
    </div>
  );
}
