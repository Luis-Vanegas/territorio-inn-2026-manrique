'use client';

import { useState } from 'react';

/**
 * Video de YouTube con clic para reproducir, en vez de un `<iframe>` que
 * carga solo. Ver el comentario de `VideoRecurso.url` en lib/formalizacion.ts
 * para el porqué completo — acá solo la mecánica.
 *
 * Antes de tocar play, en el DOM solo hay una `<img>` (la miniatura, servida
 * por i.ytimg.com) y un botón. El `<iframe>` de youtube-nocookie.com recién
 * se crea cuando la persona hace clic — así que abrir la página no le pide
 * nada a YouTube, y la CSP en next.config.mjs solo permite ese origen en
 * `frame-src` por esta razón.
 */
export function VideoEmbebido({
  youtubeId,
  titulo,
}: {
  youtubeId: string;
  titulo: string;
}) {
  const [reproduciendo, setReproduciendo] = useState(false);

  if (reproduciendo) {
    return (
      <div className="aspect-video w-full bg-tinta/90">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
          title={titulo}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setReproduciendo(true)}
      // aspect-video: sin un alto fijo, la miniatura tarda en cargar y el
      // layout salta cuando llega — reservar el 16:9 desde el primer render
      // evita ese salto (CLS).
      className="group relative block aspect-video w-full overflow-hidden bg-tinta/10"
      aria-label={`Reproducir video: ${titulo}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura externa de i.ytimg.com, no vale la pena next/image para una sola imagen por tarjeta */}
      <img
        src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-tinta/25 transition-colors group-hover:bg-tinta/40">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-hueso text-azul-texto shadow-sm transition-transform group-hover:scale-105">
          {/* Triángulo de play dibujado con borders: cero SVG ni ícono extra para un solo uso. */}
          <span
            className="ml-1 h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-azul-texto"
            aria-hidden="true"
          />
        </span>
      </span>
    </button>
  );
}
