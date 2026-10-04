import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { verificarSesion } from '@/lib/auth/admin';
import { googleConfigurado } from '@/lib/auth/google';
import { rutaInterna } from '@/lib/auth/destino';
import { MENSAJES_INGRESO } from '@/lib/auth/mensajesIngreso';
import { sesionActual } from '@/lib/auth/usuario';
import type { RolFirmamento } from '@/lib/firmamento/navegacion';
import { BotonGoogle } from './_components/BotonGoogle';
import { FormularioEquipo } from './_components/FormularioEquipo';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Entra a Firmamento: el panel de tu negocio, del equipo de Constelaciones o de tu entidad.',
};

// Lee las cookies de sesión: se renderiza por request.
export const dynamic = 'force-dynamic';

// Los de Google llegan de `/api/auth/google/retorno`; los otros, de las guardas
// de `lib/auth/firmamento.ts`. Nunca se muestra el texto real de un fallo.
const MENSAJES: Record<string, string> = {
  ...MENSAJES_INGRESO,
  sin_entidad:
    'Tu cuenta todavía no está asociada a una entidad. Escríbenos y el equipo de Constelaciones te da el acceso.',
  sin_equipo:
    'Esa cuenta de Google no tiene acceso al panel del equipo. Pide una invitación a un moderador o entra con tu correo y contraseña.',
};

const ROLES: { rol: RolFirmamento; titulo: string }[] = [
  { rol: 'negocio', titulo: 'Mi negocio' },
  { rol: 'equipo', titulo: 'Equipo' },
  { rol: 'entidad', titulo: 'Entidad' },
];

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-l-2 border-azul bg-azul/[0.04] px-4 py-3 font-sans text-sm leading-relaxed text-tinta">
      {children}
    </p>
  );
}

const CLASE_ENLACE = 'font-medium text-azul-texto underline underline-offset-4';

/**
 * La puerta de Firmamento (DESIGN.md › Firmamento con sesión › Puerta), como la
 * pantalla de la asesoría (Luis, 4-oct-2026): foto de Manrique a la izquierda
 * (arriba en el celular) y a la derecha la tarjeta con tres pestañas. Con los
 * colores del tema, sin beneficios ni cifras, y sin enlace de registro: el
 * registro se ofrece después de entrar con Google, en «Mi negocio».
 *
 * Las pestañas son enlaces a `?rol=`: el servidor pinta la elegida, así que
 * funcionan sin JS y las guardas abren la que corresponde (con su aviso de
 * `?error=`). La lógica de ingreso es la de siempre: Google por
 * `/api/auth/google/iniciar` con destino validado, y la Server Action del equipo.
 */
export default async function EntrarFirmamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string; error?: string; destino?: string }>;
}) {
  const { rol, error, destino } = await searchParams;
  // Adónde vuelve el negocio tras Google (la guarda del registro lo manda). Solo rutas del panel del negocio.
  const destinoNegocio = rutaInterna(destino)?.startsWith('/firmamento/negocio') ? destino! : '/firmamento/negocio';
  const abierto = ROLES.find((r) => r.rol === rol)?.rol ?? 'negocio';
  const mensajeError = error ? MENSAJES[error] : null;
  const conGoogle = googleConfigurado();

  // Quien ya entró no tiene que volver a identificarse: se le ofrece seguir. No
  // se redirige solo, porque puede querer entrar con otra cuenta.
  const [vecino, moderador] = await Promise.all([sesionActual(), verificarSesion()]);

  const acciones: Record<RolFirmamento, React.ReactNode> = {
    negocio: (
      <>
        {vecino && (
          <Aviso>
            Ya entraste como {vecino.nombre}.{' '}
            <Link href={destinoNegocio} className={CLASE_ENLACE}>
              {destinoNegocio === '/firmamento/negocio' ? 'Ir a mi panel' : 'Seguir'}
            </Link>
          </Aviso>
        )}
        <BotonGoogle destino={destinoNegocio} disponible={conGoogle} />
        <p className="font-sans text-sm text-tinta/70">Sirve para entrar y para registrarte. No creas ninguna contraseña.</p>
        <p className="font-sans text-sm text-tinta/70">
          ¿Te registró el equipo? Usa el enlace que te enviamos por WhatsApp.
        </p>
      </>
    ),
    equipo: (
      <>
        {moderador && (
          <Aviso>
            Ya entraste como {moderador.email}.{' '}
            <Link href="/firmamento/equipo" className={CLASE_ENLACE}>
              Ir al panel del equipo
            </Link>
          </Aviso>
        )}
        <FormularioEquipo />
        {conGoogle && (
          <>
            <div className="flex items-center gap-4" aria-hidden="true">
              <span className="h-px flex-1 bg-tinta/12" />
              <span className="font-sans text-sm text-tinta/70">o</span>
              <span className="h-px flex-1 bg-tinta/12" />
            </div>
            <BotonGoogle destino="/firmamento/equipo" disponible={conGoogle} />
          </>
        )}
      </>
    ),
    entidad: (
      <>
        <BotonGoogle destino="/firmamento/entidad" disponible={conGoogle} />
        <p className="font-sans text-sm leading-relaxed text-tinta/70">
          Las entidades ven solo datos agregados y pueden proponer convocatorias. ¿Tu entidad aún no tiene
          acceso?{' '}
          <Link href="/contacto" className={CLASE_ENLACE}>
            Escríbenos
          </Link>
          .
        </p>
      </>
    ),
  };

  // Al cambiar de pestaña el destino del negocio se conserva; el aviso de error, no.
  const hrefRol = (r: RolFirmamento) =>
    `/firmamento/entrar?${new URLSearchParams(r === 'negocio' && destino ? { rol: r, destino } : { rol: r })}`;

  return (
    <main className="grid lg:min-h-[calc(100dvh-4.5rem)] lg:grid-cols-2">
      {/* La foto es el paisaje: alt vacío no, porque cuenta dónde estás. El texto
          encima va en tonos fijos claros sobre un velo oscuro: es la foto, no la página. */}
      <div className="relative h-44 overflow-hidden sm:h-56 lg:h-auto">
        <Image
          src="/fotos/manrique-iglesia.jpg"
          alt="La aguja blanca de la iglesia de Manrique entre miles de casas de ladrillo que trepan la ladera."
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-noche/85 via-noche/30 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-12">
          <p className="font-display text-3xl font-medium leading-none text-estrella sm:text-5xl">
            Firma<span className="text-sodio">mento</span>
          </p>
          <p className="mt-2 max-w-md font-sans text-sm leading-snug text-estrella sm:text-base">
            Los datos de tu barrio, trabajando para tu negocio.
          </p>
        </div>
      </div>

      <div className="flex items-start justify-center px-4 py-8 sm:px-8 lg:items-center lg:py-12">
        <div className="w-full max-w-md rounded-2xl border border-tinta/12 bg-hueso p-5 shadow-[0_4px_24px_rgb(11_16_38/0.08)] sm:p-7">
          <h1 className="font-display text-3xl font-medium leading-tight text-tinta">Entra a Firmamento</h1>
          <p className="mt-1 font-sans text-sm text-tinta/70">Elige cómo participas en la red.</p>

          {mensajeError && (
            <p
              role="alert"
              className="mt-5 border border-amarillo bg-amarillo/15 px-4 py-3 font-sans text-sm leading-relaxed text-tinta"
            >
              {mensajeError}
            </p>
          )}

          <nav aria-label="Cómo participas" className="mt-5 grid grid-cols-3 gap-1 rounded-xl border border-tinta/12 p-1">
            {ROLES.map((r) => {
              const activa = r.rol === abierto;
              return (
                <Link
                  key={r.rol}
                  href={hrefRol(r.rol)}
                  replace
                  scroll={false}
                  aria-current={activa ? 'page' : undefined}
                  className={`flex min-h-[44px] items-center justify-center rounded-lg px-2 text-center font-sans text-sm transition-colors ${
                    activa ? 'bg-azul-texto font-medium text-hueso' : 'text-tinta/75 hover:bg-tinta/5 hover:text-tinta'
                  }`}
                >
                  {r.titulo}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 flex flex-col gap-4">{acciones[abierto]}</div>
        </div>
      </div>
    </main>
  );
}
