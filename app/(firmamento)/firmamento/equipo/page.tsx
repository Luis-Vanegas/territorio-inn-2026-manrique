import type { Metadata } from 'next';

import { PaginaEnConstruccion } from '@/components/firmamento/panel/PaginaEnConstruccion';
import { exigirEquipo } from '@/lib/auth/firmamento';

export const metadata: Metadata = { title: 'Resumen' };

export default async function EquipoResumenPage() {
  await exigirEquipo();
  // ponytail: estado vacío hasta la Ola 2 (docs/plan-firmamento-2026-10.md).
  // La moderación de hoy sigue en /admin; no se mueve todavía.
  return <PaginaEnConstruccion titulo="Resumen" rol="equipo" />;
}
