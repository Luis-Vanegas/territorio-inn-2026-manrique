import type { Metadata } from 'next';
import { Fraunces } from 'next/font/google';

/**
 * Firmamento con sesión: la puerta (`entrar`) y los tres paneles (`negocio`,
 * `equipo`, `entidad`). Convive con la página pública `app/(site)/firmamento/`
 * porque los route groups no entran en la URL y cada uno aporta segmentos
 * distintos bajo `/firmamento`; ninguno define `page.tsx` en `/firmamento`
 * (docs de Next › Route Groups › «Conflicting paths»). Aquí NO hay encabezado
 * del sitio de día: es una superficie propia, siempre de noche.
 *
 * Fraunces itálica: la misma razón y la misma carga que `(site)/firmamento/
 * layout.tsx` (el titular «Firmamento» de la puerta la usa). Se carga solo en
 * este árbol de rutas.
 */
const frauncesItalica = Fraunces({
  subsets: ['latin'],
  style: 'italic',
  axes: ['opsz', 'SOFT'],
  variable: '--font-fraunces-italica',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Firmamento · Constelaciones', template: '%s · Firmamento' },
  // Puerta y paneles privados: no son contenido, no se indexan.
  robots: { index: false, follow: false },
};

export default function FirmamentoSesionLayout({ children }: { children: React.ReactNode }) {
  return <div className={frauncesItalica.variable}>{children}</div>;
}
