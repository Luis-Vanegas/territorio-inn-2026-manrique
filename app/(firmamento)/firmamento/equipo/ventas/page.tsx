import type { Metadata } from 'next';

import { IndiceMarca } from '@/components/marca/IndiceMarca';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { VENTAS } from '@/lib/ventas';

export const metadata: Metadata = { title: 'Ventas' };

// Lo que ve un negocio, para que el equipo pueda explicarlo. Solo contenido
// editorial; la guarda va igual en cada página del panel.
export default async function EquipoVentasPage() {
  await exigirEquipo();

  return (
    <IndiceMarca
      coleccion={VENTAS}
      base="/firmamento/equipo/ventas"
      etiqueta="lo que ve un negocio"
      volver={{ href: '/firmamento/equipo', etiqueta: '← Volver al resumen' }}
      incrustado
    />
  );
}
