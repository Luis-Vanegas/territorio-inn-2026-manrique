import type { Metadata } from 'next';

import { IndiceMarca } from '@/components/marca/IndiceMarca';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { MARCA } from '@/lib/marca';

export const metadata: Metadata = { title: 'Marca' };

// Lo que ve un negocio, para que el equipo pueda explicarlo. Solo contenido
// editorial; la guarda va igual en cada página del panel.
export default async function EquipoMarcaPage() {
  await exigirEquipo();

  return (
    <IndiceMarca
      coleccion={MARCA}
      base="/firmamento/equipo/marca"
      etiqueta="lo que ve un negocio"
      volver={{ href: '/firmamento/equipo', etiqueta: '← Volver al resumen' }}
      incrustado
    />
  );
}
