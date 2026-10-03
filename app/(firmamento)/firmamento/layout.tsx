import type { Metadata } from 'next';

import { SiteHeader } from '@/components/SiteHeader';
import { verificarSesion } from '@/lib/auth/admin';
import { sesionActual } from '@/lib/auth/usuario';

/**
 * Firmamento con sesión: la puerta (`entrar`) y los tres paneles (`negocio`,
 * `equipo`, `entidad`). Convive con la página pública `app/(site)/firmamento/`
 * porque los route groups no entran en la URL y cada uno aporta segmentos
 * distintos bajo `/firmamento`; ninguno define `page.tsx` en `/firmamento`
 * (docs de Next › Route Groups › «Conflicting paths»).
 *
 * De día y con el encabezado del sitio (DESIGN.md › Firmamento con sesión): el
 * enlace a Constelaciones es el de siempre y no hay una barra propia. La sesión
 * se lee igual que en `app/(site)/layout.tsx` y baja al encabezado solo con lo
 * que pinta (nombre y avatar).
 */
export const metadata: Metadata = {
  title: { default: 'Firmamento · Constelaciones', template: '%s · Firmamento' },
  // Puerta y paneles privados: no son contenido, no se indexan.
  robots: { index: false, follow: false },
};

export default async function FirmamentoSesionLayout({ children }: { children: React.ReactNode }) {
  const [sesion, moderador] = await Promise.all([sesionActual(), verificarSesion()]);

  return (
    <>
      {/* Saltar al contenido (WCAG 2.4.1): el mismo de app/(site)/layout.tsx. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:border focus:border-tinta focus:bg-hueso focus:px-4 focus:py-3 focus:font-sans focus:text-base focus:text-tinta"
      >
        Saltar al contenido
      </a>

      <SiteHeader
        sesion={sesion ? { nombre: sesion.nombre, foto: sesion.foto, moderador: moderador !== null } : null}
      />

      <div id="contenido" tabIndex={-1}>
        {children}
      </div>
    </>
  );
}
