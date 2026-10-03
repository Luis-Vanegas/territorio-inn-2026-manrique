import type { Metadata } from 'next';

import { IndiceMarca } from '@/components/marca/IndiceMarca';
import { PuertaRegistro } from '@/components/marca/PuertaRegistro';
import { sesionActual } from '@/lib/auth/usuario';
import { VENTAS } from '@/lib/ventas';

export const metadata: Metadata = {
  title: 'Ventas · Constelaciones',
  description:
    'Guías del equipo para entender a tu cliente, conversar con él y cerrar más ventas sin presionar.',
};

// Mismo criterio que /marca: sin sesión se ve QUÉ hay, con sesión el contenido.
export const dynamic = 'force-dynamic';

export default async function VentasPage() {
  const sesion = await sesionActual();
  if (!sesion) {
    return (
      <PuertaRegistro
        titulo={VENTAS.nombre}
        bajada={VENTAS.bajada}
        guias={VENTAS.guias.map((g) => ({ titulo: g.titulo, portada: g.laminas[0] }))}
        volver={{ href: '/', etiqueta: '← Volver a Constelaciones' }}
      />
    );
  }

  return (
    <IndiceMarca
      coleccion={VENTAS}
      base="/ventas"
      etiqueta="tu espacio · guías del equipo"
      volver={{ href: '/firmamento/negocio', etiqueta: '← Volver a mi panel' }}
    />
  );
}
