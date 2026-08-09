import Image from 'next/image';
import type { Portafolio } from '@/lib/db/portafolios.repo';

/**
 * Ficha de un emprendimiento en el listado.
 * Sin sombras ni bordes redondeados: el sistema es editorial, la separación
 * la da una línea de 1px y el aire, no una card flotante.
 */

/** Deja solo los dígitos: wa.me no acepta espacios ni guiones. */
function enlaceWhatsapp(numero: string): string {
  const digitos = numero.replace(/\D/g, '');
  // Los números colombianos se escriben sin indicativo. wa.me lo necesita.
  const conPais = digitos.length === 10 ? `57${digitos}` : digitos;
  return `https://wa.me/${conPais}`;
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
    enlaces.push({
      etiqueta: `@${portafolio.instagram}`,
      href: `https://instagram.com/${portafolio.instagram}`,
    });
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
            className="font-mono text-xs text-tinta/60 underline decoration-terracota/40 underline-offset-4 transition-colors hover:text-terracota"
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
}: {
  portafolio: Portafolio;
  indice: number;
}) {
  return (
    <article
      id={portafolio.id}
      className="grid grid-cols-1 gap-5 border-t border-tinta/12 py-8 sm:grid-cols-[auto_1fr] sm:gap-7"
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
          <span className="font-mono text-[11px] uppercase tracking-wider text-terracota">
            {portafolio.categoria_nombre}
          </span>

          <h3 className="mt-2 font-display text-2xl font-medium leading-tight text-tinta sm:text-3xl">
            {portafolio.nombre}
          </h3>

          {portafolio.descripcion && (
            <p className="mt-3 max-w-prose font-sans text-[15px] leading-relaxed text-tinta/70">
              {portafolio.descripcion}
            </p>
          )}

          <p className="mt-4 font-sans text-sm text-tinta/55">
            {portafolio.direccion}
            <span className="mx-2 text-tinta/25">·</span>
            {portafolio.barrio}
          </p>

          <Contacto portafolio={portafolio} />
        </div>

        {portafolio.foto_url && (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-tinta/5 sm:w-52">
            <Image
              src={portafolio.foto_url}
              alt={`Fotografía de ${portafolio.nombre}`}
              fill
              sizes="(max-width: 640px) 100vw, 208px"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </article>
  );
}
