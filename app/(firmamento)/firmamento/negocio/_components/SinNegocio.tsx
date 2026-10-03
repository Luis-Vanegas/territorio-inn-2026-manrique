import Link from 'next/link';

import { Tarjeta, CLASE_BOTON_PRIMARIO } from '@/components/firmamento/panel/Tarjeta';

/**
 * Estado vacío de una cuenta sin negocio vivo (nunca registró uno, o borró el
 * único). Es honesto: dice qué falta y ofrece el paso, sin cifras de ejemplo.
 */
export function SinNegocio({ aviso }: { aviso: string }) {
  return (
    <Tarjeta titulo="Aún no tienes un negocio en la red" id="sin-negocio" className="max-w-xl">
      <p className="font-sans text-base leading-relaxed text-tinta/70">{aviso}</p>
      <Link href="/aliados/registro" className={`${CLASE_BOTON_PRIMARIO} mt-5`}>
        Registrar mi negocio
      </Link>
    </Tarjeta>
  );
}
