/**
 * Navegación de los paneles de Firmamento, como datos: un arreglo por rol. El
 * menú lateral (y el cajón del celular), sus grupos y el título de la sección
 * (h1) salen todos de acá.
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
  /** Rótulo corto (hoy sin uso en el menú lateral, que tiene espacio). Contiene palabras de `etiqueta` (WCAG 2.5.3). */
  corta?: string;
  /**
   * El grupo del equipo donde vive (Hoy, Red, Datos, Guías): en el menú lateral
   * es el encabezado bajo el que sale. Sin `pestana`, el ítem va suelto (negocio, entidad).
   */
  pestana?: string;
  /** Qué cuenta la insignia de conteo, para el lector de pantalla («2 convocatorias»). Por defecto, «pendientes». */
  unidad?: string;
  /** Página del rol sin pestaña propia (el registro): da el título, pero no sale en el menú. */
  oculta?: boolean;
  /** Una o dos frases bajo el h1 (`TituloPanel`): qué se hace en la página, sin jerga. */
  descripcion?: string;
};

export const NAV: Record<RolFirmamento, readonly ItemNav[]> = {
  negocio: [
    {
      href: '/firmamento/negocio',
      etiqueta: 'Inicio',
      descripcion:
        'Aquí ves cómo va tu negocio en Constelaciones: cuántas personas lo miran, qué le falta a tu ficha y dónde queda en el mapa.',
    },
    {
      href: '/firmamento/negocio/ficha',
      etiqueta: 'Mi ficha',
      descripcion:
        'Aquí cambias lo que la gente ve de tu negocio: su nombre, fotos, contacto y el punto en el mapa.',
    },
    {
      href: '/firmamento/negocio/para-ti',
      etiqueta: 'Para ti',
      unidad: 'convocatorias',
      descripcion:
        'Aquí están las convocatorias, guías y ayudas que encajan con tu negocio, y el asesor para resolver dudas de formalización.',
    },
    {
      href: '/firmamento/negocio/constelacion',
      etiqueta: 'Mi constelación',
      corta: 'Constelación',
      descripcion:
        'Una constelación es un grupo de comercios que quedan cerca unos de otros. Aquí ves en cuál está tu negocio y quién tienes al lado.',
    },
    {
      href: '/firmamento/negocio/clientes',
      etiqueta: 'Mis clientes',
      corta: 'Clientes',
      descripcion:
        'Aquí anotas a tus clientes y lo que quedaste de hacer con cada uno. Solo tú los ves.',
    },
    {
      href: '/firmamento/negocio/registro',
      etiqueta: 'Registrar un negocio',
      oculta: true,
      descripcion:
        'Llena los datos de tu negocio. Lo revisamos antes de publicarlo en el mapa de Constelaciones: toma menos de 3 minutos y es gratis.',
    },
  ],
  // Equipo: 16 secciones en cuatro pestañas, por lo que se hace con ellas: lo de
  // todos los días (Hoy), la red de aliados y entidades, los datos y lo que ve un
  // negocio (Guías). La primera de cada pestaña es adonde lleva la pestaña.
  equipo: [
    {
      href: '/firmamento/equipo',
      etiqueta: 'Resumen',
      pestana: 'Hoy',
      descripcion:
        'Aquí ves lo que espera una decisión del equipo hoy. Cada cifra te lleva a donde se resuelve; abajo, plegado, cómo va la red.',
    },
    {
      href: '/firmamento/equipo/moderacion',
      etiqueta: 'Moderación',
      pestana: 'Hoy',
      descripcion:
        'Aquí apruebas o rechazas los negocios que se registran, revisas lo que cambian los dueños y corriges las fichas con alertas.',
    },
    {
      href: '/firmamento/equipo/registro',
      etiqueta: 'Agregar negocio',
      pestana: 'Hoy',
      descripcion:
        'Aquí registras un negocio en nombre de su dueño cuando no tiene cuenta de Google (registro asistido). Llena los datos con la persona presente, indica al final cómo autorizó el tratamiento de sus datos y luego le envías su enlace personal.',
    },
    {
      href: '/firmamento/equipo/convocatorias',
      etiqueta: 'Convocatorias',
      pestana: 'Hoy',
      descripcion:
        'Aquí decides qué convocatorias ven los negocios y a quiénes les aplica cada una. Ninguna se publica sin que alguien del equipo la apruebe.',
    },
    {
      href: '/firmamento/equipo/peticiones',
      etiqueta: 'Peticiones',
      pestana: 'Hoy',
      descripcion:
        'Aquí llegan los mensajes que deja la gente desde la página de contacto. Se responden por fuera, con el contacto que dejó cada uno.',
    },
    {
      href: '/firmamento/equipo/aliados',
      etiqueta: 'Fichas de aliados',
      pestana: 'Red',
      descripcion:
        'Aquí buscas cualquier negocio de la red, corriges su ficha con «Editar ficha» y le das acceso a su dueño. Lo que cambies en una ficha aprobada se ve en el mapa de inmediato.',
    },
    {
      href: '/firmamento/equipo/entidades',
      etiqueta: 'Entidades',
      pestana: 'Red',
      descripcion:
        'Aquí administras las entidades aliadas y quién de cada una entra a su panel. Una entidad solo ve datos agregados, nunca fichas de negocios.',
    },
    {
      href: '/firmamento/equipo/moderadores',
      etiqueta: 'Moderadores',
      pestana: 'Red',
      descripcion:
        'Un moderador ve todas las fichas, con sus contactos, y decide qué se publica. Dale el acceso solo a quien trabaja en el equipo, y quítaselo cuando deje de hacerlo.',
    },
    {
      href: '/firmamento/equipo/empleo',
      etiqueta: 'Empleo',
      pestana: 'Red',
      descripcion:
        'Personas que buscan trabajo. Aquí se publican teléfonos reales, así que revisa que no haya spam ni datos falsos antes de aprobar.',
    },
    {
      href: '/firmamento/equipo/campos',
      etiqueta: 'Campos del registro',
      pestana: 'Red',
      descripcion:
        'Aquí agregas preguntas propias al formulario de registro y decides cuáles se ven en la ficha pública.',
    },
    {
      href: '/firmamento/equipo/territorio',
      etiqueta: 'Territorio',
      pestana: 'Datos',
      descripcion:
        'Aquí ves en el mapa dónde están los negocios de la red y los comercios de la comuna, para planear las salidas a campo.',
    },
    {
      href: '/firmamento/equipo/datos',
      etiqueta: 'Datos abiertos',
      pestana: 'Datos',
      descripcion:
        'Aquí ves qué cifras de la red publicamos para cualquiera y las descargas para el equipo.',
    },
    {
      href: '/firmamento/equipo/modelos',
      etiqueta: 'Modelos',
      pestana: 'Datos',
      descripcion:
        'Aquí ves qué tan bien acierta el modelo que propone la categoría de un negocio y cómo se agruparon los comercios en constelaciones.',
    },
    {
      href: '/firmamento/equipo/estadisticas',
      etiqueta: 'Estadísticas',
      pestana: 'Datos',
      descripcion:
        'Aquí ves cómo avanzan los registros y la moderación, qué fichas abre y contacta la gente, y cuántas páginas del sitio se abren.',
    },
    {
      href: '/firmamento/equipo/formalizacion',
      etiqueta: 'Formalización',
      pestana: 'Guías',
      descripcion:
        'El catálogo de trámites y apoyos tal como lo ve un negocio registrado. Como moderador ves siempre la lista completa, sin el filtro por las respuestas de cada negocio.',
    },
    {
      href: '/firmamento/equipo/marca',
      etiqueta: 'Marca',
      pestana: 'Guías',
      descripcion:
        'Las guías de marca tal como las ven los negocios, para acompañarlos en campo.',
    },
    {
      href: '/firmamento/equipo/ventas',
      etiqueta: 'Ventas',
      pestana: 'Guías',
      descripcion:
        'Las guías de ventas tal como las ven los negocios, para acompañarlos en campo.',
    },
    {
      href: '/firmamento/equipo/asesor',
      etiqueta: 'Asesor',
      pestana: 'Guías',
      descripcion:
        'El mismo asesor de formalización que ve un negocio. Prueba qué responde, o úsalo para orientar a un negocio sin abrir su ficha: aquí la consulta es general y no lleva los datos de ningún negocio.',
    },
  ],
  entidad: [
    {
      href: '/firmamento/entidad',
      etiqueta: 'Observatorio',
      descripcion:
        'Aquí ves la red como la ve Constelaciones: solo conteos, nunca un negocio por su nombre. Cuando una cifra es menor que 5 no la publicamos (sale como «<5»), para que nadie pueda identificar un negocio.',
    },
    {
      href: '/firmamento/entidad/convocatorias',
      etiqueta: 'Convocatorias',
      descripcion:
        'Aquí ves las convocatorias abiertas y propones las de tu entidad. El equipo las revisa antes de que lleguen a los negocios.',
    },
    {
      href: '/firmamento/entidad/datos',
      etiqueta: 'Datos abiertos',
      corta: 'Datos',
      descripcion:
        'Los mismos datos que cualquier persona puede consultar, listos para tu informe o tu tablero. Son conteos de negocios: nunca un negocio por su nombre.',
    },
  ],
};

/** Un bloque del menú lateral: con `titulo` (grupo del equipo) o sin él (ítems sueltos). */
export type GrupoNav = { titulo?: string; items: readonly ItemNav[] };

/** Los bloques del menú del rol, en el orden del arreglo. Las páginas ocultas no salen. */
export function gruposDe(rol: RolFirmamento): GrupoNav[] {
  const grupos: GrupoNav[] = [];
  for (const it of NAV[rol]) {
    if (it.oculta) continue;
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.titulo === it.pestana) ultimo.items = [...ultimo.items, it];
    else grupos.push({ titulo: it.pestana, items: [it] });
  }
  return grupos;
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
