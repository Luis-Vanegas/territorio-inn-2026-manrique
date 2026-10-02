import { Fraunces } from 'next/font/google';

/**
 * Fraunces itálica, solo para /firmamento: el titular, las letras griegas y el
 * índice (DESIGN.md › Firmamento › Motivos). `app/layout.tsx` carga únicamente
 * Fraunces normal; sin esta, el navegador inclinaría la normal a la fuerza (una
 * itálica falsa) y el titular perdería su forma. Cargarla aquí y no en el layout
 * raíz evita que el resto del sitio descargue una fuente que no usa.
 */
const frauncesItalica = Fraunces({
  subsets: ['latin'],
  style: 'italic',
  axes: ['opsz', 'SOFT'],
  variable: '--font-fraunces-italica',
  display: 'swap',
});

export default function FirmamentoLayout({ children }: { children: React.ReactNode }) {
  return <div className={frauncesItalica.variable}>{children}</div>;
}
