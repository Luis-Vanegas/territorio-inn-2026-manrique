import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GuiaMarca } from '@/components/marca/GuiaMarca';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { guiaPorSlug } from '@/lib/marca';
import { VENTAS } from '@/lib/ventas';

type Props = { params: Promise<{ guia: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { guia: slug } = await params;
  const guia = guiaPorSlug(VENTAS, slug);

  return { title: guia ? guia.titulo : 'Guía' };
}

export default async function EquipoGuiaVentasPage({ params }: Props) {
  await exigirEquipo();

  const { guia: slug } = await params;
  const guia = guiaPorSlug(VENTAS, slug);
  if (!guia) notFound();

  return (
    <GuiaMarca
      coleccion={VENTAS}
      guia={guia}
      base="/firmamento/equipo/ventas"
      etiqueta="lo que ve un negocio"
      incrustado
    />
  );
}
