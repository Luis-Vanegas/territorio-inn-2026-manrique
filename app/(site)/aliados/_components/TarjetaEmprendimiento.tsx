import Image from 'next/image';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import type { DefinicionCampo } from '@/lib/db/camposPersonalizados.repo';
import { enlaceWhatsapp } from '@/lib/contacto';
import { formatearCamposExtra } from '@/lib/camposExtra';
import { formatearDistancia } from '@/lib/geo/distancia';
import { contar } from '@/lib/interacciones';

/**
 * Ficha de un emprendimiento en el listado.
 * Sin sombras ni bordes redondeados: el sistema es editorial, la separación
 * la da una línea de 1px y el aire, no una card flotante.
 */

/**
 * `instagram`/`facebook` ya vienen como URL completa desde `normalizarRedSocial`
 * (lib/validation/portafolio.schema.ts) — arma el link a mano acá duplicaba el
 * dominio (`instagram.com/https://instagram.com/usuario`, roto). Se usa el
 * valor guardado directo como href, y se deriva una etiqueta corta del path
 * para no mostrar la URL entera.
 */
function enlaceRedSocial(valor: string, etiquetaGenerica: string): { etiqueta: string; href: string } {
  const href = /^https?:\/\//i.test(valor) ? valor : `https://${valor}`;
  try {
    const usuario = new URL(href).pathname.replace(/^\/+|\/+$/g, '');
    return { etiqueta: usuario ? `@${usuario}` : etiquetaGenerica, href };
  } catch {
    return { etiqueta: etiquetaGenerica, href };
  }
}

function Contacto({ portafolio }: { portafolio: Portafolio }) {
  const enlaces: { etiqueta: string; href: string }[] = [];

  if (portafolio.whatsapp) {
    enlaces.push({ etiqueta: 'WhatsApp', href: enlaceWhatsapp(portafolio.whatsapp) });
  }
  if (portafolio.telefono) {
    enlaces.push({ etiqueta: portafolio.telefono, href: `tel:${portafolio.telefono.replace(/\s/g, '')}` });
  }
  if (portafolio.correo) {
    enlaces.push({ etiqueta: 'Correo', href: `mailto:${portafolio.correo}` });
  }
  if (portafolio.instagram) {
    enlaces.push(enlaceRedSocial(portafolio.instagram, 'Instagram'));
  }
  if (portafolio.facebook) {
    enlaces.push(enlaceRedSocial(portafolio.facebook, 'Otra red'));
  }

  if (enlaces.length === 0) return null;

  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
      {enlaces.map((e) => (
        <li key={e.href}>
          <a
            href={e.href}
            target="_blank"
            rel="noopener noreferrer"
            // Tocar un contacto es la señal que le importa al negocio: es
            // alguien que dejó de mirar y decidió escribir.
            onClick={() => contar(portafolio.id, 'contacto')}
            className="font-mono text-xs text-tinta/60 underline decoration-terracota/40 underline-offset-4 transition-colors hover:text-terracota-texto"
          >
            {e.etiqueta}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function TarjetaEmprendimiento({
  portafolio,
  indice,
  definicionesCampos,
  distancia,
  activo,
}: {
  portafolio: Portafolio;
  indice: number;
  definicionesCampos: DefinicionCampo[];
  /** Metros hasta el visitante. null si no compartió su ubicación. */
  distancia?: number | null;
  /** Resaltado porque se tocó su punto en el mapa. */
  activo?: boolean;
}) {
  const camposExtra = formatearCamposExtra(portafolio.campos_extra, definicionesCampos);

  return (
    <article
      id={portafolio.id}
      // scroll-mt evita que el header fijo tape el título al saltar desde el mapa.
      className={[
        'grid scroll-mt-24 grid-cols-1 gap-5 border-t py-8 transition-colors duration-500 sm:grid-cols-[auto_1fr] sm:gap-7',
        activo
          ? 'border-terracota bg-terracota/[0.05]'
          : 'border-tinta/12',
      ].join(' ')}
    >
      {/* La numeración en mono es la convención del sitio: "lo medido" se
          separa de "lo narrado". Ver docs/decisiones-diseno.md. */}
      <span
        className="font-mono text-xs text-tinta/35 sm:pt-1"
        aria-hidden="true"
      >
        {String(indice + 1).padStart(2, '0')}
      </span>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto] sm:gap-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-terracota-texto">
              {portafolio.categoria_nombre}
            </span>

            {/* La distancia es la respuesta a "¿esto me queda cerca?", que es
                la única pregunta que se hace alguien parado en la calle. */}
            {typeof distancia === 'number' && (
              <span className="inline-flex items-center gap-1 bg-terracota/10 px-2 py-0.5 font-mono text-[11px] text-terracota-texto">
                <span aria-hidden="true">◎</span>
                {formatearDistancia(distancia)}
              </span>
            )}
          </div>

          <h3 className="mt-2 font-display text-2xl font-medium leading-tight text-tinta sm:text-3xl">
            {portafolio.nombre}
          </h3>

          {portafolio.descripcion && (
            <p className="mt-3 max-w-prose font-sans text-[15px] leading-relaxed text-tinta/70">
              {portafolio.descripcion}
            </p>
          )}

          {/* La ubicación es el dato que distingue a Aliados de una lista de
              texto plano: se destaca con ícono y acento, no como un dato más
              en gris junto a los demás. */}
          <p className="mt-4 inline-flex items-baseline gap-1.5 border-l-2 border-terracota/40 pl-3 font-mono text-sm text-tinta/75">
            <span aria-hidden="true">📍</span>
            {portafolio.direccion}
            <span className="text-tinta/30">·</span>
            <span className="text-tinta/55">{portafolio.barrio}</span>
          </p>

          <Contacto portafolio={portafolio} />

          {camposExtra.length > 0 && (
            <dl className="mt-4 flex flex-col gap-1">
              {camposExtra.map((c) => (
                <div key={c.etiqueta} className="flex gap-2 font-sans text-xs">
                  <dt className="text-tinta/45">{c.etiqueta}:</dt>
                  <dd className="text-tinta/70">{c.valor}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {portafolio.foto_url && (
          <div className="group relative aspect-[4/3] w-full overflow-hidden bg-tinta/5 sm:w-52">
            <Image
              src={portafolio.foto_url}
              alt={`Fotografía de ${portafolio.nombre}`}
              fill
              sizes="(max-width: 640px) 100vw, 208px"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </div>
        )}
      </div>
    </article>
  );
}
