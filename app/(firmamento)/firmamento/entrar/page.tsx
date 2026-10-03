import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { Estrella } from '@/components/firmamento/Estrella';
import { verificarSesion } from '@/lib/auth/admin';
import { googleConfigurado } from '@/lib/auth/google';
import { MENSAJES_INGRESO } from '@/lib/auth/mensajesIngreso';
import { sesionActual } from '@/lib/auth/usuario';
import { CAMARA_EMPRESAS } from '@/lib/cifras';
import type { RolFirmamento } from '@/lib/firmamento/navegacion';
import { formatearNumero } from '@/lib/formato';
import { aplanarComercios } from '@/lib/geo/comerciosOsm';
import { fechaLarga, type DatosConstelaciones } from '@/lib/geo/constelaciones';
import datosOsmJson from '@/public/firmamento/constelaciones.json';
import { BotonGoogle } from './_components/BotonGoogle';
import { FormularioEquipo } from './_components/FormularioEquipo';
import { PestanasEntrada } from './_components/PestanasEntrada';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Entra a Firmamento: el panel de datos de tu negocio, del equipo de Constelaciones o de tu entidad.',
};

// Lee las cookies de sesión: se renderiza por request.
export const dynamic = 'force-dynamic';

const datosOsm = datosOsmJson as unknown as DatosConstelaciones;

const ROLES: RolFirmamento[] = ['negocio', 'equipo', 'entidad'];

// Los de Google llegan de `/api/auth/google/retorno`; los otros, de las guardas
// de `lib/auth/firmamento.ts`. Nunca se muestra el texto real de un fallo.
const MENSAJES: Record<string, string> = {
  ...MENSAJES_INGRESO,
  sin_entidad:
    'Tu cuenta todavía no está asociada a una entidad. Escríbenos y el equipo de Constelaciones te da el acceso.',
};

const BENEFICIOS = [
  {
    titulo: 'Que te encuentren.',
    texto: 'Tu ficha en el mapa de Constelaciones, completa y en la categoría correcta.',
  },
  {
    titulo: 'Que te lleguen las oportunidades.',
    texto: 'Revisamos convocatorias y apoyos para negocios como el tuyo y te los mostramos en «Para ti».',
  },
  {
    titulo: 'Que veas lo que logras.',
    texto: 'Cuántos vecinos vieron tu ficha y cuántos te escribieron.',
  },
];

function Aviso({ children, tono = 'normal' }: { children: React.ReactNode; tono?: 'normal' | 'error' }) {
  return (
    <p
      role={tono === 'error' ? 'alert' : undefined}
      className={`border-l-2 bg-noche px-4 py-3 font-sans text-sm leading-relaxed text-estrella ${
        tono === 'error' ? 'border-ladrillo' : 'border-sodio'
      }`}
    >
      {children}
    </p>
  );
}

function Separador() {
  return (
    <div className="my-5 flex items-center gap-4" aria-hidden="true">
      <span className="h-px flex-1 bg-trazo-2" />
      <span className="font-sans text-sm text-tenue">o</span>
      <span className="h-px flex-1 bg-trazo-2" />
    </div>
  );
}

export default async function EntrarFirmamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string; error?: string }>;
}) {
  const { rol, error } = await searchParams;
  const inicial = ROLES.find((r) => r === rol) ?? 'negocio';
  const mensajeError = error ? MENSAJES[error] : null;
  const conGoogle = googleConfigurado();

  // Quien ya entró no tiene que volver a identificarse: se le ofrece seguir. No
  // se redirige solo, porque puede querer entrar con otra cuenta.
  const [vecino, moderador] = await Promise.all([sesionActual(), verificarSesion()]);

  // Cifras del lado izquierdo: las mismas de la portada y de /firmamento, de los
  // mismos archivos. Ninguna se escribe a mano.
  const comercios = aplanarComercios(datosOsm).length;
  const fechaOsm = fechaLarga(datosOsm.osm_base);
  const cifras = [
    {
      valor: formatearNumero(comercios),
      etiqueta: 'comercios mapeados en OpenStreetMap',
      fuente: `© colaboradores de OpenStreetMap (ODbL) · al ${fechaOsm}`,
    },
    {
      valor: formatearNumero(datosOsm.constelaciones.length),
      etiqueta: 'constelaciones comerciales',
      fuente: `Agrupación de esos comercios (HDBSCAN) · corrida del ${fechaLarga(datosOsm.fecha_corrida)}`,
    },
    {
      valor: CAMARA_EMPRESAS.valor,
      etiqueta: 'empresas con registro mercantil en Manrique',
      fuente: `${CAMARA_EMPRESAS.fuente} · ${CAMARA_EMPRESAS.fecha}`,
    },
  ];

  const paneles: Record<RolFirmamento, React.ReactNode> = {
    negocio: (
      <div className="flex flex-col gap-4">
        {vecino && (
          <Aviso>
            Ya entraste como {vecino.nombre}.{' '}
            <Link href="/firmamento/negocio" className="font-medium text-sodio underline underline-offset-4">
              Ir a mi panel
            </Link>
          </Aviso>
        )}
        <BotonGoogle destino="/firmamento/negocio" disponible={conGoogle} />
        <p className="text-center font-sans text-sm text-tenue">
          Sirve para entrar y para registrarte. No creas ninguna contraseña.
        </p>
        <div className="rounded-xl border border-dashed border-trazo-2 p-4 font-sans text-sm leading-relaxed text-tenue">
          <p className="font-medium text-estrella">¿Tu negocio aún no está en la red?</p>
          <p className="mt-1">
            <Link href="/aliados/registro" className="inline-flex min-h-[44px] items-center text-sodio underline underline-offset-4">
              Regístralo gratis
            </Link>
          </p>
        </div>
      </div>
    ),
    equipo: (
      <div>
        {moderador && (
          <div className="mb-5">
            <Aviso>
              Ya entraste como {moderador.email}.{' '}
              <Link href="/firmamento/equipo" className="font-medium text-sodio underline underline-offset-4">
                Ir al panel del equipo
              </Link>
            </Aviso>
          </div>
        )}
        <FormularioEquipo />
        {conGoogle && (
          <>
            <Separador />
            <BotonGoogle destino="/firmamento/equipo" disponible={conGoogle} />
          </>
        )}
      </div>
    ),
    entidad: (
      <div className="flex flex-col gap-4">
        <BotonGoogle destino="/firmamento/entidad" disponible={conGoogle} />
        <p className="font-sans text-sm leading-relaxed text-tenue">
          Las entidades ven solo datos agregados y pueden proponer convocatorias.
        </p>
        <div className="rounded-xl border border-dashed border-trazo-2 p-4 font-sans text-sm leading-relaxed text-tenue">
          <p className="font-medium text-estrella">¿Tu entidad aún no tiene acceso?</p>
          <p className="mt-1">
            <Link href="/contacto" className="inline-flex min-h-[44px] items-center text-sodio underline underline-offset-4">
              Escríbenos
            </Link>
          </p>
        </div>
      </div>
    ),
  };

  return (
    <main className="modo-noche relative min-h-screen overflow-hidden lg:grid lg:grid-cols-[55fr_45fr] lg:grid-rows-[1fr_auto]">
      {/* Foto de la ladera (decorativa: el sitio ya dice dónde es). En el celular
          es una franja bajo el título; en escritorio ocupa la columna izquierda.
          El velo es neutro (noche) y es lo que mantiene legible el texto encima. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[300px] lg:inset-y-0 lg:right-auto lg:h-auto lg:w-[55%]"
      >
        <Image
          src="/fotos/manrique-iglesia.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-noche from-[8%] via-noche/70 to-noche/50 lg:from-[35%] lg:via-noche/60 lg:to-noche/30" />
      </div>

      {/* Marca, titular y frase */}
      <section className="relative z-10 flex min-h-[300px] flex-col justify-between px-5 pb-6 pt-5 sm:px-10 lg:col-start-1 lg:row-start-1 lg:px-14 lg:pb-8 lg:pt-8">
        <Link href="/" className="flex min-h-[44px] w-fit items-center gap-3">
          <Image src="/logos/isotipo_app.png" alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
          <span className="flex flex-col leading-tight">
            <span className="font-sans text-base font-medium text-estrella">Constelaciones · Manrique</span>
            <span className="font-sans text-xs text-tenue">Datos de tu barrio</span>
          </span>
        </Link>

        <div className="mt-8">
          <h1 className="font-italica text-[clamp(2.75rem,11vw,5.5rem)] font-light leading-[0.95] tracking-tight text-estrella">
            Firma
            <b className="font-display font-semibold not-italic text-sodio">mento</b>
          </h1>
          <p className="mt-4 max-w-md font-display text-xl leading-snug text-estrella lg:text-2xl">
            Los datos de tu barrio, trabajando para tu negocio.
          </p>
        </div>
      </section>

      {/* Tarjeta de ingreso */}
      <section className="relative z-10 px-5 pb-10 pt-2 sm:px-10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:flex lg:items-center lg:justify-center lg:px-10 lg:py-12">
        <div className="w-full max-w-md rounded-2xl border border-trazo-2 bg-noche-2 p-6 sm:p-8">
          <h2 className="font-display text-3xl font-medium leading-tight text-estrella">Entra a Firmamento</h2>
          <p className="mt-1.5 font-sans text-sm text-tenue">Elige cómo participas en la red.</p>

          {mensajeError && (
            <div className="mt-5">
              <Aviso tono="error">{mensajeError}</Aviso>
            </div>
          )}

          <div className="mt-5">
            <PestanasEntrada inicial={inicial} paneles={paneles} />
          </div>

          <p className="mt-4 text-center">
            <Link
              href="/firmamento"
              className="inline-flex min-h-[44px] items-center font-sans text-sm text-sodio underline underline-offset-4"
            >
              Ver el Firmamento público sin cuenta
            </Link>
          </p>
        </div>
      </section>

      {/* Beneficios y cifras */}
      <section className="relative z-10 px-5 pb-10 sm:px-10 lg:col-start-1 lg:row-start-2 lg:px-14 lg:pb-10">
        <ul className="flex flex-col gap-3.5">
          {BENEFICIOS.map((b) => (
            <li key={b.titulo} className="flex gap-3 font-sans text-base leading-relaxed">
              <Estrella tamano={16} className="mt-1.5 shrink-0" />
              <p className="max-w-xl text-tenue">
                <strong className="font-medium text-estrella">{b.titulo}</strong> {b.texto}
              </p>
            </li>
          ))}
        </ul>

        <ul className="mt-8 grid gap-6 border-t border-trazo-2 pt-6 sm:grid-cols-3">
          {cifras.map((c) => (
            <li key={c.etiqueta}>
              <p className="font-cifra text-4xl font-medium leading-none tabular-nums text-sodio">{c.valor}</p>
              <p className="mt-2 font-sans text-sm leading-snug text-estrella">{c.etiqueta}</p>
              <p className="mt-1.5 font-cifra text-xs leading-snug text-tenue">{c.fuente}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
