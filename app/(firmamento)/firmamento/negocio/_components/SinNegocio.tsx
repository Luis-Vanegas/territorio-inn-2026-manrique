import Link from 'next/link';

import { Estrella } from '@/components/firmamento/Estrella';

/**
 * Estado vacío de una cuenta sin negocio vivo (nunca registró uno, o borró el
 * único). Es honesto: dice qué falta y ofrece el paso, sin cifras de ejemplo.
 */
export function SinNegocio({ aviso }: { aviso: string }) {
  return (
    <section aria-labelledby="sin-negocio" className="max-w-xl rounded-xl border border-trazo bg-noche-2 p-6 sm:p-8">
      <Estrella tamano={22} />
      <h2 id="sin-negocio" className="mt-4 font-display text-3xl font-medium text-estrella">
        Aún no tienes un negocio en la red
      </h2>
      <p className="mt-3 font-sans text-base leading-relaxed text-tenue">{aviso}</p>
      <Link
        href="/aliados/registro"
        className="mt-6 inline-flex min-h-[44px] items-center rounded-lg bg-sodio px-5 py-2 font-sans text-sm font-medium text-noche"
      >
        Registrar mi negocio
      </Link>
    </section>
  );
}
