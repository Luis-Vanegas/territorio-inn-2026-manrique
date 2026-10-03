import type { Metadata } from 'next';

import { PaginaEnConstruccion } from '@/components/firmamento/panel/PaginaEnConstruccion';
import { exigirEntidad } from '@/lib/auth/firmamento';

export const metadata: Metadata = { title: 'Observatorio' };

export default async function EntidadObservatorioPage() {
  await exigirEntidad();
  // ponytail: estado vacío hasta la Ola 2 (docs/plan-firmamento-2026-10.md).
  return <PaginaEnConstruccion titulo="Observatorio" rol="entidad" />;
}
