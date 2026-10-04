import Link from 'next/link';

import type { ContextoPanel } from '@/lib/auth/firmamento';
import { BOTON_SITIO, ROL_TEXTO } from '@/lib/firmamento/navegacion';
import { FormaRol } from '../FormaRol';
import { MenuUsuarioPanel } from './MenuUsuarioPanel';
import { NavPanel, SubNavPanel, TituloPanel } from './NavPanel';
import { CLASE_BOTON_PANEL } from './Tarjeta';

/**
 * Armazón de los tres paneles de Firmamento (negocio, equipo, entidad), de día
 * (DESIGN.md › Firmamento con sesión): arriba el `SiteHeader` del sitio (lo pone
 * `app/(firmamento)/firmamento/layout.tsx`), debajo el encabezado del panel
 * (rol, nombre del negocio o de la entidad, botón al sitio y menú de la
 * persona) y las pestañas; después el título de la sección (único h1) y la
 * página. Sin barra lateral. La noche entra solo en las `VentanaNoche` de cada
 * página.
 *
 * Cada `layout.tsx` de rol hace su guarda (`lib/auth/firmamento.ts`) y le pasa
 * el `contexto`; este componente no autoriza nada.
 *
 * `insignias` (conteos por `href` del menú, p. ej. pendientes de moderación) lo
 * llena el layout del rol. Los conteos son de la base: nada aquí se escribe a
 * mano.
 */
const SIN_FICHA = 'Aún no se ve en Constelaciones';

function BotonSitio({
  sitio,
  className,
}: {
  sitio: { etiqueta: string; href: string; externo: boolean };
  className: string;
}) {
  if (!sitio.externo) {
    return (
      <Link href={sitio.href} className={`${CLASE_BOTON_PANEL} ${className}`}>
        {sitio.etiqueta}
      </Link>
    );
  }
  // La ficha pública abre en otra pestaña: el panel queda donde estaba.
  return (
    <a href={sitio.href} target="_blank" rel="noopener" className={`${CLASE_BOTON_PANEL} ${className}`}>
      {sitio.etiqueta} <span aria-hidden="true">↗</span>
      <span className="sr-only"> (se abre en otra pestaña)</span>
    </a>
  );
}

export function PanelShell({
  contexto,
  titular,
  insignias,
  hrefSitio,
  children,
}: {
  contexto: ContextoPanel;
  /** El nombre grande del encabezado: el negocio activo o la entidad. Por defecto, el de `contexto`. */
  titular?: string;
  insignias?: Record<string, number>;
  /**
   * Destino del botón al sitio cuando depende de los datos (la ficha pública del
   * negocio, en otra pestaña); `null` = la ficha aún no se ve en Constelaciones y
   * el botón lo dice sin enlazar. Sin la prop, el de `BOTON_SITIO`.
   */
  hrefSitio?: string | null;
  children: React.ReactNode;
}) {
  const { rol } = contexto;
  const sitio = { ...BOTON_SITIO[rol], href: hrefSitio ?? BOTON_SITIO[rol].href, externo: hrefSitio !== undefined };
  const sinFicha = hrefSitio === null;
  const nombre = titular ?? (rol === 'equipo' ? 'Panel del equipo' : contexto.nombre);

  return (
    <div className="bg-hueso">
      <div className="border-b border-tinta/10">
        <div className="margen-editorial">
          <div className="flex items-center gap-3 pb-4 pt-6 sm:gap-4 sm:pt-8">
            <FormaRol rol={rol} tamano={44} />
            <div className="min-w-0 flex-1">
              {/* Mayúsculas: etiqueta corta de sección, la excepción de voz de marca
                  de DESIGN.md › Tipografía. */}
              <p className="font-sans text-xs font-medium uppercase tracking-wider text-morado-texto">
                {ROL_TEXTO[rol]}
              </p>
              <p className="mt-0.5 break-words font-display text-xl font-medium leading-tight text-tinta sm:text-2xl">
                {nombre}
              </p>
            </div>
            {sinFicha ? (
              <span className="hidden shrink-0 rounded-lg border border-dashed border-tinta/30 px-4 py-2 font-sans text-sm text-tinta/70 sm:inline-flex">
                {SIN_FICHA}
              </span>
            ) : (
              <BotonSitio sitio={sitio} className="hidden shrink-0 sm:inline-flex" />
            )}
            <MenuUsuarioPanel rol={rol} nombre={contexto.nombre} foto={contexto.foto} sitio={sinFicha ? null : sitio} />
          </div>
          {/* En el celular el botón no cabe en la fila: va debajo, siempre visible. */}
          {hrefSitio !== undefined && (
            <div className="-mt-1 pb-3 sm:hidden">
              {sinFicha ? (
                <p className="font-sans text-sm text-tinta/70">{SIN_FICHA}</p>
              ) : (
                <BotonSitio sitio={sitio} className="w-full justify-center" />
              )}
            </div>
          )}
          <NavPanel rol={rol} insignias={insignias} />
        </div>
      </div>

      <main className="margen-editorial pb-16 pt-4">
        <SubNavPanel rol={rol} insignias={insignias} />
        <div className="mt-6 sm:mt-8">
          <TituloPanel rol={rol} />
        </div>
        <div className="mt-6">{children}</div>
      </main>

      <footer className="margen-editorial border-t border-tinta/10 py-6 font-sans text-xs leading-relaxed text-tinta/70">
        <p>Mapa © colaboradores de OpenStreetMap (ODbL) · Datos abiertos con supresión de celdas menores a 5</p>
      </footer>
    </div>
  );
}
