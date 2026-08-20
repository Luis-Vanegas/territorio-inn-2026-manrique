import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { obtenerPorToken, listarCategorias } from '@/lib/db/portafolios.repo';
import { EstadoAliado } from './_components/EstadoAliado';

// El token es la única credencial de esta página: nunca puede indexarse ni
// seguirse desde un buscador — es un link privado, igual de sensible que un
// magic link de login.
export const metadata: Metadata = {
  title: 'Tu registro · Constelaciones',
  robots: { index: false, follow: false },
};

// Igual que el registro: esto sirve datos frescos de la base, no una copia
// cacheada estáticamente en build.
export const dynamic = 'force-dynamic';

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EstadoAliadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ foto?: string }>;
}) {
  const { token } = await params;
  const { foto } = await searchParams;

  if (!FORMATO_UUID.test(token)) notFound();

  const [portafolio, categorias] = await Promise.all([
    obtenerPorToken(token),
    listarCategorias(),
  ]);

  if (!portafolio) notFound();

  return (
    <main className="margen-editorial py-24 sm:py-32">
      <EstadoAliado
        portafolio={portafolio}
        token={token}
        categorias={categorias}
        fotoFallo={foto === 'error'}
      />
    </main>
  );
}
