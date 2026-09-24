import { ModuloDesplegable } from '@/components/ModuloDesplegable';
import { VideoEmbebido } from '@/components/VideoEmbebido';
import {
  ETIQUETA_FORMALIDAD,
  ETIQUETA_TIPO,
  INTRO_TIPO,
  ORDEN_TIPOS,
  PASOS,
  VIDEOS,
  idDeYoutube,
  pasosPara,
} from '@/lib/formalizacion';
import { RutasPersonalizadas } from './RutasPersonalizadas';
import { TarjetaPaso } from './TarjetaPaso';

/**
 * El catálogo de formalización: trámites, apoyos, formación y videos.
 *
 * Compartido entre /formalizacion (el negocio registrado) y /admin/formalizacion
 * (la moderación, que necesita ver exactamente lo mismo que ve un negocio).
 * Antes vivía dentro de la página; sacarlo evita mantener dos copias.
 *
 * `formalidad` es la respuesta del negocio a «¿Tienes RUT o Cámara de
 * Comercio?». Con `null` se muestra el catálogo completo: es lo que ve la
 * moderación, y quien no tiene una respuesta única que filtrar.
 */
export function ContenidoFormalizacion({ formalidad }: { formalidad: string | null }) {
  const propios = formalidad ? pasosPara(formalidad) : PASOS;
  // Solo se personaliza si la respuesta de verdad filtra algo.
  const personalizado = Boolean(formalidad) && propios.length < PASOS.length;

  return (
    <>
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
            <ModuloDesplegable
              key={tipo}
              titulo={ETIQUETA_TIPO[tipo]}
              cantidad={pasos.length}
              // Trámite abre de entrada: es lo primero que necesita quien no
              // tiene nada. Apoyo económico y Formación arrancan cerrados.
              abierto={tipo === 'tramite'}
            >
              <p className="max-w-xl font-sans text-tinta/60">{INTRO_TIPO[tipo]}</p>

              <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pasos.map((paso) => (
                  <TarjetaPaso key={paso.id} paso={paso} />
                ))}
              </ul>
            </ModuloDesplegable>
          );
        })
      )}

      {/* /mi-cuenta enlaza directo a "#videos" — el id vive en el contenido,
          no en el módulo, para que el navegador lo despliegue solo al llegar
          por ese link. Ver el comentario de ModuloDesplegable. */}
      <ModuloDesplegable titulo="Videos y tutoriales" cantidad={VIDEOS.length} id="videos">
        <p className="max-w-xl font-sans text-tinta/60">
          De canales oficiales verificados, agrupados por tema. Se reproducen
          acá mismo, o los abres en YouTube si prefieres verlos allá.
        </p>

        {ORDEN_TIPOS.map((tipo) => {
          const videos = VIDEOS.filter((v) => v.tipo === tipo);
          if (videos.length === 0) return null;

          return (
            <div key={tipo} className="mt-10 first:mt-8">
              <h3 className="font-sans text-xs uppercase tracking-wider text-tinta/65">
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
                      className="flex flex-col border border-tinta/12 transition-colors hover:border-azul"
                    >
                      {/* Sin id reconocible (link mal pegado), no hay miniatura
                          que mostrar: se salta directo al link de YouTube en
                          vez de romper la tarjeta con una imagen rota. */}
                      {youtubeId && <VideoEmbebido youtubeId={youtubeId} titulo={video.titulo} />}

                      <div className="flex flex-1 flex-col p-5">
                        <h4 className="font-display text-lg font-medium text-tinta">
                          {video.titulo}
                        </h4>
                        <p className="mt-1 font-sans text-xs text-tinta/60">{video.fuente}</p>
                        <p className="mt-3 font-sans text-sm leading-relaxed text-tinta/70">
                          {video.descripcion}
                        </p>
                        <div className="mt-auto pt-4">
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-sans text-sm text-azul-texto underline decoration-azul underline-offset-4"
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
      </ModuloDesplegable>
    </>
  );
}
