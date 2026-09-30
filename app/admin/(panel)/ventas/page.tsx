import type { Metadata } from 'next';

import { IndiceMarca } from '@/components/marca/IndiceMarca';
import { VENTAS } from '@/lib/ventas';

export const metadata: Metadata = { title: 'Ventas · Moderación' };

// Como /admin/marca: la sesión la exige el layout del panel y acá solo se lee
// contenido editorial.
export default function AdminVentasPage() {
  return (
    <IndiceMarca
      coleccion={VENTAS}
      base="/admin/ventas"
      etiqueta="vista de moderación · lo que ve un negocio"
      volver={{ href: '/admin/estadisticas', etiqueta: '← Volver al panel' }}
    />
  );
}
