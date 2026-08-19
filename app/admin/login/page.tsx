import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { verificarSesion } from '@/lib/auth/admin';
import { FormularioLogin } from './_components/FormularioLogin';

export const metadata: Metadata = {
  title: 'Entrar · Moderación',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  // Con sesión activa no tiene sentido mostrar el login.
  if (await verificarSesion()) {
    redirect('/admin/aliados');
  }

  return (
    <main className="margen-editorial flex min-h-screen flex-col justify-center py-24">
      <div className="w-full max-w-sm">
        <span className="font-mono text-xs text-tinta/50">Territorio INN 2026</span>

        <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-tinta">
          Moderación
        </h1>

        <p className="mt-3 font-sans text-sm text-tinta/60">
          Acceso para el equipo. Si no tenés credenciales, pedilas al equipo del proyecto.
        </p>

        <FormularioLogin />
      </div>
    </main>
  );
}
