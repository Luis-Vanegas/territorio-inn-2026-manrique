import { notFound } from 'next/navigation';

import { PaginaEnConstruccion } from '@/components/firmamento/panel/PaginaEnConstruccion';
import { exigirEntidad } from '@/lib/auth/firmamento';
import { hrefDeMenu } from '@/lib/firmamento/navegacion';

/**
 * Las secciones del menú de entidad que todavía no tienen carpeta propia caen
 * acá y muestran «En construcción» en vez de un 404. Una carpeta real
 * (`entidad/<seccion>/page.tsx`) le gana a este comodín sin tocarlo. Una ruta
 * que no está en el menú (`lib/firmamento/navegacion.ts`) sí es un 404.
 */
export default async function EntidadSeccionPage({
  params,
}: {
  params: Promise<{ resto: string[] }>;
}) {
  await exigirEntidad();

  const { resto } = await params;
  const item = hrefDeMenu('entidad', resto);
  if (!item) notFound();

  return <PaginaEnConstruccion titulo={item.etiqueta} rol="entidad" />;
}
