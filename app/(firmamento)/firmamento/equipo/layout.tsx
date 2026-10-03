import { exigirEquipo } from '@/lib/auth/firmamento';
import { PanelShell } from '@/components/firmamento/panel/PanelShell';
import { conteosPanel } from '@/lib/db/equipo.repo';

/**
 * Panel del equipo (antes /admin, que hoy redirige acá desde next.config.mjs).
 * La guarda manda a /firmamento/entrar si no hay sesión de moderación
 * (`admin_session`); el armazón (barras, menú, pie) es el mismo de los tres
 * paneles. Esto protege la navegación, no los datos: cada `page.tsx` vuelve a
 * llamar la guarda y cada action y repo revalida (lib/auth/firmamento.ts).
 *
 * Insignias: lo que espera una decisión del equipo. Si la base no responde, el
 * menú sale sin insignias en vez de tumbar el panel entero.
 */
export default async function PanelEquipoLayout({ children }: { children: React.ReactNode }) {
  const contexto = await exigirEquipo();

  const conteos = await conteosPanel().catch((e) => {
    console.error('[equipo] conteos del menú', e instanceof Error ? e.message : e);
    return null;
  });
  const insignias: Record<string, number> = conteos
    ? {
        '/firmamento/equipo/moderacion': conteos.moderacion,
        '/firmamento/equipo/convocatorias': conteos.convocatorias,
        '/firmamento/equipo/peticiones': conteos.peticiones,
      }
    : {};

  return (
    <PanelShell contexto={contexto} insignias={insignias}>
      {children}
    </PanelShell>
  );
}
