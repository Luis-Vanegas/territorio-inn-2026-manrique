// Menú superior del sitio público. Vive en app/(site)/layout.tsx, así que no
// aparece en /admin — el panel ya tiene su propio header de moderación.
//
// El desplegable móvil usa <details>/<summary>, un widget nativo del
// navegador: foco de teclado, cierre con Escape y sin una sola línea de JS
// para abrir/cerrar. Antes de escribir un useState + onClick, esto ya resuelve
// el 100% del caso de uso.

import Link from "next/link";
import { enfoque } from "@/lib/content";

// Se genera de la misma fuente que EnfoqueSection: una sola lista de módulos,
// no dos que se puedan desincronizar cuando se agregue o quite uno.
// El buzón se colgaba solo del footer, así que en la práctica no existía: nadie
// baja hasta el pie de una página para buscar dónde escribir. Va último, después
// de los módulos, porque es un canal de servicio y no una sección del proyecto.
const ENLACES = [
  ...enfoque.modulos.map((m) => ({ href: `/${m.slug}`, etiqueta: m.nombre })),
  { href: '/contacto', etiqueta: 'Escribinos' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-tinta/10 bg-hueso/90 backdrop-blur">
      <div className="margen-editorial flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-display text-lg font-medium text-tinta">
            Territorio INN
          </span>
          <span className="font-mono text-[10px] tracking-[0.15em] text-tinta/45">
            COMUNA 3 · MANRIQUE
          </span>
        </Link>

        {/* Desktop: nav inline + CTA siempre visible */}
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-7 lg:flex"
        >
          {ENLACES.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="font-mono text-xs uppercase tracking-wide text-tinta/65 transition-colors hover:text-terracota"
            >
              {e.etiqueta}
            </Link>
          ))}
        </nav>

        <Link
          href="/aliados/registro"
          className="hidden shrink-0 border border-terracota bg-terracota px-4 py-2 font-mono text-xs text-hueso transition-colors hover:bg-transparent hover:text-terracota lg:inline-block"
        >
          Registrar mi negocio →
        </Link>

        {/* Mobile: <details> nativo, cero JavaScript */}
        <details className="group relative lg:hidden">
          <summary
            className="flex h-9 w-9 cursor-pointer list-none items-center justify-center border border-tinta/15 text-tinta [&::-webkit-details-marker]:hidden"
            aria-label="Abrir menú"
          >
            <span className="font-mono text-sm group-open:hidden">☰</span>
            <span className="hidden font-mono text-sm group-open:inline">✕</span>
          </summary>

          <nav
            aria-label="Navegación principal"
            className="absolute right-0 top-12 flex w-56 flex-col gap-1 border border-tinta/12 bg-hueso p-2 shadow-[0_4px_20px_rgb(26_26_26/0.08)]"
          >
            {ENLACES.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="px-3 py-2.5 font-mono text-xs uppercase tracking-wide text-tinta/70 transition-colors hover:bg-tinta/[0.03] hover:text-terracota"
              >
                {e.etiqueta}
              </Link>
            ))}
            <Link
              href="/aliados/registro"
              className="mt-1 border border-terracota bg-terracota px-3 py-2.5 text-center font-mono text-xs text-hueso"
            >
              Registrar mi negocio →
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
