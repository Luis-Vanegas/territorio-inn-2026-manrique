import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { FormaRol } from '@/components/firmamento/FormaRol';
import { googleConfigurado } from '@/lib/auth/google';
import { tokenInvitacionValido } from '@/lib/auth/invitacion';
import { verInvitacion } from '@/lib/db/invitaciones.repo';
import { ipDesdeHeaders, registrarIntento, verificarLimite } from '@/lib/db/rateLimit';
import { BotonGoogle } from '../../entrar/_components/BotonGoogle';

// El token es una credencial: nada de indexar ni de mandarlo como Referer.
export const metadata: Metadata = {
  title: 'Invitación',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export const dynamic = 'force-dynamic';

/**
 * PÚBLICA a propósito (scripts/verificar-accesos.mjs la tiene en su lista): la
 * abre quien todavía no tiene sesión. Muestra a qué invita y manda a Google con
 * el token; el consumo pasa al volver (`/api/auth/google/retorno`), en una sola
 * sentencia. Esta página no da acceso a nada.
 *
 * Los enlaces que no sirven gastan cupo de `invitacion` (rate limit por IP).
 */
export default async function InvitacionPage({ params }: { params: Promise<{ token: string }> }) {
  const token = tokenInvitacionValido((await params).token);
  if (!token) notFound();

  const ip = ipDesdeHeaders(await headers());
  const limite = await verificarLimite(ip, 'invitacion');

  const vista = limite.permitido ? await verInvitacion(token) : null;
  if (limite.permitido && !vista?.vigente) await registrarIntento(ip, 'invitacion');

  const rol = vista?.tipo === 'moderador' ? 'equipo' : 'entidad';
  const para = vista?.tipo === 'moderador' ? 'el panel del equipo de Constelaciones' : `el panel de ${vista?.entidad ?? 'tu entidad'}`;

  return (
    <main className="margen-editorial pb-20 pt-10 sm:pt-16">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight text-tinta sm:text-5xl">
          Te invitaron a Firmamento
        </h1>

        {!limite.permitido ? (
          <p role="alert" className="border border-amarillo bg-amarillo/15 px-4 py-3 font-sans text-sm leading-relaxed text-tinta">
            Hubo demasiados intentos. Espera {limite.minutosRestantes} minuto{limite.minutosRestantes === 1 ? '' : 's'} y
            vuelve a abrir el enlace.
          </p>
        ) : !vista?.vigente ? (
          <>
            <p className="border border-amarillo bg-amarillo/15 px-4 py-3 font-sans text-sm leading-relaxed text-tinta">
              Esta invitación ya no sirve: venció, ya se usó o la revocaron. Pide una nueva a quien te la envió.
            </p>
            <Link href="/firmamento/entrar" className="font-sans text-base font-medium text-azul-texto underline underline-offset-4">
              Ir a la entrada de Firmamento
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <FormaRol rol={rol} />
              <p className="font-sans text-lg leading-snug text-tinta">Es para entrar a {para}.</p>
            </div>
            <p className="font-sans text-base leading-relaxed text-tinta/70">
              Entra con tu cuenta de Google y queda lista. El enlace sirve una sola vez: no lo reenvíes.
              {vista.tipo === 'entidad' && ' El panel de una entidad muestra datos agregados del territorio, nunca fichas de negocios.'}
            </p>
            <BotonGoogle
              destino={rol === 'equipo' ? '/firmamento/equipo' : '/firmamento/entidad'}
              disponible={googleConfigurado()}
              invitacion={token}
            />
          </>
        )}
      </div>
    </main>
  );
}
