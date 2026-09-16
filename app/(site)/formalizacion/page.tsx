import type { Metadata } from 'next';
import Link from 'next/link';

import { sesionActual } from '@/lib/auth/usuario';
import { negociosDe } from '@/lib/db/usuarios.repo';
import {
  PASOS,
  VIDEOS,
  ETIQUETA_TIPO,
  ETIQUETA_FORMALIDAD,
  pasosPara,
  idDeYoutube,
  type TipoRuta,
} from '@/lib/formalizacion';
import { RutasPersonalizadas } from './_components/RutasPersonalizadas';
import { VideoEmbebido } from '@/components/VideoEmbebido';

export const metadata: Metadata = {
  title: 'Formalización · Constelaciones',
  description:
    'Rutas de formalización, apoyos económicos y formación gratuita para negocios registrados de la Comuna 3 — Manrique, Medellín.',
};

// Lee la sesión en cada carga: el contenido depende de quién está entrando, así
// que no hay nada que prerenderizar.
export const dynamic = 'force-dynamic';

const ORDEN_TIPOS: TipoRuta[] = ['tramite', 'fondo', 'formacion'];

const INTRO_TIPO: Record<TipoRuta, string> = {
  tramite: 'Lo que tienes que hacer para que tu negocio sea formal.',
  fondo: 'Dónde pedir plata o apoyo para crecer.',
  formacion: 'Dónde aprender, sin pagar nada.',
};

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
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-terracota-texto">
            <span className="h-1.5 w-1.5 rounded-full bg-terracota" aria-hidden="true" />
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
            className="mt-8 inline-block border border-terracota-texto bg-terracota-texto px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-terracota-texto"
          >
            Entrar o registrarme →
          </Link>
        </section>

        <Link
          href="/"
          className="mt-20 inline-block font-mono text-sm text-tinta/50 underline decoration-terracota underline-offset-4 hover:text-terracota-texto"
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
  const propios = formalidad ? pasosPara(formalidad) : PASOS;
  const personalizado = Boolean(formalidad) && propios.length < PASOS.length;

  return (
    <main className="seccion">
      <header className="max-w-3xl">
        {/* «Tu espacio» es la misma etiqueta que encabeza la sección privada del
            menú de usuario. Repetirla acá no es redundancia: es lo que le dice
            a la persona que esta página es una de las suyas y no contenido
            público, sin agregar un cartel que lo anuncie. */}
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-terracota-texto">
          <span className="h-1.5 w-1.5 rounded-full bg-terracota" aria-hidden="true" />
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

        <p className="mt-4 max-w-xl font-sans text-sm leading-relaxed text-tinta/55">
          No publicamos tarifas ni montos: cambian cada año. Cada paso te lleva
          a la página oficial donde está el valor vigente.
        </p>
      </header>

      {personalizado ? (
        <RutasPersonalizadas
          propios={propios}
          todos={PASOS}
          etiquetaFormalidad={ETIQUETA_FORMALIDAD[formalidad!] ?? formalidad!}
        />
      ) : (
        ORDEN_TIPOS.map((tipo) => {
          const pasos = PASOS.filter((p) => p.tipo === tipo);
          if (pasos.length === 0) return null;

          return (
            <section key={tipo} className="mt-20 border-t border-tinta/12 pt-10">
              <h2 className="font-display text-3xl font-medium text-tinta">
                {ETIQUETA_TIPO[tipo]}
              </h2>
              <p className="mt-2 font-sans text-tinta/60">{INTRO_TIPO[tipo]}</p>

              <ul className="mt-8 grid gap-6 sm:grid-cols-2">
                {pasos.map((paso) => (
                  <li
                    key={paso.id}
                    className="flex flex-col border border-tinta/12 p-6 transition-colors hover:border-terracota"
                  >
                    <h3 className="font-display text-xl font-medium text-tinta">
                      {paso.titulo}
                    </h3>

                    <p className="mt-1 font-mono text-xs text-tinta/45">{paso.entidad}</p>

                    <p className="mt-3 font-sans leading-relaxed text-tinta/70">
                      {paso.resumen}
                    </p>

                    <div className="mt-4">
                      <p className="font-mono text-xs text-tinta/45">Necesitas tener:</p>
                      <ul className="mt-2 space-y-1">
                        {paso.requisitos.map((requisito) => (
                          <li key={requisito} className="font-sans text-sm text-tinta/70">
                            · {requisito}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* mt-auto pega el enlace al piso: las tarjetas de una misma
                        fila tienen textos de distinto largo y sin esto cada
                        enlace queda a una altura diferente. */}
                    <div className="mt-auto pt-6">
                      <a
                        href={paso.fuente}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-terracota-texto underline decoration-terracota underline-offset-4"
                      >
                        Ver en la página oficial ↗
                      </a>
                      <p className="mt-2 font-mono text-xs text-tinta/35">
                        Enlace verificado el {paso.verificadoEn}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      {/* id: /mi-cuenta enlaza directo a esta sección. Los videos se agrupan
          por el mismo `tipo` que los trámites de arriba — no es una segunda
          taxonomía, es la misma, así que quien ya entendió qué es "Trámite"
          o "Apoyo económico" arriba no tiene que aprender una categoría
          nueva acá abajo. */}
      <section id="videos" className="mt-20 border-t border-tinta/12 pt-10 scroll-mt-24">
        <h2 className="font-display text-3xl font-medium text-tinta">Videos y tutoriales</h2>
        <p className="mt-2 max-w-xl font-sans text-tinta/60">
          De canales oficiales verificados, agrupados por tema. Se reproducen
          acá mismo, o los abres en YouTube si prefieres verlos allá.
        </p>

        {ORDEN_TIPOS.map((tipo) => {
          const videos = VIDEOS.filter((v) => v.tipo === tipo);
          if (videos.length === 0) return null;

          return (
            <div key={tipo} className="mt-10 first:mt-8">
              <h3 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
                {ETIQUETA_TIPO[tipo]}
              </h3>

              {/* Las tarjetas usan el mismo flex-col + mt-auto que las de
                  arriba: los textos tienen largos distintos y sin eso cada
                  "Ver en YouTube" queda a una altura diferente en la misma fila. */}
              <ul className="mt-4 grid gap-6 sm:grid-cols-3">
                {videos.map((video) => {
                  const youtubeId = idDeYoutube(video.url);

                  return (
                    <li
                      key={video.id}
                      className="flex flex-col border border-tinta/12 transition-colors hover:border-terracota"
                    >
                      {/* Sin id reconocible (link mal pegado), no hay miniatura
                          que mostrar: se salta directo al link de YouTube en
                          vez de romper la tarjeta con una imagen rota. */}
                      {youtubeId && <VideoEmbebido youtubeId={youtubeId} titulo={video.titulo} />}

                      <div className="flex flex-1 flex-col p-6">
                        <h4 className="font-display text-lg font-medium text-tinta">
                          {video.titulo}
                        </h4>
                        <p className="mt-1 font-mono text-xs text-tinta/45">{video.fuente}</p>
                        <p className="mt-3 font-sans text-sm leading-relaxed text-tinta/70">
                          {video.descripcion}
                        </p>
                        <div className="mt-auto pt-4">
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm text-terracota-texto underline decoration-terracota underline-offset-4"
                          >
                            Ver en YouTube ↗
                          </a>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>

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
          className="mt-8 inline-block border border-terracota-texto bg-terracota-texto px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-terracota-texto"
        >
          Ir a mi cuenta →
        </Link>
      </section>

      <Link
        href="/mi-cuenta"
        className="mt-24 inline-block font-mono text-sm text-tinta/50 underline decoration-terracota underline-offset-4 hover:text-terracota-texto"
      >
        ← Volver a mi cuenta
      </Link>
    </main>
  );
}
