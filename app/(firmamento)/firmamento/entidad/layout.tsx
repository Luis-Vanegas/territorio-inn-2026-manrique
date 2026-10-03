import { exigirEntidad } from '@/lib/auth/firmamento';
import { PanelShell } from '@/components/firmamento/panel/PanelShell';

/**
 * Panel de entidad. La guarda pide sesión de vecino Y membresía de una entidad
 * (`entidadDeSesion`); sin ellas manda a /firmamento/entrar. El armazón (barras,
 * menú, pie) es el mismo de los tres paneles. Esto protege la navegación, no los
 * datos: cada `page.tsx` vuelve a llamar la guarda y cada action y repo
 * revalida (lib/auth/firmamento.ts). Una entidad solo ve agregados k = 5.
 */
export default async function PanelEntidadLayout({ children }: { children: React.ReactNode }) {
  const contexto = await exigirEntidad();
  return <PanelShell contexto={contexto}>{children}</PanelShell>;
}
