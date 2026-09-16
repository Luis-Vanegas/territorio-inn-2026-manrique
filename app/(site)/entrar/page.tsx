import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { googleConfigurado } from '@/lib/auth/google';
import { sesionActual } from '@/lib/auth/usuario';
import { AccesoPorEnlace } from './_components/AccesoPorEnlace';

export const metadata: Metadata = {
  title: 'Entrar · Constelaciones',
  description: 'Entra a tu cuenta de Constelaciones para gestionar tu negocio en la Comuna 3.',
  // Es una puerta, no contenido, y su razón de existir es manejar credenciales.
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Los errores del retorno de Google llegan como ?error=<clave>. El texto real
 * del fallo nunca se muestra: los errores de OAuth traen identificadores de
 * cliente y descripciones internas que a la persona no le sirven de nada.
 */
const MENSAJE_ERROR: Record<string, string> = {
  estado: 'La sesión tardó demasiado. Intenta entrar otra vez.',
  google: 'No pudimos confirmar tu cuenta de Google. Intenta de nuevo.',
  limite: 'Hubo demasiados intentos. Espera unos minutos.',
  sesion: 'No pudimos abrir tu sesión. Intenta de nuevo.',
  sin_google: 'El ingreso con Google no está disponible por ahora.',
  // Deliberadamente vago sobre el motivo: confirmarle a quien intenta entrar
  // que ese correo ya está registrado le regala información sobre la cuenta
  // de otra persona. El detalle queda en el log del servidor, para el equipo.
  correo_tomado:
    'No pudimos entrar con esa cuenta. Escríbenos y lo resolvemos contigo.',
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Quien ya entró no tiene nada que hacer en la puerta.
  if (await sesionActual()) redirect('/mi-cuenta');

  const { error } = await searchParams;
  const mensajeError = error ? MENSAJE_ERROR[error] : null;
  const conGoogle = googleConfigurado();

  return (
    <main className="seccion">
      {/* Columna angosta y centrada: es un formulario de acceso, no una página
          de lectura. El ancho completo del sitio acá deja los dos caminos tan
          separados que hay que barrer la pantalla para compararlos. */}
      <div className="mx-auto max-w-md">
        <header>
          <span className="font-mono text-xs text-terracota-texto">Constelaciones</span>
          <h1 className="mt-3 font-display text-4xl font-medium leading-[1.05] text-tinta">
            Entra a tu cuenta
          </h1>
          <p className="mt-4 font-sans leading-relaxed text-tinta/70">
            Desde aquí gestionas tu negocio y accedes a las rutas de
            formalización, los apoyos y el asesor.
          </p>
        </header>

        {mensajeError && (
          <p
            role="alert"
            className="mt-8 border-l-2 border-terracota bg-terracota/[0.04] px-5 py-4 font-sans text-sm leading-relaxed text-tinta"
          >
            {mensajeError}
          </p>
        )}

        {conGoogle ? (
          <>
            <a
              href="/api/auth/google/iniciar"
              className="mt-8 flex min-h-[52px] w-full items-center justify-center gap-3 border border-tinta/25 px-6 font-mono text-sm text-tinta transition-colors hover:border-terracota hover:text-terracota-texto"
            >
              {/* aria-hidden: el texto del enlace ya dice qué hace; un lector de
                  pantalla no gana nada anunciando el logotipo. */}
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
                />
                <path
                  fill="#34A853"
                  d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
                />
                <path
                  fill="#FBBC05"
                  d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
                />
                <path
                  fill="#EA4335"
                  d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
                />
              </svg>
              Continuar con Google
            </a>

            <p className="mt-3 text-center font-sans text-sm text-tinta/55">
              Sirve para entrar y para registrarte. No creas ninguna contraseña.
            </p>
          </>
        ) : (
          <p className="mt-8 border-l-2 border-tinta/20 px-5 py-4 font-sans text-sm leading-relaxed text-tinta/70">
            El ingreso con Google estará disponible muy pronto. Mientras tanto,
            si ya tienes tu negocio registrado, entra con el enlace de abajo.
          </p>
        )}

        {/* Separador con la palabra al medio. aria-hidden porque es decoración:
            el lector de pantalla ya distingue las dos secciones por sus
            encabezados y controles. */}
        <div className="my-8 flex items-center gap-4" aria-hidden="true">
          <span className="h-px flex-1 bg-tinta/12" />
          <span className="font-mono text-xs text-tinta/40">o</span>
          <span className="h-px flex-1 bg-tinta/12" />
        </div>

        <AccesoPorEnlace />

        <p className="mt-10 border-t border-tinta/12 pt-8 text-center font-sans text-sm leading-relaxed text-tinta/65">
          ¿Aún no tienes tu negocio en Constelaciones?{' '}
          <Link
            href="/aliados/registro"
            className="underline decoration-terracota underline-offset-4 hover:text-terracota-texto"
          >
            Regístralo gratis
          </Link>
        </p>
      </div>
    </main>
  );
}
