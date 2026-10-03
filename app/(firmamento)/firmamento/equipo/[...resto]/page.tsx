import { notFound } from 'next/navigation';

import { PaginaEnConstruccion } from '@/components/firmamento/panel/PaginaEnConstruccion';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { hrefDeMenu } from '@/lib/firmamento/navegacion';

/**
 * Las secciones del menú del equipo que todavía no tienen carpeta propia caen
 * acá y muestran «En construcción» en vez de un 404. Una carpeta real
 * (`equipo/<seccion>/page.tsx`) le gana a este comodín sin tocarlo. Una ruta
 * que no está en el menú (`lib/firmamento/navegacion.ts`) sí es un 404.
 */
export default async function EquipoSeccionPage({
  params,
}: {
  params: Promise<{ resto: string[] }>;
}) {
  await exigirEquipo();

  const { resto } = await params;
  const item = hrefDeMenu('equipo', resto);
  if (!item) notFound();

  return <PaginaEnConstruccion titulo={item.etiqueta} rol="equipo" />;
}
