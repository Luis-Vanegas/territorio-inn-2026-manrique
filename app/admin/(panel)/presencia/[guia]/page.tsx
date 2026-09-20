import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GuiaPresencia } from '@/components/presencia/GuiaPresencia';
import { guiaPorSlug } from '@/lib/presencia';

type Props = { params: Promise<{ guia: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { guia: slug } = await params;
  const guia = guiaPorSlug(slug);

  return { title: guia ? `${guia.titulo} · Moderación` : 'Guía · Moderación' };
}

export default async function AdminGuiaPage({ params }: Props) {
  const { guia: slug } = await params;
  const guia = guiaPorSlug(slug);
  if (!guia) notFound();

  return (
    <GuiaPresencia
      guia={guia}
      base="/admin/presencia"
      etiqueta="vista de moderación · lo que ve un negocio"
    />
  );
}
