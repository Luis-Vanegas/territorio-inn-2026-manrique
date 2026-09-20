import type { Metadata } from 'next';

import { IndicePresencia } from '@/components/presencia/IndicePresencia';

export const metadata: Metadata = { title: 'Tu presencia · Moderación' };

// La sesión de moderación la exige el layout del panel: acá no hay nada que
// autorizar porque la página solo lee contenido editorial, sin acciones.
export default function AdminPresenciaPage() {
  return (
    <IndicePresencia
      base="/admin/presencia"
      etiqueta="vista de moderación · lo que ve un negocio"
      volver={{ href: '/admin/estadisticas', etiqueta: '← Volver al panel' }}
    />
  );
}
