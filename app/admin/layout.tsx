import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Moderación · Constelaciones',
  // El panel no se indexa ni aparece en buscadores.
  robots: { index: false, follow: false },
};

/**
 * Shell del área de administración. No autoriza nada.
 *
 * El guard vive en app/admin/(panel)/layout.tsx, que envuelve solo a las rutas
 * protegidas. /admin/login queda afuera del grupo: un layout que exigiera
 * sesión sobre el propio login haría imposible iniciarla.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
