import type { Metadata } from 'next';

import { IndiceMarca } from '@/components/marca/IndiceMarca';
import { sesionActual } from '@/lib/auth/usuario';
import { PuertaRegistro } from '@/components/marca/PuertaRegistro';
import { MARCA } from '@/lib/marca';

export const metadata: Metadata = {
  title: 'Marca · Constelaciones',
  description:
    'Guías del equipo para que tus fotos, tus redes y tu forma de presentarte trabajen a favor de tu negocio.',
};

// Lee la sesión en cada carga: sin sesión se ve QUÉ hay, con sesión el contenido.
export const dynamic = 'force-dynamic';

export default async function MarcaPage() {
  const sesion = await sesionActual();
  if (!sesion) {
    return (
      <PuertaRegistro
        titulo="Marca"
        bajada={MARCA.bajada}
        guias={MARCA.guias.map((g) => ({ titulo: g.titulo, portada: g.laminas[0], red: g.red }))}
        volver={{ href: '/', etiqueta: '← Volver a Constelaciones' }}
      />
    );
  }

  return (
    <IndiceMarca
      coleccion={MARCA}
      base="/marca"
      etiqueta="tu espacio · guías del equipo"
      volver={{ href: '/firmamento/negocio', etiqueta: '← Volver a mi panel' }}
    />
  );
}
