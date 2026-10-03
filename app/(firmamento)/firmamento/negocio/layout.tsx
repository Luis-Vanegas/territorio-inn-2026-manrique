import { exigirNegocio } from '@/lib/auth/firmamento';
import { PanelShell } from '@/components/firmamento/panel/PanelShell';

/**
 * Panel de negocio. La guarda manda a /firmamento/entrar si no hay sesión de
 * vecino; el armazón (barras, menú, pie) es el mismo de los tres paneles.
 * Esto protege la navegación, no los datos: cada `page.tsx` vuelve a llamar la
 * guarda y cada action y repo revalida (lib/auth/firmamento.ts).
 */
export default async function PanelNegocioLayout({ children }: { children: React.ReactNode }) {
  const contexto = await exigirNegocio();
  // `insignias`: conteos del menú por ruta (p. ej. «Para ti»). Las trae la Ola 2.
  return <PanelShell contexto={contexto}>{children}</PanelShell>;
}
