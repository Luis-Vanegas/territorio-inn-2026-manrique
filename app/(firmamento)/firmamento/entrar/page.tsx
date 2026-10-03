import type { Metadata } from 'next';
import Link from 'next/link';

import { ConstelacionViva, fuenteConstelacionViva } from '@/components/firmamento/ConstelacionViva';
import { FormaRol } from '@/components/firmamento/FormaRol';
import { Plegable } from '@/components/firmamento/Plegable';
import { verificarSesion } from '@/lib/auth/admin';
import { googleConfigurado } from '@/lib/auth/google';
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
};

const ROLES: { rol: RolFirmamento; titulo: string; descripcion: string }[] = [
  { rol: 'negocio', titulo: 'Tengo un negocio', descripcion: 'Tu ficha, tus clientes y las oportunidades para ti.' },
  { rol: 'equipo', titulo: 'Soy del equipo', descripcion: 'Moderación, convocatorias y datos de la red.' },
  { rol: 'entidad', titulo: 'Represento una entidad', descripcion: 'Datos del territorio y convocatorias.' },
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
 * La puerta de Firmamento (DESIGN.md › Firmamento con sesión › Puerta): un menú
 * de tres roles que se despliegan en el lugar, de día y bajo el encabezado del
 * sitio. Sin foto, sin beneficios, sin cifras: aquí se viene a entrar.
 *
 * Cada fila es un `Plegable` con `name="rol"` (uno abierto a la vez, nativo del
 * `<details>`): funciona sin JS y el servidor abre la del `?rol=` que mandan las
 * guardas. La lógica de ingreso es la de siempre: Google por
 * `/api/auth/google/iniciar` con destino validado, y la Server Action del equipo.
 */
export default async function EntrarFirmamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string; error?: string }>;
}) {
  const { rol, error } = await searchParams;
  const abierto = ROLES.find((r) => r.rol === rol)?.rol;
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
            <Link href="/firmamento/negocio" className={CLASE_ENLACE}>
              Ir a mi panel
            </Link>
          </Aviso>
        )}
        <BotonGoogle destino="/firmamento/negocio" disponible={conGoogle} />
        <p className="font-sans text-sm text-tinta/70">Sirve para entrar y para registrarte. No creas ninguna contraseña.</p>
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

  return (
    <main className="margen-editorial pb-20 pt-6 sm:pt-16">
      <div className="mx-auto flex max-w-xl flex-col lg:grid lg:max-w-5xl lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-16">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <h1 className="font-display text-4xl font-medium leading-tight tracking-tight text-tinta sm:text-5xl">
            Entra a Firmamento
          </h1>
          <p className="mt-3 font-sans text-base text-tinta/70">Elige cómo participas en la red.</p>

          {mensajeError && (
            <p
              role="alert"
              className="mt-6 border border-amarillo bg-amarillo/15 px-4 py-3 font-sans text-sm leading-relaxed text-tinta"
            >
              {mensajeError}
            </p>
          )}

          <div className="mt-8 divide-y divide-tinta/12 overflow-hidden rounded-2xl border border-tinta/12">
            {ROLES.map((r) => (
              <Plegable
                key={r.rol}
                name="rol"
                abierto={r.rol === abierto}
                className="group"
                claseResumen="flex min-h-[72px] items-center gap-4 px-4 py-3 transition-colors hover:bg-tinta/[0.03] focus-visible:[outline-offset:-3px] sm:px-5"
                claseContenido="flex flex-col gap-4 px-4 pb-6 pt-1 sm:px-5 sm:pl-[5.25rem]"
                resumen={
                  <>
                    <FormaRol rol={r.rol} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-sans text-lg font-medium leading-snug text-tinta">{r.titulo}</span>
                      <span className="block font-sans text-sm leading-snug text-tinta/70">{r.descripcion}</span>
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      aria-hidden="true"
                      focusable="false"
                      className="shrink-0 text-tinta/70 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                    >
                      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                }
              >
                {acciones[r.rol]}
              </Plegable>
            ))}
          </div>

          <p className="mt-6 font-sans text-base text-tinta/70">
            ¿No estás en la red?{' '}
            <Link href="/aliados/registro" className={`inline-flex min-h-[44px] items-center ${CLASE_ENLACE}`}>
              Regístrate gratis
            </Link>
          </p>
        </div>

        {/* Constelación viva compacta (DESIGN.md › Firmamento › Constelación viva):
            decorativa y con su frase al lado. Va después en el HTML para que el
            lector de pantalla llegue primero al título; en el celular sube como
            franja baja de 64 px para no empujar el menú de roles (a 320 × 700 la
            última fila sigue en pantalla). */}
        <div className="order-first mb-5 flex items-center gap-4 rounded-2xl bg-noche px-4 py-2 lg:order-none lg:col-start-2 lg:row-start-1 lg:mb-0 lg:flex-col lg:items-stretch lg:gap-5 lg:p-6">
          <ConstelacionViva variante="compacta" className="h-16 shrink-0 lg:h-auto lg:w-full" />
          <p className="font-sans text-sm leading-snug text-tenue lg:text-base">
            Los negocios de Manrique forman constelaciones.{' '}
            <span className="hidden text-estrella sm:inline">Entra y cuida la tuya.</span>
          </p>
          <p className="hidden font-sans text-xs leading-relaxed text-tenue lg:block">{fuenteConstelacionViva()}</p>
        </div>
      </div>
    </main>
  );
}
