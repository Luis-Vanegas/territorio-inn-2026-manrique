import type { Metadata } from 'next';

import { IndicePresencia } from '@/components/presencia/IndicePresencia';
import { sesionActual } from '@/lib/auth/usuario';
import { GUIAS, PRESENCIA_BAJADA } from '@/lib/presencia';
import { PuertaRegistro } from './_components/PuertaRegistro';

export const metadata: Metadata = {
  title: 'Tu presencia · Constelaciones',
  description:
    'Guías del equipo para que tus fotos, tus redes y tu forma de presentarte trabajen a favor de tu negocio.',
};

// Lee la sesión en cada carga: sin sesión se ve QUÉ hay, con sesión el contenido.
export const dynamic = 'force-dynamic';

export default async function PresenciaPage() {
  const sesion = await sesionActual();
  if (!sesion) {
    return (
      <PuertaRegistro
        titulo="Tu presencia"
        bajada={PRESENCIA_BAJADA}
        guias={GUIAS.map((g) => g.titulo)}
        volver={{ href: '/', etiqueta: '← Volver a Constelaciones' }}
      />
    );
  }

  return (
    <IndicePresencia
      base="/presencia"
      etiqueta="tu espacio · guías del equipo"
      volver={{ href: '/mi-cuenta', etiqueta: '← Volver a mi cuenta' }}
    />
  );
}
