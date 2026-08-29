import Link from 'next/link';

/**
 * Envoltorio de los documentos legales.
 *
 * `avisoBorrador` viene prendido por defecto para no cambiar en silencio lo que
 * ya se publica en /legal/terminos y /legal/politica-datos. Cada documento
 * decide: el del módulo Servicios lo apaga porque su texto es el definitivo
 * del proyecto, no un borrador a la espera de otra revisión.
 *
 * `volverA` existe porque el enlace de salida estaba fijo a /aliados/registro,
 * y un documento que se lee desde el formulario de Servicios tiene que devolver
 * a la persona a donde estaba. Dejarla en otro formulario sería perderle el
 * trabajo hecho.
 */
export function DocumentoLegal({
  titulo,
  version,
  actualizado,
  avisoBorrador = true,
  volverA = { href: '/aliados/registro', texto: '← Volver al registro' },
  children,
}: {
  titulo: string;
  version: string;
  actualizado: string;
  avisoBorrador?: boolean;
  volverA?: { href: string; texto: string };
  children: React.ReactNode;
}) {
  return (
    <main className="seccion">
      <article className="max-w-2xl">
        <span className="font-mono text-xs text-tinta/50">
          {version} · actualizado {actualizado}
        </span>

        <h1 className="mt-4 font-display text-4xl font-medium leading-tight text-tinta sm:text-5xl">
          {titulo}
        </h1>

        {avisoBorrador && (
          <p className="mt-6 border border-terracota/40 bg-terracota/5 px-4 py-3 font-mono text-xs leading-relaxed text-terracota-texto">
            Borrador técnico, redactado por el equipo del proyecto. Pendiente de
            revisión jurídica antes de su publicación definitiva.
          </p>
        )}

        <div className="mt-10 flex flex-col gap-6 font-sans text-[15px] leading-relaxed text-tinta/75 [&_a]:underline [&_a]:decoration-terracota [&_a]:underline-offset-4 [&_h2]:mt-6 [&_h2]:font-mono [&_h2]:text-xs [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-tinta/50 [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
          {children}
        </div>

        <Link
          href={volverA.href}
          className="mt-16 inline-block font-mono text-sm text-tinta/50 underline decoration-terracota underline-offset-4 hover:text-terracota-texto"
        >
          {volverA.texto}
        </Link>
      </article>
    </main>
  );
}
