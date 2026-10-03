import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GuiaMarca } from '@/components/marca/GuiaMarca';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { MARCA, guiaPorSlug } from '@/lib/marca';

type Props = { params: Promise<{ guia: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { guia: slug } = await params;
  const guia = guiaPorSlug(MARCA, slug);

  return { title: guia ? guia.titulo : 'Guía' };
}

export default async function EquipoGuiaMarcaPage({ params }: Props) {
  await exigirEquipo();

  const { guia: slug } = await params;
  const guia = guiaPorSlug(MARCA, slug);
  if (!guia) notFound();

  return (
    <GuiaMarca
      coleccion={MARCA}
      guia={guia}
      base="/firmamento/equipo/marca"
      etiqueta="lo que ve un negocio"
      incrustado
    />
  );
}
