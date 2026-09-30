import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GuiaMarca } from '@/components/marca/GuiaMarca';
import { guiaPorSlug } from '@/lib/marca';
import { VENTAS } from '@/lib/ventas';

type Props = { params: Promise<{ guia: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { guia: slug } = await params;
  const guia = guiaPorSlug(VENTAS, slug);

  return { title: guia ? `${guia.titulo} · Moderación` : 'Guía · Moderación' };
}

export default async function AdminGuiaVentasPage({ params }: Props) {
  const { guia: slug } = await params;
  const guia = guiaPorSlug(VENTAS, slug);
  if (!guia) notFound();

  return (
    <GuiaMarca
      coleccion={VENTAS}
      guia={guia}
      base="/admin/ventas"
      etiqueta="vista de moderación · lo que ve un negocio"
    />
  );
}
