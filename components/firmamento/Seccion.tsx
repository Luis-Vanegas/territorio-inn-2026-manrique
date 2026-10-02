import { ScrollReveal } from '@/components/ScrollReveal';

/**
 * Sección de /firmamento: letra griega en Fraunces itálica sodio (DESIGN.md ›
 * Motivos), título y bajada. La letra es solo numeración visual: va
 * `aria-hidden` y el título ya dice de qué sección se trata.
 *
 * El encabezado se revela con `ScrollReveal`, que es visible sin JavaScript.
 * El cuerpo no se envuelve aquí: el mapa de Leaflet mide su caja al montarse y
 * un `transform` de entrada en un ancestro no le conviene.
 *
 * Sin `use client`: lo usan el servidor (la página) y el cliente (MapaYTabla).
 */
export function Seccion({
  id,
  letra,
  titulo,
  descripcion,
  children,
}: {
  id: string;
  letra: string;
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      // El encabezado del sitio (64–72 px) y el índice pegajoso (≈ 52 px) tapan
      // lo que quede arriba al saltar a un ancla.
      className="margen-editorial scroll-mt-32 py-12 sm:scroll-mt-36 sm:py-16"
    >
      <ScrollReveal>
        <header className="flex items-baseline gap-4 border-b border-trazo pb-4 sm:gap-5">
          <span
            aria-hidden="true"
            className="min-w-[1.6rem] font-italica text-4xl leading-none text-sodio sm:min-w-[2.2rem] sm:text-5xl"
          >
            {letra}
          </span>
          <div className="min-w-0">
            <h2
              id={`${id}-titulo`}
              className="font-display text-3xl font-medium leading-[1.08] text-estrella sm:text-4xl"
            >
              {titulo}
            </h2>
            {descripcion && (
              <p className="mt-2 max-w-3xl font-sans text-base leading-relaxed text-tenue">
                {descripcion}
              </p>
            )}
          </div>
        </header>
      </ScrollReveal>
      <div className="mt-8">{children}</div>
    </section>
  );
}
