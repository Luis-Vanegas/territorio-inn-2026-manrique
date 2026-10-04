// Menú superior del sitio público. Vive en app/(site)/layout.tsx, así que no
// aparece en /admin — el panel ya tiene su propio header de moderación.
//
// El desplegable móvil usa <details>/<summary>, un widget nativo del
// navegador: foco de teclado, cierre con Escape y sin una sola línea de JS
// para abrir/cerrar. Solo «Aprende» necesita estado (MenuAprende), y por eso
// es un botón con aria-expanded.
//
// Ítems (DESIGN.md › Navegación): Inicio · Aliados · Aprende ▾ · Firmamento ·
// Nosotros, y Empleo/Inventario solo con su flag prendido.
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
import { salir } from "@/lib/actions/sesionUsuario";
// Una sola lista de accesos privados, compartida con el menú de escritorio:
// dos copias se desincronizan la primera vez que se agregue un módulo.
import { MenuUsuario, ENLACES_PRIVADOS, ENLACE_MODERACION } from "@/components/MenuUsuario";
import { MenuAprende } from "@/components/MenuAprende";
import { SelectorTema } from "@/components/SelectorTema";

// Se genera de la misma fuente que EnfoqueSection: una sola lista de módulos,
// no dos que se puedan desincronizar cuando se agregue o quite uno. Empleo e
// Inventario existen en `enfoque.modulos` solo con su flag; se quedan entre
// Aliados y Aprende.
const SLUGS_APRENDE = ['formalizacion', 'marca', 'ventas'];

const ENLACES_APRENDE = enfoque.modulos
  .filter((m) => SLUGS_APRENDE.includes(m.slug))
  .map((m) => ({ href: `/${m.slug}`, etiqueta: m.nombre }));

const MODULOS_SUELTOS = enfoque.modulos
  .filter((m) => !SLUGS_APRENDE.includes(m.slug) && m.slug !== 'aliados')
  .map((m) => ({ href: `/${m.slug}`, etiqueta: m.nombre }));

type Entrada = { tipo: 'enlace'; href: string; etiqueta: string } | { tipo: 'aprende' };

const ENTRADAS: Entrada[] = [
  { tipo: 'enlace', href: '/', etiqueta: 'Inicio' },
  { tipo: 'enlace', href: '/aliados', etiqueta: 'Aliados' },
  ...MODULOS_SUELTOS.map((e) => ({ tipo: 'enlace' as const, ...e })),
  { tipo: 'aprende' },
  { tipo: 'enlace', href: '/firmamento', etiqueta: 'Firmamento' },
  { tipo: 'enlace', href: '/nosotros', etiqueta: 'Nosotros' },
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
// el azul sobre el fondo necesita otra pista, y aria-current es la que
// escucha el lector de pantalla.
const BASE_ENLACE =
  "inline-flex min-h-[44px] items-center font-sans text-base uppercase tracking-wide transition-colors";

// «Aprende» está activo si estás en cualquiera de sus tres rutas.
const aprendeActivo = (pathname: string) => ENLACES_APRENDE.some((e) => esActivo(pathname, e.href));

const CLASE_ACTIVO_ESCRITORIO = `${BASE_ENLACE} border-b-2 border-azul font-medium text-tinta`;
const CLASE_INACTIVO_ESCRITORIO = `${BASE_ENLACE} border-b-2 border-transparent text-tinta/65 hover:text-morado-texto`;
const CLASE_ACTIVO_MOVIL = `${BASE_ENLACE} border-l-4 border-azul bg-tinta/[0.04] px-3 font-medium text-tinta`;
const CLASE_INACTIVO_MOVIL = `${BASE_ENLACE} border-l-4 border-transparent px-3 text-tinta/70 hover:bg-tinta/[0.03] hover:text-morado-texto`;

/**
 * La sesión la resuelve el layout (Server Component) y baja como prop: este
 * componente es 'use client' por usePathname y no puede leer la cookie.
 */
export function SiteHeader({
  sesion,
}: {
  sesion: { nombre: string; foto: string | null; moderador: boolean } | null;
}) {
  const pathname = usePathname();
  const enlacesPrivados = sesion?.moderador
    ? [...ENLACES_PRIVADOS, ENLACE_MODERACION]
    : ENLACES_PRIVADOS;

  return (
    // Fondo opaco y sin backdrop-blur a propósito: con bg-hueso/90 + blur, un
    // navegador que apaga backdrop-filter (Edge en modo eficiencia, sin
    // aceleración por hardware) dejaba ver las fotos a través del menú.
    // transform-gpu le da capa propia: sin ella, Chromium a veces compone por
    // encima una foto que se está animando (zoom de la galería, ScrollReveal).
    <header className="sticky top-0 z-50 transform-gpu border-b border-tinta/10 bg-hueso">
      <div className="margen-editorial flex h-16 items-center justify-between gap-2 sm:h-[4.5rem] sm:gap-4">
        <Link href="/" className="flex min-h-[44px] min-w-0 items-center gap-2 sm:gap-2.5">
          <Image
            src="/logos/isotipo_app.png"
            alt=""
            width={32}
            height={32}
            priority
            // Bajo 360 px el logo cede el isotipo: con él, el texto no cabe junto a los dos botones.
            className="hidden h-8 w-8 shrink-0 min-[360px]:block"
          />
          <span className="flex min-w-0 flex-col leading-none">
            <span className="font-display text-base font-medium tracking-normal text-tinta sm:text-lg sm:tracking-wide">
              CONSTELACIONES
            </span>
            {/* Bajo 360 px no hay lugar: el encabezado desbordaba a 320 (355 de scrollWidth). */}
            <span className="hidden font-sans text-xs tracking-[0.15em] text-tinta/60 min-[360px]:block">
              COMUNA 3 · MANRIQUE
            </span>
          </span>
        </Link>

        {/* Desktop: nav inline + CTA siempre visible */}
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-6 xl:flex"
        >
          {ENTRADAS.map((e) =>
            e.tipo === 'aprende' ? (
              <MenuAprende
                key="aprende"
                enlaces={ENLACES_APRENDE}
                pathname={pathname}
                claseBoton={aprendeActivo(pathname) ? CLASE_ACTIVO_ESCRITORIO : CLASE_INACTIVO_ESCRITORIO}
              />
            ) : (
              <Link
                key={e.href}
                href={e.href}
                aria-current={esActivo(pathname, e.href) ? 'page' : undefined}
                className={esActivo(pathname, e.href) ? CLASE_ACTIVO_ESCRITORIO : CLASE_INACTIVO_ESCRITORIO}
              >
                {e.etiqueta}
              </Link>
            ),
          )}
        </nav>

        {/* Con sesión: identidad neutra con su propio menú. Sin sesión: la
            única acción primaria de la barra, y por eso la única en azul.
            Nunca los dos a la vez. */}
        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          <SelectorTema />
          {sesion ? (
            <MenuUsuario key={pathname} nombre={sesion.nombre} foto={sesion.foto} enlaces={enlacesPrivados} />
          ) : (
            <Link
              href="/entrar"
              className="inline-flex min-h-[44px] items-center border border-azul-texto bg-azul-texto px-4 font-sans text-base text-hueso transition-colors hover:bg-transparent hover:text-azul-texto"
            >
              Registrarme →
            </Link>
          )}
        </div>

        {/* Mobile: <details> nativo, cero JavaScript. El toggle de tema va
            afuera del <details>: es una acción de utilidad, no un ítem de
            navegación, y no tiene sentido que cierre el menú al tocarlo. */}
        <div className="flex items-center gap-2 xl:hidden">
          <SelectorTema />
          {/* key={pathname}: el header vive en el layout y no se desmonta al
              navegar, así que un <details> abierto seguía abierto encima de la
              página nueva después de tocar un link. Con la key, cada ruta
              monta uno nuevo, que arranca cerrado. Mismo motivo en MenuUsuario. */}
          <details key={pathname} className="group">
            <summary
            className="flex h-11 w-11 cursor-pointer list-none items-center justify-center border border-tinta/55 text-tinta [&::-webkit-details-marker]:hidden"
            aria-label="Abrir menú"
          >
            <span className="font-sans text-base group-open:hidden">☰</span>
            <span className="hidden font-sans text-base group-open:inline">✕</span>
          </summary>

          <nav
            aria-label="Navegación principal"
            className="absolute right-[var(--margen-editorial)] top-full mt-1 flex max-h-[calc(100dvh-5.5rem)] w-[min(20rem,calc(100vw_-_2*var(--margen-editorial)))] flex-col gap-1 overflow-y-auto border border-tinta/12 bg-hueso p-2 shadow-[0_4px_20px_rgb(11_16_38/0.08)]"
          >
            {ENTRADAS.map((e) =>
              e.tipo === 'aprende' ? (
                <MenuAprende
                  key="aprende"
                  enlaces={ENLACES_APRENDE}
                  pathname={pathname}
                  enLinea
                  claseBoton={`${aprendeActivo(pathname) ? CLASE_ACTIVO_MOVIL : CLASE_INACTIVO_MOVIL} cursor-pointer`}
                />
              ) : (
                <Link
                  key={e.href}
                  href={e.href}
                  aria-current={esActivo(pathname, e.href) ? 'page' : undefined}
                  className={esActivo(pathname, e.href) ? CLASE_ACTIVO_MOVIL : CLASE_INACTIVO_MOVIL}
                >
                  {e.etiqueta}
                </Link>
              ),
            )}
            {/* El buzón salió de la barra de escritorio (queda en el pie); acá
                sobra espacio y nadie baja hasta el pie para buscar dónde escribir. */}
            <Link
              href="/contacto"
              aria-current={esActivo(pathname, '/contacto') ? 'page' : undefined}
              className={esActivo(pathname, '/contacto') ? CLASE_ACTIVO_MOVIL : CLASE_INACTIVO_MOVIL}
            >
              Escríbenos
            </Link>
            {/* En móvil el desplegable ya está abierto, así que los accesos
                privados van inline en vez de anidar un <details> dentro de
                otro — dos menús encastrados son un laberinto con el pulgar. */}
            {sesion ? (
              <>
                <p className="mt-2 border-t border-tinta/12 px-3 pb-1 pt-3 font-sans text-xs uppercase tracking-wider text-tinta/60">
                  Tu espacio · {sesion.nombre.trim().split(/\s+/)[0]}
                </p>
                {enlacesPrivados.map((e) => (
                  <Link
                    key={e.href}
                    href={e.href}
                    className={`${BASE_ENLACE} border-l-4 border-transparent px-3 text-tinta/70 hover:bg-tinta/[0.03] hover:text-morado-texto`}
                  >
                    {e.etiqueta}
                  </Link>
                ))}
                <form action={salir} className="mt-1 border-t border-tinta/12 pt-1">
                  <button
                    type="submit"
                    className={`${BASE_ENLACE} w-full border-l-4 border-transparent px-3 text-left text-tinta/70 hover:bg-tinta/[0.03] hover:text-morado-texto`}
                  >
                    Cerrar sesión
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/entrar"
                className="mt-1 inline-flex min-h-[44px] items-center justify-center border border-azul-texto bg-azul-texto px-3 text-center font-sans text-base text-hueso transition-colors hover:bg-transparent hover:text-azul-texto"
              >
                Registrarme →
              </Link>
            )}
          </nav>
        </details>
        </div>
      </div>
    </header>
  );
}
