/**
 * Navegación de los paneles de Firmamento, como datos: un arreglo por rol. Las
 * pestañas, las subpestañas del equipo y el título de la sección (h1) salen
 * todos de acá.
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

export type ItemNav = {
  href: string;
  etiqueta: string;
  /** Rótulo de la pestaña bajo `sm`, donde no cabe el largo. Contiene palabras de `etiqueta` (WCAG 2.5.3). */
  corta?: string;
  /**
   * La pestaña del equipo donde vive (Hoy, Red, Datos, Guías): ahí sale como
   * subpestaña. Sin `pestana`, el ítem es una pestaña propia (negocio, entidad).
   */
  pestana?: string;
  /** Qué cuenta la insignia de conteo, para el lector de pantalla («2 convocatorias»). Por defecto, «pendientes». */
  unidad?: string;
};

export const NAV: Record<RolFirmamento, readonly ItemNav[]> = {
  negocio: [
    { href: '/firmamento/negocio', etiqueta: 'Inicio' },
    { href: '/firmamento/negocio/ficha', etiqueta: 'Mi ficha' },
    { href: '/firmamento/negocio/para-ti', etiqueta: 'Para ti', unidad: 'convocatorias' },
    { href: '/firmamento/negocio/constelacion', etiqueta: 'Mi constelación', corta: 'Constelación' },
    { href: '/firmamento/negocio/clientes', etiqueta: 'Mis clientes', corta: 'Clientes' },
  ],
  // Equipo: 16 secciones en cuatro pestañas, por lo que se hace con ellas: lo de
  // todos los días (Hoy), la red de aliados y entidades, los datos y lo que ve un
  // negocio (Guías). La primera de cada pestaña es adonde lleva la pestaña.
  equipo: [
    { href: '/firmamento/equipo', etiqueta: 'Resumen', pestana: 'Hoy' },
    { href: '/firmamento/equipo/moderacion', etiqueta: 'Moderación', pestana: 'Hoy' },
    { href: '/firmamento/equipo/convocatorias', etiqueta: 'Convocatorias', pestana: 'Hoy' },
    { href: '/firmamento/equipo/peticiones', etiqueta: 'Peticiones', pestana: 'Hoy' },
    { href: '/firmamento/equipo/aliados', etiqueta: 'Fichas de aliados', pestana: 'Red' },
    { href: '/firmamento/equipo/entidades', etiqueta: 'Entidades', pestana: 'Red' },
    { href: '/firmamento/equipo/moderadores', etiqueta: 'Moderadores', pestana: 'Red' },
    { href: '/firmamento/equipo/empleo', etiqueta: 'Empleo', pestana: 'Red' },
    { href: '/firmamento/equipo/campos', etiqueta: 'Campos del registro', pestana: 'Red' },
    { href: '/firmamento/equipo/territorio', etiqueta: 'Territorio', pestana: 'Datos' },
    { href: '/firmamento/equipo/datos', etiqueta: 'Datos abiertos', pestana: 'Datos' },
    { href: '/firmamento/equipo/modelos', etiqueta: 'Modelos', pestana: 'Datos' },
    { href: '/firmamento/equipo/estadisticas', etiqueta: 'Estadísticas', pestana: 'Datos' },
    { href: '/firmamento/equipo/formalizacion', etiqueta: 'Formalización', pestana: 'Guías' },
    { href: '/firmamento/equipo/marca', etiqueta: 'Marca', pestana: 'Guías' },
    { href: '/firmamento/equipo/ventas', etiqueta: 'Ventas', pestana: 'Guías' },
    { href: '/firmamento/equipo/asesor', etiqueta: 'Asesor', pestana: 'Guías' },
  ],
  entidad: [
    { href: '/firmamento/entidad', etiqueta: 'Observatorio' },
    { href: '/firmamento/entidad/convocatorias', etiqueta: 'Convocatorias' },
    { href: '/firmamento/entidad/datos', etiqueta: 'Datos abiertos', corta: 'Datos' },
  ],
};

/** Una pestaña del panel: un ítem suelto, o un grupo del equipo con sus subpestañas. */
export type Pestana = { etiqueta: string; corta?: string; href: string; items: readonly ItemNav[] };

/** Las pestañas del rol, en el orden del arreglo. */
export function pestanasDe(rol: RolFirmamento): Pestana[] {
  const pestanas: Pestana[] = [];
  for (const it of NAV[rol]) {
    const nombre = it.pestana;
    const previa = nombre ? pestanas.find((p) => p.etiqueta === nombre) : undefined;
    if (previa) previa.items = [...previa.items, it];
    else pestanas.push({ etiqueta: nombre ?? it.etiqueta, corta: nombre ? undefined : it.corta, href: it.href, items: [it] });
  }
  return pestanas;
}

export const ROL_TEXTO: Record<RolFirmamento, string> = {
  negocio: 'Mi negocio',
  equipo: 'Equipo Constelaciones',
  entidad: 'Entidad aliada',
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
