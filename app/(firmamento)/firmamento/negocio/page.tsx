import type { Metadata } from 'next';

import { PaginaEnConstruccion } from '@/components/firmamento/panel/PaginaEnConstruccion';
import { exigirNegocio } from '@/lib/auth/firmamento';

export const metadata: Metadata = { title: 'Inicio' };

export default async function NegocioInicioPage() {
  await exigirNegocio();
  // ponytail: estado vacío hasta la Ola 2 (docs/plan-firmamento-2026-10.md).
  return <PaginaEnConstruccion titulo="Inicio" rol="negocio" />;
}
