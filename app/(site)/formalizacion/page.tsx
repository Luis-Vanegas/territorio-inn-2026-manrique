import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { sesionActual } from '@/lib/auth/usuario';
import { negociosDe } from '@/lib/db/usuarios.repo';
import { PASOS, VIDEOS } from '@/lib/formalizacion';
import { ContenidoFormalizacion } from '@/components/formalizacion/ContenidoFormalizacion';

export const metadata: Metadata = {
  title: 'Formalización · Constelaciones',
  description:
    'Rutas de formalización, apoyos económicos y formación gratuita para negocios registrados de la Comuna 3 — Manrique, Medellín.',
};

// Lee la sesión en cada carga: el contenido depende de quién está entrando, así
// que no hay nada que prerenderizar.
export const dynamic = 'force-dynamic';

/**
 * Puerta de la página: sin sesión se ve QUÉ hay adentro, nunca el contenido.
 *
 * ── Por qué una vista previa y no un redirect seco a /entrar ──
 *
 * Esta página es el motivo por el que alguien se registra. Mandar a la puerta
 * a quien llega por primera vez le pide la cuenta antes de decirle qué gana
 * con ella, y se va. La vista previa nombra las entidades y cuenta cuántos
 * recursos hay; los enlaces, los requisitos y los videos quedan del otro lado.
 *
 * Lo que importa para la seguridad: los datos NO viajan al navegador de quien
 * no entró. El `return` corta antes de renderizar el catálogo, así que no hay
 * nada que descubrir mirando el HTML.
 */
function VistaPrevia() {
  const entidades = [...new Set(PASOS.map((p) => p.entidad))];

  return (
    <main className="seccion">
      <div className="mx-auto max-w-2xl">
        <header>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-azul-texto">
            <span className="h-1.5 w-1.5 rounded-full bg-azul-texto" aria-hidden="true" />
            solo para registrados
          </span>

          <h1 className="mt-4 font-display text-5xl font-medium leading-[0.95] text-tinta sm:text-6xl">
            Formalización
          </h1>

          <p className="mt-6 font-sans text-lg leading-relaxed text-tinta/70">
            Formalizar un negocio no es un solo trámite: son varios, en orden, y
            casi todos con una entidad distinta detrás. Reunimos el camino
            completo para los negocios de la Comuna 3.
          </p>

          <div className="relative mt-8 aspect-[16/7] w-full overflow-hidden">
            <Image
              src="/fotos/manrique-casas-arcoiris.jpg"
              alt="Casas pintadas de colores en un cerro de Manrique, Comuna 3"
              fill
              preload
              sizes="(max-width: 640px) 100vw, 672px"
              className="object-cover"
            />
          </div>
        </header>

        <section className="mt-12 border-t border-tinta/12 pt-10">
          <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/60">
            Lo que encuentras adentro
          </h2>

          <dl className="mt-6 grid gap-6 sm:grid-cols-3">
            <div>
              <dt className="font-display text-4xl font-medium text-tinta">
                {PASOS.filter((p) => p.tipo === 'tramite').length}
              </dt>
              <dd className="mt-1 font-sans text-sm text-tinta/70">
                trámites explicados paso a paso
              </dd>
            </div>
            <div>
              <dt className="font-display text-4xl font-medium text-tinta">
                {PASOS.filter((p) => p.tipo === 'fondo').length}
              </dt>
              <dd className="mt-1 font-sans text-sm text-tinta/70">
                apoyos económicos a los que puedes postularte
              </dd>
            </div>
            <div>
              <dt className="font-display text-4xl font-medium text-tinta">{VIDEOS.length}</dt>
              <dd className="mt-1 font-sans text-sm text-tinta/70">
                videos verificados de canales oficiales
              </dd>
            </div>
          </dl>

          <p className="mt-8 font-sans leading-relaxed text-tinta/70">
            Con enlaces oficiales de {entidades.join(', ')} — y el asesor que
            responde según la situación de tu propio negocio.
          </p>
        </section>

        <section className="mt-12 border-t border-tinta/12 pt-10">
          <p className="font-sans leading-relaxed text-tinta/70">
            Todo esto es gratis. Solo pedimos que registres tu negocio, porque
            así el asesor sabe de qué negocio hablamos y podemos darte
            visibilidad en el directorio.
          </p>

          <Link
            href="/entrar"
            className="mt-8 inline-block border border-azul-texto bg-azul-texto px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-azul-texto"
          >
            Entrar o registrarme →
          </Link>
        </section>

        <Link
          href="/"
          className="mt-20 inline-block font-mono text-sm text-tinta/65 underline decoration-azul underline-offset-4 hover:text-azul-texto"
        >
          ← Volver a Constelaciones
        </Link>
      </div>
    </main>
  );
}

export default async function FormalizacionPage() {
  const sesion = await sesionActual();
  if (!sesion) return <VistaPrevia />;

  // Personalizar por `formalidad` solo cuando no hay ambigüedad: exactamente
  // un negocio, con una respuesta que de verdad filtra algo. Con 0 o 2+
  // negocios no hay un "tu negocio" único al que atarle la lista — se
  // muestran los pasos completos, que es el comportamiento seguro por
  // defecto. Con 10-20 negocios en total, el dueño de dos es la excepción,
  // no la regla: no vale la pena resolverla mejor todavía.
  const negocios = await negociosDe(sesion.id);
  const formalidad = negocios.length === 1 ? negocios[0]!.formalidad : null;

  return (
    <main className="seccion">
      {/* Encabezado en dos columnas, mismo patrón que components/Hero.
          `.seccion` no tiene ancho máximo (ver styles/globals.css: solo pone
          márgenes), así que en un monitor ancho la sección mide ~1750px. Con el
          texto capado en max-w-3xl y la foto colgando debajo, sobraban ~1000px
          de nada a la derecha mientras el catálogo de abajo sí usaba todo el
          ancho: el encabezado se leía como una columna suelta en una página
          que no era suya. Ahora la foto ocupa esa mitad en vez de dejarla
          vacía, y el texto conserva su medida de lectura. */}
      <header className="grid grid-cols-1 items-center gap-y-8 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-6 xl:col-span-5">
          {/* «Tu espacio» es la misma etiqueta que encabeza la sección privada del
              menú de usuario. Repetirla acá no es redundancia: es lo que le dice
              a la persona que esta página es una de las suyas y no contenido
              público, sin agregar un cartel que lo anuncie. */}
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-azul-texto">
            <span className="h-1.5 w-1.5 rounded-full bg-azul-texto" aria-hidden="true" />
            tu espacio · rutas y apoyos
          </span>

          <h1 className="mt-4 font-display text-5xl font-medium leading-[0.95] text-tinta sm:text-7xl">
            Formalización
          </h1>

          <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-tinta/70">
            Formalizar un negocio no es un solo trámite: son varios, en orden, y
            casi todos tienen una entidad distinta detrás. Acá está el camino
            completo, con el enlace oficial de cada paso.
          </p>

          <p className="mt-4 max-w-xl font-sans text-sm leading-relaxed text-tinta/65">
            No publicamos tarifas ni montos: cambian cada año. Cada paso te lleva
            a la página oficial donde está el valor vigente.
          </p>
        </div>

        {/* En móvil sigue siendo una banda ancha bajo el texto; recién en lg
            pasa a ser la columna de al lado y toma una proporción más alta,
            que es lo que llena el alto del bloque de texto. */}
        <div className="relative aspect-[16/7] w-full overflow-hidden lg:col-span-6 lg:aspect-[5/4] xl:col-span-7 xl:aspect-[16/9]">
          <Image
            src="/fotos/manrique-iglesia.jpg"
            alt="Vista de una calle de Manrique con la iglesia del barrio al fondo"
            fill
            preload
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />
        </div>
      </header>

      <ContenidoFormalizacion formalidad={formalidad} />

      {/* Quien llega hasta acá ya entró: el cierre invita a preguntar, no a
          registrarse. Ese CTA vive en la vista previa, del otro lado. */}
      <section className="mt-20 border-t border-tinta/12 pt-10">
        <h2 className="max-w-2xl font-display text-3xl font-medium leading-tight text-tinta">
          ¿Tienes dudas sobre tu caso en particular?
        </h2>
        <p className="mt-4 max-w-xl font-sans leading-relaxed text-tinta/70">
          El asesor responde según los datos de tu propio negocio. Lo abres
          desde la ficha, en tu cuenta.
        </p>

        <Link
          href="/mi-cuenta"
          className="mt-8 inline-block border border-azul-texto bg-azul-texto px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-azul-texto"
        >
          Ir a mi cuenta →
        </Link>
      </section>

      <Link
        href="/mi-cuenta"
        className="mt-24 inline-block font-mono text-sm text-tinta/65 underline decoration-azul underline-offset-4 hover:text-azul-texto"
      >
        ← Volver a mi cuenta
      </Link>
    </main>
  );
}
