import { Plegable } from '../Plegable';

export { SubPestanas } from './Pestanas';

/**
 * El bloque de contenido del sitio con sesión (DESIGN.md › Firmamento con
 * sesión › Bloques). Uno solo, con dos variantes y la opción de plegarse:
 *
 * - `variante="tarjeta"` (por defecto): borde `tinta/12`, `rounded-xl`, título
 *   en Fraunces. Es la de los paneles.
 * - `variante="seccion"`: sin marco, con una raya arriba y el título más grande.
 *   Es la de las guías de /formalizacion (antes `ModuloDesplegable`).
 * - `plegable`: un `<details>` (ver `Plegable`): funciona sin JS y con JS el
 *   contenido entra con un fundido. `abierta` lo deja abierto de entrada.
 *
 * Lee `hueso`/`tinta`, así que de día es de día y dentro de una `VentanaNoche`
 * (`.modo-noche`) toma sola la paleta de noche; las variantes `[.modo-noche_&]`
 * le dan el fondo `noche-2` y el borde `trazo` de las tarjetas de noche.
 *
 * El h1 de la página es el título de la sección (lo pone `PanelShell`), por eso
 * la tarjeta titula con h2.
 */
export function Tarjeta({
  titulo,
  id,
  accion,
  children,
  className = '',
  variante = 'tarjeta',
  plegable = false,
  abierta = false,
  resumen,
  ancla,
}: {
  titulo: string;
  /** Id del título (`aria-labelledby` de la sección). */
  id: string;
  /**
   * Un enlace o botón al lado del título («Ver todas», «Descargar CSV»). En una
   * tarjeta plegable va arriba del contenido: dentro del `summary` no puede
   * haber nada interactivo.
   */
  accion?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variante?: 'tarjeta' | 'seccion';
  plegable?: boolean;
  /** Solo con `plegable`: abierta en el HTML del servidor. */
  abierta?: boolean;
  /** Un dato corto al lado del título que se ve aun plegada (un conteo, un estado). */
  resumen?: React.ReactNode;
  /** Solo con `plegable`: id del contenido, para enlazar con `#ancla` y que se abra solo. */
  ancla?: string;
}) {
  const seccion = variante === 'seccion';
  const marco = seccion
    ? 'mt-6 border-t border-tinta/12 pt-6 first:mt-0'
    : 'rounded-xl border border-tinta/12 bg-hueso p-5 sm:p-6 [.modo-noche_&]:border-trazo [.modo-noche_&]:bg-noche-2';
  const claseTitulo = seccion
    ? 'font-display text-2xl font-medium leading-snug text-tinta sm:text-3xl'
    : 'font-display text-xl font-medium leading-snug text-tinta';
  const extra = resumen !== undefined && (
    <span className="font-sans text-sm text-tinta/70 [.modo-noche_&]:text-tenue">{resumen}</span>
  );

  if (!plegable) {
    return (
      <section aria-labelledby={id} className={`min-w-0 ${marco} ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3">
            <h2 id={id} className={claseTitulo}>
              {titulo}
            </h2>
            {extra}
          </div>
          {accion}
        </div>
        <div className={seccion ? 'mt-8' : 'mt-4'}>{children}</div>
      </section>
    );
  }

  // El signo +/− (no una flecha: acá se expande contenido, no se abre un menú).
  // En la sección va pegado al título: sin ancho máximo, contra el borde derecho
  // quedaba a 1.700 px de lo que abre.
  const signo = (
    <span aria-hidden="true" className="shrink-0 font-sans text-xl leading-none text-tinta/70 [.modo-noche_&]:text-tenue">
      <span className="group-open:hidden">+</span>
      <span className="hidden group-open:inline">−</span>
    </span>
  );

  return (
    <section aria-labelledby={id} className={`min-w-0 ${marco} ${className}`}>
      <Plegable
        abierto={abierta}
        ancla={ancla}
        className="group"
        claseResumen={`flex min-h-[44px] items-center gap-4 ${seccion ? 'justify-start' : 'justify-between'}`}
        claseContenido={seccion ? 'mt-8' : 'mt-4'}
        resumen={
          <>
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-3">
              <h2 id={id} className={claseTitulo}>
                {titulo}
              </h2>
              {extra}
            </span>
            {signo}
          </>
        }
      >
        {accion && <div className="mb-4">{accion}</div>}
        {children}
      </Plegable>
    </section>
  );
}

/**
 * La línea de fuente de una cifra o de una tabla suelta (DESIGN.md › Reglas de
 * cifras): DM Sans pequeña, no DM Mono. Para varias cifras con la misma fuente,
 * `GrupoCifras` la pone una sola vez.
 */
export function LineaFuente({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 break-words font-sans text-xs leading-relaxed text-tinta/70 [.modo-noche_&]:text-tenue">
      {children}
    </p>
  );
}

/** Fecha de hoy en Bogotá, AAAA-MM-DD: la de las cifras que salen de la base en esta carga. */
export function hoyBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

/**
 * Enlace o botón secundario del panel (44 px de alto). Borde `tinta/55` (3:1
 * como borde de control, WCAG 1.4.11); dentro de una ventana de noche, `tinta`
 * es `estrella`.
 */
export const CLASE_BOTON_PANEL =
  'inline-flex min-h-[44px] items-center justify-center rounded-lg border border-tinta/55 px-4 font-sans text-sm text-tinta transition-colors hover:bg-tinta/5';

/** La acción principal de una pantalla: una sola por pantalla, en `azul` (el color de acción). */
export const CLASE_BOTON_PRIMARIO =
  'inline-flex min-h-[44px] items-center justify-center rounded-lg bg-azul-texto px-5 font-sans text-sm font-medium text-hueso transition-colors hover:bg-azul-texto/90 disabled:cursor-not-allowed disabled:opacity-60';
