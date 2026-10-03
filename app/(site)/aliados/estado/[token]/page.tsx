import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { obtenerPorToken, listarCategorias } from '@/lib/db/portafolios.repo';
import { asesorConfigurado } from '@/lib/agente/asesor';
import { googleConfigurado } from '@/lib/auth/google';
import { negocioTieneDueno } from '@/lib/db/accesos.repo';
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
  searchParams: Promise<{ foto?: string; menu?: string }>;
}) {
  const { token } = await params;
  const { foto, menu } = await searchParams;

  if (!FORMATO_UUID.test(token)) notFound();

  const [portafolio, categorias, conDueno] = await Promise.all([
    obtenerPorToken(token),
    listarCategorias(),
    negocioTieneDueno(token),
  ]);

  if (!portafolio) notFound();

  // El puente entre las dos puertas: quien tiene el enlace entra con Google y el
  // negocio queda en su cuenta (cookie de un solo uso → `vincularNegocio` en el
  // retorno, que no pisa un dueño existente). Enlace plano, no `Link`: precargarlo
  // dispararía el inicio de OAuth.
  const guardarEnCuenta = !conDueno && portafolio.estado !== 'archivado' && googleConfigurado();

  return (
    <main className="seccion">
      {guardarEnCuenta && (
        <aside
          aria-label="Guardar en tu cuenta"
          className="mb-10 max-w-2xl rounded-xl border border-tinta/12 p-5 sm:p-6"
        >
          <p className="font-sans text-base leading-relaxed text-tinta">
            Guarda tu negocio en tu cuenta de Google y manéjalo desde tu panel, sin depender de este enlace.
          </p>
          <a
            href={`/api/auth/google/iniciar?${new URLSearchParams({ destino: '/firmamento/negocio', vincular: token })}`}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-azul-texto px-5 font-sans text-sm font-medium text-hueso"
          >
            Continuar con Google
          </a>
        </aside>
      )}
      <EstadoAliado
        portafolio={portafolio}
        token={token}
        categorias={categorias}
        fotoFallo={foto === 'error'}
        menuFallo={menu === 'error'}
        asesorActivo={asesorConfigurado()}
      />
    </main>
  );
}
