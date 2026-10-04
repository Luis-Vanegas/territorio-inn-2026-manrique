import Link from 'next/link';

/**
 * «Únete como aliado»: la salida del tablero público hacia el registro. Va dos
 * veces en `/firmamento`: un botón bajo el titular (`cabecera`) y una banda al
 * final (`cierre`), después de que la persona vio los datos. Sodio con texto
 * `noche` (12:1), 44 px de alto. Es un enlace, no un botón: navega.
 */

const BOTON =
  'inline-flex min-h-[44px] items-center justify-center gap-2 bg-sodio px-6 font-sans text-base font-medium text-noche transition-opacity hover:opacity-90';

export function CtaAliado({ variante }: { variante: 'cabecera' | 'cierre' }) {
  if (variante === 'cabecera') {
    return (
      <Link href="/firmamento/negocio/registro" className={`${BOTON} mt-6`}>
        Únete como aliado
        <span aria-hidden="true">→</span>
      </Link>
    );
  }

  return (
    <section aria-labelledby="cta-aliado-titulo" className="margen-editorial py-12 sm:py-16">
      <div className="border border-trazo bg-noche-2 p-6 sm:p-10">
        <h2
          id="cta-aliado-titulo"
          className="max-w-2xl font-display text-3xl font-medium leading-[1.1] text-estrella sm:text-4xl"
        >
          Tu negocio también es una estrella
        </h2>
        <p className="mt-3 max-w-2xl font-sans text-base leading-relaxed text-tenue">
          Cuantos más negocios de Manrique se registren, más completo queda este cielo y más fácil es que
          lleguen apoyos a tu cuadra. Una persona del equipo revisa cada registro antes de publicarlo.
        </p>
        <Link href="/firmamento/negocio/registro" className={`${BOTON} mt-6`}>
          Únete como aliado
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
