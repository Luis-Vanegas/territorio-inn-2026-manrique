import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { sesionActual } from '@/lib/auth/usuario';
import { negociosDe } from '@/lib/db/usuarios.repo';
import { salir } from '@/lib/actions/sesionUsuario';
import { PASOS, VIDEOS } from '@/lib/formalizacion';
import { GUIAS } from '@/lib/marca';

export const metadata: Metadata = {
  title: 'Mi cuenta · Constelaciones',
  // Área privada: no se indexa ni se sigue.
  robots: { index: false, follow: false },
};

// Lee la sesión y la base en cada carga: nada que prerenderizar.
export const dynamic = 'force-dynamic';

const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: 'En revisión',
  aprobado: 'Publicado',
  rechazado: 'Necesita correcciones',
  archivado: 'Archivado',
};

export default async function MiCuentaPage() {
  const sesion = await sesionActual();

  // El guard vive acá, en el Server Component, y no en un middleware: la
  // verificación necesita node:crypto y la cookie, igual que el guard de
  // /admin. Mismo criterio documentado en lib/auth/admin.ts.
  if (!sesion) redirect('/entrar');

  const negocios = await negociosDe(sesion.id);

  return (
    <main className="seccion">
      <header className="max-w-3xl">
        <span className="font-sans text-xs text-tinta/65">Tu espacio</span>

        <h1 className="mt-4 font-display text-4xl font-medium leading-[1] text-tinta sm:text-5xl">
          Hola, {sesion.nombre}
        </h1>

        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
          Aquí ves tus negocios, el estado de cada uno y las herramientas que
          preparamos para quienes están registrados.
        </p>
      </header>

      <section className="mt-16 border-t border-tinta/12 pt-10">
        <h2 className="font-sans text-xs uppercase tracking-wider text-tinta/60">Mis negocios</h2>

        {negocios.length === 0 ? (
          <div className="mt-6 max-w-xl">
            <p className="font-sans leading-relaxed text-tinta/70">
              Todavía no tienes ningún negocio registrado con esta cuenta.
            </p>
            <Link
              href="/aliados/registro"
              className="mt-6 inline-block border border-azul-texto bg-azul-texto px-6 py-3 font-sans text-sm text-hueso transition-colors hover:bg-transparent hover:text-azul-texto"
            >
              Registrar mi negocio →
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {negocios.map((negocio) => (
              <li
                key={negocio.id}
                className="flex flex-col border border-tinta/12 p-6 transition-colors hover:border-azul"
              >
                <h3 className="font-display text-xl font-medium text-tinta">{negocio.nombre}</h3>
                <p className="mt-1 font-sans text-xs text-tinta/60">
                  {ETIQUETA_ESTADO[negocio.estado] ?? negocio.estado}
                </p>
                <div className="mt-auto pt-5">
                  <Link
                    href={`/aliados/estado/${negocio.token_publico}`}
                    className="font-sans text-sm text-azul-texto underline decoration-azul underline-offset-4"
                  >
                    Ver y editar →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Lo que la persona gana por estar registrada. Va después de sus
          negocios porque lo primero que quiere ver al entrar es si su ficha
          quedó publicada, no el material de apoyo. */}
      <section className="mt-16 border-t border-tinta/12 pt-10">
        <h2 className="font-sans text-xs uppercase tracking-wider text-tinta/60">
          Ayuda para tu negocio
        </h2>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <article className="flex flex-col border border-tinta/12 p-6">
            <h3 className="font-display text-lg font-medium text-tinta">
              Rutas de formalización
            </h3>
            <p className="mt-3 font-sans text-sm leading-relaxed text-tinta/70">
              {PASOS.length} trámites, apoyos económicos y formación gratuita, con el enlace
              oficial de cada uno.
            </p>
            <div className="mt-auto pt-5">
              <Link
                href="/formalizacion"
                className="font-sans text-sm text-azul-texto underline decoration-azul underline-offset-4"
              >
                Ver las rutas →
              </Link>
            </div>
          </article>

          <article className="flex flex-col border border-tinta/12 p-6">
            <h3 className="font-display text-lg font-medium text-tinta">Videos y tutoriales</h3>
            <p className="mt-3 font-sans text-sm leading-relaxed text-tinta/70">
              {VIDEOS.length} canales oficiales donde explican los trámites paso a paso.
            </p>
            <div className="mt-auto pt-5">
              <Link
                href="/formalizacion#videos"
                className="font-sans text-sm text-azul-texto underline decoration-azul underline-offset-4"
              >
                Ver los videos →
              </Link>
            </div>
          </article>

          <article className="flex flex-col border border-tinta/12 p-6">
            <h3 className="font-display text-lg font-medium text-tinta">Asesor</h3>
            <p className="mt-3 font-sans text-sm leading-relaxed text-tinta/70">
              Pregunta lo que necesites sobre trámites y apoyos. Tócalo en el botón redondo
              de abajo a la derecha, desde cualquier página.
            </p>
            <div className="mt-auto pt-5">
              <span className="font-sans text-sm text-tinta/60">
                {negocios.length > 0
                  ? 'Ya conoce los datos de tu negocio'
                  : 'Si registras tu negocio, te responde con sus datos'}
              </span>
            </div>
          </article>

          <article className="flex flex-col border border-tinta/12 p-6">
            <h3 className="font-display text-lg font-medium text-tinta">Marca</h3>
            <p className="mt-3 font-sans text-sm leading-relaxed text-tinta/70">
              {GUIAS.length} guías del equipo: fotos, redes, contenido y cómo presentar tu
              negocio.
            </p>
            <div className="mt-auto pt-5">
              <Link
                href="/marca"
                className="font-sans text-sm text-azul-texto underline decoration-azul underline-offset-4"
              >
                Ver las guías →
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="mt-16 border-t border-tinta/12 pt-10">
        <form action={salir}>
          <button
            type="submit"
            className="font-sans text-sm text-tinta/60 underline decoration-azul underline-offset-4 hover:text-azul-texto"
          >
            Cerrar sesión
          </button>
        </form>
      </section>
    </main>
  );
}
