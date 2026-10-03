import Image from 'next/image';
import Link from 'next/link';

import type { ContextoPanel } from '@/lib/auth/firmamento';
import { BOTON_SITIO, NAV, ROL_TEXTO } from '@/lib/firmamento/navegacion';
import { Estrella } from '../Estrella';
import { MenuUsuarioPanel } from './MenuUsuarioPanel';
import { NavInferior, NavLateral, TituloPanel } from './NavPanel';

/**
 * Armazón compartido por los tres paneles de Firmamento (negocio, equipo,
 * entidad): barra lateral con la navegación del rol, barra superior con el
 * título y el menú de la persona, barra inferior en el celular y pie.
 *
 * Siempre de noche (`.modo-noche`, DESIGN.md › Firmamento): no sigue el selector
 * de tema, igual que /firmamento. Cada `layout.tsx` de rol hace su guarda
 * (`lib/auth/firmamento.ts`) y le pasa el `contexto`; este componente no
 * autoriza nada.
 *
 * `insignias` (conteos por `href` del menú, p. ej. pendientes de moderación) lo
 * llena el layout del rol cuando haya dato. Los conteos son de la base: nada
 * aquí se escribe a mano.
 */
export function PanelShell({
  contexto,
  insignias,
  children,
}: {
  contexto: ContextoPanel;
  insignias?: Record<string, number>;
  children: React.ReactNode;
}) {
  const { rol } = contexto;
  const items = NAV[rol];
  const sitio = BOTON_SITIO[rol];

  return (
    <div className="modo-noche min-h-screen lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* Saltar al contenido (WCAG 2.4.1): el menú lateral tiene hasta seis ítems. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-sodio focus:px-4 focus:py-3 focus:font-sans focus:text-base focus:text-noche"
      >
        Saltar al contenido
      </a>

      {/* ── Barra lateral (escritorio) ── */}
      <aside className="hidden border-r border-trazo bg-noche-2 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <Link
          href={items[0]!.href}
          className="flex min-h-[44px] items-center gap-3 px-5 pt-6"
        >
          <Image src="/logos/isotipo_app.png" alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-xl font-medium text-estrella">Firmamento</span>
            <span className="font-sans text-xs text-tenue">Constelaciones · Manrique</span>
          </span>
        </Link>

        {/* Mayúsculas: etiqueta corta de sección, la excepción de voz de marca
            de DESIGN.md › Tipografía; la navegación de abajo no las usa. */}
        <p className="mt-6 px-5 font-sans text-xs font-medium uppercase tracking-wider text-sodio">
          {ROL_TEXTO[rol]}
        </p>

        <NavLateral items={items} insignias={insignias} />

        <div className="mt-auto p-4">
          <div className="rounded-xl border border-trazo-2 bg-noche-3 p-4">
            <Estrella tamano={18} />
            <p className="mt-3 font-display text-lg font-medium leading-snug text-estrella">
              La cara de la red es Constelaciones
            </p>
            <p className="mt-1.5 font-sans text-sm leading-relaxed text-tenue">
              Aquí trabajas tus datos. Allá te encuentran tus vecinos.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-sodio px-4 py-2 font-sans text-sm font-medium leading-snug text-noche"
            >
              Ir al sitio de la comunidad
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
        {/* ── Barra superior ── */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-trazo bg-noche px-4 py-2.5 sm:px-8">
          <Link href={items[0]!.href} aria-label="Inicio de Firmamento" className="hidden shrink-0 min-[400px]:block lg:hidden">
            <Image src="/logos/isotipo_app.png" alt="" width={32} height={32} className="h-8 w-8" />
          </Link>

          <TituloPanel items={items} />

          <Link
            href={sitio.href}
            aria-label={sitio.etiqueta}
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-lg border border-trazo-2 px-3 font-sans text-sm text-estrella hover:bg-noche-3"
          >
            <span aria-hidden="true" className="sm:hidden">{sitio.corto}</span>
            <span aria-hidden="true" className="hidden sm:inline">{sitio.etiqueta}</span>
          </Link>

          <MenuUsuarioPanel rol={rol} nombre={contexto.nombre} foto={contexto.foto} />
        </header>

        {/* tabIndex -1: destino del «Saltar al contenido». El padding de abajo deja
            lugar a la barra inferior del celular. */}
        <main id="contenido" tabIndex={-1} className="flex-1 px-4 pb-8 pt-6 outline-none sm:px-8 lg:pb-10">
          {children}
        </main>

        {/* ── Pie ── */}
        <footer className="border-t border-trazo px-4 py-6 pb-28 sm:px-8 lg:pb-6">
          <p className="font-sans text-sm text-tenue">
            Firmamento es la capa de datos de{' '}
            <Link href="/" className="text-sodio underline underline-offset-4">
              Constelaciones · Manrique
            </Link>
            .
          </p>
          <p className="mt-2 font-cifra text-xs text-tenue">
            Mapa © colaboradores de OpenStreetMap (ODbL)
          </p>
          <p className="mt-2 font-sans text-sm text-tenue">
            Datos abiertos con supresión de celdas menores a 5
          </p>
        </footer>
      </div>

      <NavInferior items={items} insignias={insignias} />
    </div>
  );
}
