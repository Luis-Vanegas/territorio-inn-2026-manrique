import type { Metadata } from 'next';

import { IndiceMarca } from '@/components/marca/IndiceMarca';
import { sesionActual } from '@/lib/auth/usuario';
import { GUIAS, MARCA_BAJADA } from '@/lib/marca';
import { PuertaRegistro } from './_components/PuertaRegistro';

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
        bajada={MARCA_BAJADA}
        guias={GUIAS.map((g) => ({ titulo: g.titulo, portada: g.laminas[0], red: g.red }))}
        volver={{ href: '/', etiqueta: '← Volver a Constelaciones' }}
      />
    );
  }

  return (
    <IndiceMarca
      base="/marca"
      etiqueta="tu espacio · guías del equipo"
      volver={{ href: '/mi-cuenta', etiqueta: '← Volver a mi cuenta' }}
    />
  );
}
