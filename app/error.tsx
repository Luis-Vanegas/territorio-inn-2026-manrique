"use client";

// Red de contención para cualquier error no manejado dentro de `app/`.
//
// Sin este archivo, la home entera devolvía la pantalla default de Next —
// stack trace en inglés, fondo blanco, cero salida — y la home es justamente
// la ruta más expuesta: es `force-dynamic` y consulta Neon tres veces
// (AliadosDestacado, GaleriaAliados, MetricasSection). Un `fetch failed` del
// pool, un pico de latencia o la base dormida bastaban para tumbarla.
//
// El caso más probable no es un bug del código: es la base momentáneamente
// inalcanzable. Por eso la acción principal es reintentar y no "reportá el
// problema" — el `reset()` de Next vuelve a renderizar el segmento fallido y
// la mayoría de las veces el segundo intento entra.
//
// No hay `global-error.tsx` a propósito: solo cubriría fallas del layout raíz,
// que no hace fetch de datos y no tiene de dónde tirar. Se agrega el día que
// el layout empiece a leer algo.

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // En Vercel esto queda en los logs de la función junto al `digest`, que es
    // el mismo identificador que ve la persona en pantalla: con ese número se
    // encuentra el error exacto sin pedirle a nadie que describa lo que vio.
    console.error("[error]", error.digest ?? "sin digest", error);
  }, [error]);

  return (
    <main className="seccion flex min-h-[70vh] flex-col justify-center">
      <span className="font-mono text-xs tracking-[0.2em] text-terracota">
        ERROR
      </span>

      <h1 className="mt-4 max-w-3xl font-display text-5xl font-medium leading-[0.95] text-tinta sm:text-7xl">
        Algo se rompió de nuestro lado.
      </h1>

      <p className="mt-6 max-w-lg font-sans text-lg leading-relaxed text-tinta/70">
        No es algo que hayas hecho mal. Casi siempre es la base de datos
        tardando en responder — prueba de nuevo en unos segundos.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="button"
          onClick={reset}
          className="border border-terracota bg-terracota px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-terracota"
        >
          Reintentar
        </button>

        <Link
          href="/"
          className="font-mono text-sm text-tinta/55 underline decoration-terracota underline-offset-4 hover:text-terracota"
        >
          Volver al inicio
        </Link>
      </div>

      {error.digest && (
        <p className="mt-12 font-mono text-xs text-tinta/40">
          Código del error: {error.digest}
        </p>
      )}
    </main>
  );
}
