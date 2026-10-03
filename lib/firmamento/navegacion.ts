/**
 * Navegación de los paneles de Firmamento, como datos: un arreglo por rol (el
 * `NAV` del prototipo de la asesoría). El menú lateral, la barra inferior del
 * celular y el título de la barra superior salen todos de acá.
 *
 * Una página nueva de un panel = una entrada en el arreglo de su rol + su
 * carpeta bajo `app/(firmamento)/firmamento/<rol>/`. Mientras la carpeta no
 * exista, `[...resto]/page.tsx` del rol muestra «En construcción» en vez de un
 * 404 (y solo para rutas que estén aquí: cualquier otra es un 404 de verdad).
 *
 * Sin `server-only` ni imports de valor: lo importan componentes de servidor y
 * de cliente.
 */

export type RolFirmamento = 'negocio' | 'equipo' | 'entidad';

export type NombreIcono =
  | 'inicio'
  | 'ficha'
  | 'regalo'
  | 'mapa'
  | 'escudo'
  | 'megafono'
  | 'datos'
  | 'cerebro'
  | 'ojo'
  | 'personas';

export type ItemNav = {
  href: string;
  etiqueta: string;
  /** Rótulo de la barra inferior del celular, donde no cabe el largo (≤ 8 letras). */
  corta?: string;
  icono: NombreIcono;
  /** Qué cuenta la insignia de conteo, para el lector de pantalla («2 convocatorias»). Por defecto, «pendientes». */
  unidad?: string;
};

export const NAV: Record<RolFirmamento, readonly ItemNav[]> = {
  negocio: [
    { href: '/firmamento/negocio', etiqueta: 'Inicio', icono: 'inicio' },
    { href: '/firmamento/negocio/ficha', etiqueta: 'Mi ficha', icono: 'ficha' },
    { href: '/firmamento/negocio/para-ti', etiqueta: 'Para ti', icono: 'regalo', unidad: 'convocatorias' },
    {
      href: '/firmamento/negocio/constelacion',
      etiqueta: 'Mi constelación',
      corta: 'Mi mapa',
      icono: 'mapa',
    },
    { href: '/firmamento/negocio/clientes', etiqueta: 'Mis clientes', corta: 'Clientes', icono: 'personas' },
  ],
  equipo: [
    { href: '/firmamento/equipo', etiqueta: 'Resumen', icono: 'inicio' },
    { href: '/firmamento/equipo/moderacion', etiqueta: 'Moderación', corta: 'Moderar', icono: 'escudo' },
    {
      href: '/firmamento/equipo/convocatorias',
      etiqueta: 'Convocatorias',
      corta: 'Convoc.',
      icono: 'megafono',
    },
    { href: '/firmamento/equipo/territorio', etiqueta: 'Territorio', corta: 'Mapa', icono: 'mapa' },
    { href: '/firmamento/equipo/datos', etiqueta: 'Datos abiertos', corta: 'Datos', icono: 'datos' },
    { href: '/firmamento/equipo/modelos', etiqueta: 'Modelos', icono: 'cerebro' },
  ],
  entidad: [
    { href: '/firmamento/entidad', etiqueta: 'Observatorio', icono: 'ojo' },
    {
      href: '/firmamento/entidad/convocatorias',
      etiqueta: 'Convocatorias',
      corta: 'Convoc.',
      icono: 'megafono',
    },
    { href: '/firmamento/entidad/datos', etiqueta: 'Datos abiertos', corta: 'Datos', icono: 'datos' },
  ],
};

export const ROL_TEXTO: Record<RolFirmamento, string> = {
  negocio: 'Mi negocio',
  equipo: 'Equipo Constelaciones',
  entidad: 'Entidad aliada · lectura',
};

/** El botón de la barra superior que lleva de vuelta al sitio de la comunidad. */
/** `corto` es lo que se ve en el celular; contiene siempre palabras de `etiqueta` (WCAG 2.5.3). */
export const BOTON_SITIO: Record<RolFirmamento, { etiqueta: string; corto: string; href: string }> = {
  // El layout del panel lo reemplaza por la ficha real del negocio (prop `hrefSitio` de PanelShell); este es el respaldo.
  negocio: { etiqueta: 'Mi ficha pública', corto: 'Mi ficha', href: '/aliados' },
  equipo: { etiqueta: 'Ver Constelaciones', corto: 'Constelaciones', href: '/' },
  entidad: { etiqueta: 'Ver Constelaciones', corto: 'Constelaciones', href: '/' },
};

/** ¿La ruta actual es la de este ítem o una hija suya? El inicio solo cuenta exacto. */
export function rutaActiva(ruta: string, href: string, esInicio: boolean): boolean {
  const limpia = ruta.length > 1 ? ruta.replace(/\/$/, '') : ruta;
  return esInicio ? limpia === href : limpia === href || limpia.startsWith(`${href}/`);
}

/** El ítem de la ruta actual (el de href más largo que la contiene), o el inicio. */
export function itemActual(ruta: string, items: readonly ItemNav[]): ItemNav {
  const coincide = items
    .filter((it, i) => rutaActiva(ruta, it.href, i === 0))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return coincide ?? items[0]!;
}

/** ¿`resto` (los segmentos tras /firmamento/<rol>) corresponde a una página del menú? */
export function hrefDeMenu(rol: RolFirmamento, resto: string[]): ItemNav | undefined {
  const href = `/firmamento/${rol}/${resto.join('/')}`;
  return NAV[rol].find((it) => it.href === href);
}
