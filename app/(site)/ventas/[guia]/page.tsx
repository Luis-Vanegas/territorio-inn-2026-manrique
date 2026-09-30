import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GuiaMarca } from '@/components/marca/GuiaMarca';
import { PuertaRegistro } from '@/components/marca/PuertaRegistro';
import { sesionActual } from '@/lib/auth/usuario';
import { guiaPorSlug } from '@/lib/marca';
import { VENTAS } from '@/lib/ventas';

type Props = { params: Promise<{ guia: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { guia: slug } = await params;
  const guia = guiaPorSlug(VENTAS, slug);
  if (!guia) return {};

  return { title: `${guia.titulo} · Constelaciones`, description: guia.bajada };
}

export const dynamic = 'force-dynamic';

export default async function GuiaVentasPage({ params }: Props) {
  const { guia: slug } = await params;
  const guia = guiaPorSlug(VENTAS, slug);
  if (!guia) notFound();

  const sesion = await sesionActual();
  if (!sesion) {
    return (
      <PuertaRegistro
        titulo={guia.titulo}
        bajada={guia.bajada}
        volver={{ href: '/ventas', etiqueta: '← Ver todas las guías' }}
      />
    );
  }

  return <GuiaMarca coleccion={VENTAS} guia={guia} base="/ventas" etiqueta="guía del equipo" />;
}
