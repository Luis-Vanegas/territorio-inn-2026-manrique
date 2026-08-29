// Menú superior del sitio público. Vive en app/(site)/layout.tsx, así que no
// aparece en /admin — el panel ya tiene su propio header de moderación.
//
// El desplegable móvil usa <details>/<summary>, un widget nativo del
// navegador: foco de teclado, cierre con Escape y sin una sola línea de JS
// para abrir/cerrar. Antes de escribir un useState + onClick, esto ya resuelve
// el 100% del caso de uso.
//
// Es 'use client' por una sola razón: usePathname, para marcar en qué página
// está la persona. No hay forma de saber la ruta en un Server Component sin
// pasarla a mano desde cada página, que es peor.
//
// El menú inline aparece recién en xl (1440px), no en lg (1024px). A 16px —el
// piso cómodo de lectura para navegación— los cinco ítems más el logo y el CTA
// no entran a 1024px, y con el módulo "Inventario predictivo" prendido se
// desbordan por bastante. La salida NO es bajarle el tamaño a la letra: es
// dejar el desplegable, donde cada ítem tiene ancho completo, 16px y 44px de
// alto. Entre 1024 y 1440 se ve el ☰, y está bien.

'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { enfoque } from "@/lib/content";

// Se genera de la misma fuente que EnfoqueSection: una sola lista de módulos,
// no dos que se puedan desincronizar cuando se agregue o quite uno.
// El buzón se colgaba solo del footer, así que en la práctica no existía: nadie
// baja hasta el pie de una página para buscar dónde escribir. Va último, después
// de los módulos, porque es un canal de servicio y no una sección del proyecto.
const ENLACES = [
  { href: '/', etiqueta: 'Inicio' },
  ...enfoque.modulos.map((m) => ({ href: `/${m.slug}`, etiqueta: m.nombre })),
  { href: '/contacto', etiqueta: 'Escríbenos' },
];

// Las subrutas cuentan como la sección: estando en /aliados/registro, el ítem
// "Aliados" sigue siendo dónde estás. Lo contrario deja el menú entero apagado
// justo en las páginas de formulario, que es donde más falta hace saber
// de dónde veniste.
function esActivo(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

// El estado activo se comunica con TRES señales, no solo con color: peso
// tipográfico, subrayado grueso y color. WCAG 1.4.1 — quien no distingue bien
// la terracota sobre el hueso necesita otra pista, y aria-current es la que
// escucha el lector de pantalla.
const BASE_ENLACE =
  "inline-flex min-h-[44px] items-center font-mono text-base uppercase tracking-wide transition-colors";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-tinta/10 bg-hueso/90 backdrop-blur">
      <div className="margen-editorial flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logos/isotipo_app.png"
            alt=""
            width={32}
            height={32}
            priority
            className="h-8 w-8 shrink-0"
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-medium tracking-wide text-tinta">
              CONSTELACIONES
            </span>
            <span className="font-mono text-xs tracking-[0.15em] text-tinta/60">
              COMUNA 3 · MANRIQUE
            </span>
          </span>
        </Link>

        {/* Desktop: nav inline + CTA siempre visible */}
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-6 xl:flex"
        >
          {ENLACES.map((e) => {
            const activo = esActivo(pathname, e.href);
            return (
              <Link
                key={e.href}
                href={e.href}
                aria-current={activo ? 'page' : undefined}
                className={
                  activo
                    ? `${BASE_ENLACE} border-b-2 border-terracota font-medium text-tinta`
                    : `${BASE_ENLACE} border-b-2 border-transparent text-tinta/65 hover:text-terracota-texto`
                }
              >
                {e.etiqueta}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/aliados/registro"
          className="hidden min-h-[44px] shrink-0 items-center border border-terracota-texto px-4 font-mono text-base text-terracota-texto transition-colors hover:bg-terracota-texto hover:text-hueso xl:inline-flex"
        >
          Sumar mi negocio →
        </Link>

        {/* Mobile: <details> nativo, cero JavaScript */}
        <details className="group relative xl:hidden">
          <summary
            className="flex h-11 w-11 cursor-pointer list-none items-center justify-center border border-tinta/15 text-tinta [&::-webkit-details-marker]:hidden"
            aria-label="Abrir menú"
          >
            <span className="font-mono text-base group-open:hidden">☰</span>
            <span className="hidden font-mono text-base group-open:inline">✕</span>
          </summary>

          <nav
            aria-label="Navegación principal"
            className="absolute right-0 top-12 flex w-72 flex-col gap-1 border border-tinta/12 bg-hueso p-2 shadow-[0_4px_20px_rgb(26_26_26/0.08)]"
          >
            {ENLACES.map((e) => {
              const activo = esActivo(pathname, e.href);
              return (
                <Link
                  key={e.href}
                  href={e.href}
                  aria-current={activo ? 'page' : undefined}
                  className={
                    activo
                      ? `${BASE_ENLACE} border-l-4 border-terracota bg-tinta/[0.04] px-3 font-medium text-tinta`
                      : `${BASE_ENLACE} border-l-4 border-transparent px-3 text-tinta/70 hover:bg-tinta/[0.03] hover:text-terracota-texto`
                  }
                >
                  {e.etiqueta}
                </Link>
              );
            })}
            <Link
              href="/aliados/registro"
              className="mt-1 inline-flex min-h-[44px] items-center justify-center border border-terracota-texto px-3 text-center font-mono text-base text-terracota-texto transition-colors hover:bg-terracota-texto hover:text-hueso"
            >
              Sumar mi negocio →
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
