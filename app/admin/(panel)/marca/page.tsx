import type { Metadata } from 'next';

import { IndiceMarca } from '@/components/marca/IndiceMarca';

export const metadata: Metadata = { title: 'Marca · Moderación' };

// La sesión de moderación la exige el layout del panel: acá no hay nada que
// autorizar porque la página solo lee contenido editorial, sin acciones.
export default function AdminMarcaPage() {
  return (
    <IndiceMarca
      base="/admin/marca"
      etiqueta="vista de moderación · lo que ve un negocio"
      volver={{ href: '/admin/estadisticas', etiqueta: '← Volver al panel' }}
    />
  );
}
