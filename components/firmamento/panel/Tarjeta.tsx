import Link from 'next/link';

/**
 * Piezas de las páginas del panel: tarjeta con título, línea de fuente y
 * subpestañas por URL. El h1 lo pone la barra superior (`TituloPanel`), así que
 * cada tarjeta titula con h2.
 */

export function Tarjeta({
  titulo,
  id,
  accion,
  children,
  className = '',
}: {
  titulo: string;
  id: string;
  /** Un enlace o botón al lado del título («Ver todas», «Descargar CSV»). */
  accion?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={`min-w-0 rounded-xl border border-trazo bg-noche-2 p-5 sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 id={id} className="font-display text-xl font-medium leading-snug text-estrella">
          {titulo}
        </h2>
        {accion}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Toda cifra lleva su fuente y su fecha (DESIGN.md › Reglas de cifras), en `font-cifra`. */
export function LineaFuente({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 break-words font-cifra text-xs leading-relaxed text-tenue">{children}</p>;
}

/** Fecha de hoy en Bogotá, AAAA-MM-DD: la de las cifras que salen de la base en esta carga. */
export function hoyBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

/** Enlace con aspecto de botón secundario del panel (44 px de alto). */
export const CLASE_BOTON_PANEL =
  'inline-flex min-h-[44px] items-center justify-center rounded-lg border border-trazo-2 px-4 font-sans text-sm text-estrella transition-colors hover:bg-noche-3';

/**
 * Subpestañas que son URLs (`?vista=`): la página es de servidor y cada vista se
 * puede recargar o compartir. Activa = fondo `estrella`, peso y `aria-current`
 * (no solo color).
 */
export function SubPestanas({
  etiqueta,
  items,
}: {
  etiqueta: string;
  items: { href: string; texto: string; n?: number; activo: boolean }[];
}) {
  return (
    <nav aria-label={etiqueta} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={it.activo ? 'page' : undefined}
          className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-4 font-sans text-sm transition-colors ${
            it.activo
              ? 'border-estrella bg-estrella font-medium text-noche'
              : 'border-trazo-2 text-estrella hover:bg-noche-3'
          }`}
        >
          {it.texto}
          {it.n !== undefined && <span className="font-cifra text-xs">({it.n})</span>}
        </Link>
      ))}
    </nav>
  );
}
