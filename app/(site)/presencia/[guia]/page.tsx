import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GuiaPresencia } from '@/components/presencia/GuiaPresencia';
import { sesionActual } from '@/lib/auth/usuario';
import { guiaPorSlug } from '@/lib/presencia';
import { PuertaRegistro } from '../_components/PuertaRegistro';

type Props = { params: Promise<{ guia: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { guia: slug } = await params;
  const guia = guiaPorSlug(slug);
  if (!guia) return {};

  return { title: `${guia.titulo} · Constelaciones`, description: guia.bajada };
}

export const dynamic = 'force-dynamic';

export default async function GuiaPage({ params }: Props) {
  const { guia: slug } = await params;
  const guia = guiaPorSlug(slug);
  if (!guia) notFound();

  const sesion = await sesionActual();
  if (!sesion) {
    return (
      <PuertaRegistro
        titulo={guia.titulo}
        bajada={guia.bajada}
        volver={{ href: '/presencia', etiqueta: '← Ver todas las guías' }}
      />
    );
  }

  return <GuiaPresencia guia={guia} base="/presencia" etiqueta="guía del equipo" />;
}
