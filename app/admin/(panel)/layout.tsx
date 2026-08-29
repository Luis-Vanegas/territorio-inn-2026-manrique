import Link from 'next/link';
import { redirect } from 'next/navigation';

import { verificarSesion } from '@/lib/auth/admin';
import { cerrarSesion } from '@/lib/actions/sesionAdmin';

/**
 * Guard de las rutas de moderación.
 *
 * El grupo (panel) no aparece en la URL: /admin/(panel)/aliados se sirve
 * como /admin/aliados. Sirve para que este layout envuelva solo lo que hay
 * que proteger, dejando /admin/login por fuera.
 *
 * Acá y no en middleware.ts: se decidió así cuando el middleware era Edge-only
 * (Next 14), donde no existen node:crypto ni cookies() de next/headers — justo
 * lo que verificarSesion() necesita. Este layout corre en Node. Desde Next 16
 * el middleware ya soporta Node, pero mover el guard no cambiaría nada: lo que
 * de verdad protege es que cada action revalide, como dice el párrafo de abajo.
 *
 * Esto protege la NAVEGACIÓN. Cada server action revalida la sesión por su
 * cuenta, porque una action es un endpoint HTTP invocable sin pasar por acá.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const sesion = await verificarSesion();

  if (!sesion) {
    redirect('/admin/login');
  }

  return (
    <>
      <header className="margen-editorial flex flex-wrap items-baseline justify-between gap-4 border-b border-tinta/12 py-5">
        <nav className="flex flex-wrap items-baseline gap-5">
          <Link
            href="/admin/aliados"
            className="font-mono text-xs uppercase tracking-wider text-tinta"
          >
            Moderación
          </Link>
          <Link
            href="/admin/servicios"
            className="font-mono text-xs text-tinta/55 hover:text-terracota-texto"
          >
            Servicios
          </Link>
          <Link
            href="/admin/empleo"
            className="font-mono text-xs text-tinta/55 hover:text-terracota-texto"
          >
            Empleo
          </Link>
          <Link
            href="/admin/estadisticas"
            className="font-mono text-xs text-tinta/55 hover:text-terracota-texto"
          >
            Estadísticas
          </Link>
          <Link
            href="/admin/campos"
            className="font-mono text-xs text-tinta/55 hover:text-terracota-texto"
          >
            Campos
          </Link>
          <Link
            href="/admin/peticiones"
            className="font-mono text-xs text-tinta/55 hover:text-terracota-texto"
          >
            Peticiones
          </Link>
          <Link
            href="/aliados"
            target="_blank"
            className="font-mono text-xs text-tinta/45 underline decoration-terracota/40 underline-offset-4 hover:text-terracota-texto"
          >
            ver mapa ↗
          </Link>
        </nav>

        <div className="flex items-baseline gap-4">
          <span className="font-mono text-xs text-tinta/45">{sesion.email}</span>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="font-mono text-xs text-tinta/45 underline decoration-terracota/40 underline-offset-4 hover:text-terracota-texto"
            >
              salir
            </button>
          </form>
        </div>
      </header>

      {children}
    </>
  );
}
