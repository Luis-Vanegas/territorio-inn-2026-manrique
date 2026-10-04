import { exigirNegocio } from '@/lib/auth/firmamento';
import { sesionActual } from '@/lib/auth/usuario';
import { convocatoriasParaTi } from '@/lib/db/convocatorias.repo';
import { perfilesParaTi } from '@/lib/db/cuenta.repo';
import { hrefFichaPublica, negocioActivo } from '@/lib/firmamento/negocio';
import { PanelShell } from '@/components/firmamento/panel/PanelShell';

/**
 * Panel de negocio. La guarda manda a /firmamento/entrar si no hay sesión de
 * vecino; el armazón (barras, menú, pie) es el mismo de los tres paneles.
 * Esto protege la navegación, no los datos: cada `page.tsx` vuelve a llamar la
 * guarda y cada action y repo revalida (lib/auth/firmamento.ts).
 *
 * Aquí se resuelven dos cosas del armazón que dependen de los datos: la
 * insignia de «Para ti» (cuántas convocatorias le aplican) y a dónde lleva el
 * botón «Mi ficha pública». Un layout no se vuelve a ejecutar al pasar entre
 * secciones hermanas: la insignia se refresca al recargar o al volver a entrar,
 * y cada página de «Para ti» muestra su lista al día.
 */
export default async function PanelNegocioLayout({ children }: { children: React.ReactNode }) {
  // Sin sesión, el armazón no se pinta y manda la guarda de la página: el layout
  // no conoce la ruta, y el registro necesita volver a sí mismo tras Google
  // (`exigirNegocio('/firmamento/negocio/registro')`). Toda página del rol llama su guarda.
  if (!(await sesionActual())) return children;
  const contexto = await exigirNegocio();

  // Ambos son un extra del armazón: si fallan, el panel sigue sin insignia.
  const [{ actual }, paraTi] = await Promise.all([
    negocioActivo(contexto.usuarioId).catch(() => ({ negocios: [], actual: null })),
    perfilesParaTi(contexto.usuarioId)
      .then(convocatoriasParaTi)
      .catch((e) => {
        console.error('[panel negocio] insignia «Para ti» falló', e instanceof Error ? e.message : e);
        return [];
      }),
  ]);

  return (
    <PanelShell
      contexto={contexto}
      titular={actual?.nombre}
      hrefSitio={hrefFichaPublica(actual)}
      insignias={paraTi.length > 0 ? { '/firmamento/negocio/para-ti': paraTi.length } : undefined}
    >
      {children}
    </PanelShell>
  );
}
