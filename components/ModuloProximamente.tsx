// Stub para módulos futuros que todavía no tienen funcionalidad real (hoy: /inventario-predictivo).
// Empleo y Aliados ya dejaron de usar este componente porque ya funcionan de verdad.
// Mismo lenguaje editorial que el resto del sitio: el objetivo es que la ruta exista como destino
// real, no simular una funcionalidad que todavía no se construyó.

import Link from "next/link";
import type { ModuloFuturo } from "@/lib/content";

interface ModuloProximamenteProps {
  modulo: ModuloFuturo;
}

export function ModuloProximamente({ modulo }: ModuloProximamenteProps) {
  return (
    <main className="margen-editorial flex min-h-screen flex-col justify-center py-32">
      <span className="font-mono text-xs text-tinta/50">{modulo.numero}</span>

      <h1 className="mt-4 font-display text-6xl font-medium leading-[0.95] text-tinta sm:text-8xl">
        {modulo.nombre}
      </h1>

      <p className="mt-6 max-w-lg font-sans text-lg text-tinta/70">{modulo.descripcion}</p>

      <span className="mt-8 font-mono text-sm text-terracota">[ Próximamente ]</span>

      <Link
        href="/#enfoque"
        className="mt-16 inline-block w-fit font-mono text-sm text-tinta/50 underline decoration-terracota underline-offset-4 hover:text-terracota"
      >
        ← Volver a Territorio INN 2026
      </Link>
    </main>
  );
}
