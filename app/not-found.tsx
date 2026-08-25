// 404 del sitio. Vale tanto para una URL mal tipeada como para los `notFound()`
// que ya dispara el código: los módulos detrás de un flag apagado
// (/servicios, /inventario-predictivo) devuelven 404 real a propósito, y hasta
// hoy caían en la pantalla default de Next.
//
// Server Component: no necesita estado ni handlers, así que no paga el "use client".

import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="seccion flex min-h-[70vh] flex-col justify-center">
      <span className="font-mono text-xs tracking-[0.2em] text-terracota">
        404
      </span>

      <h1 className="mt-4 max-w-3xl font-display text-5xl font-medium leading-[0.95] text-tinta sm:text-7xl">
        Esta página no existe.
      </h1>

      <p className="mt-6 max-w-lg font-sans text-lg leading-relaxed text-tinta/70">
        Puede que el enlace esté mal escrito, o que sea un módulo que todavía no
        abrimos al público.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          href="/"
          className="border border-terracota bg-terracota px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-terracota"
        >
          Volver al inicio
        </Link>

        <Link
          href="/aliados"
          className="font-mono text-sm text-tinta/55 underline decoration-terracota underline-offset-4 hover:text-terracota"
        >
          Ver el mapa de Aliados
        </Link>
      </div>
    </main>
  );
}
