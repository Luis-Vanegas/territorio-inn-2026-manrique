'use client';

import Link from 'next/link';

import { salir } from '@/lib/actions/sesionUsuario';

/**
 * Lo que solo existe con sesión abierta.
 *
 * Deliberadamente NO están en la barra de navegación pública: quien no entró
 * no las ve. Cuando se agregue un módulo para registrados —noticias, asesoría
 * de marca, lo que venga— se suma acá y aparece solo para quien corresponde.
 */
export const ENLACES_PRIVADOS = [
  { href: '/mi-cuenta', etiqueta: 'Mis negocios' },
  { href: '/formalizacion', etiqueta: 'Rutas y apoyos' },
  { href: '/formalizacion#videos', etiqueta: 'Videos y guías' },
  { href: '/presencia', etiqueta: 'Tu presencia' },
];

/** Solo para quien también tiene sesión de moderación (ver SiteHeader). */
export const ENLACE_MODERACION = { href: '/admin/aliados', etiqueta: 'Panel de moderación' };

/**
 * Identidad de la persona conectada, y su salida.
 *
 * ── Por qué NO es un botón terracota ──
 *
 * Antes el nombre vivía en un botón terracota sólido, igual que "Registrarme".
 * Eso rompe una regla escrita del sistema (docs/sistema-diseno-a11y.md): «Un
 * solo color de acción por pantalla». Y rompe algo más básico: un nombre no es
 * una acción. Es estado — quién sos ahora mismo. Darle el peso visual de la
 * llamada principal invierte la jerarquía y obliga a leer los dos controles
 * para entender que solo uno hace algo.
 *
 * Va neutro. El acento queda libre para lo único que lo merece en esta barra.
 *
 * ── Por qué <details> y no un menú con estado ──
 *
 * El proyecto ya resuelve el menú móvil con <details>/<summary>, y trae gratis
 * lo que un menú a mano hay que escribir: foco de teclado, cierre con Escape,
 * y rol de botón expandible para el lector de pantalla. Cero JavaScript.
 *
 * Su limitación conocida: no cierra al hacer clic afuera. Para un menú de dos
 * ítems que se usa una vez por sesión, eso no justifica un useEffect con un
 * listener en document — el mismo criterio con el que está escrito el menú
 * móvil de al lado.
 *
 * ponytail: sin cierre por clic externo. Se agrega si el menú crece o si se
 * ve gente dejándolo abierto.
 */
export function MenuUsuario({
  nombre,
  foto,
  enlaces,
}: {
  nombre: string;
  foto: string | null;
  enlaces: { href: string; etiqueta: string }[];
}) {
  // La primera letra como reserva cuando Google no dio foto, o cuando la
  // imagen no carga. Un círculo vacío se lee como algo roto.
  const inicial = nombre.trim().charAt(0).toUpperCase() || '?';

  // Solo el primer nombre: "María Fernanda Restrepo Jaramillo" en una barra
  // con cinco ítems de menú no cabe, y recortarlo con puntos suspensivos se
  // ve peor que mostrar de entrada lo que la persona usa para presentarse.
  const primerNombre = nombre.trim().split(/\s+/)[0] ?? nombre;

  return (
    <details className="group relative">
      <summary
        className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 pl-1 pr-2 transition-colors hover:text-terracota-texto [&::-webkit-details-marker]:hidden"
        aria-label={`Cuenta de ${nombre}`}
      >
        {foto ? (
          // <img> y no next/image: son 28px de un dominio externo, así que la
          // optimización de Next agregaría una transformación facturable por
          // usuario para ahorrar bytes que no existen. `referrerPolicy` evita
          // contarle a Google desde qué página del sitio se pidió el avatar.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt=""
            width={28}
            height={28}
            referrerPolicy="no-referrer"
            className="h-7 w-7 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tinta/10 font-mono text-xs text-tinta/70"
          >
            {inicial}
          </span>
        )}

        <span className="max-w-[9rem] truncate font-mono text-base text-tinta/70">
          {primerNombre}
        </span>

        {/* Cheurón: la señal de "esto se abre". aria-hidden porque <details>
            ya anuncia su estado; el glifo es refuerzo visual. */}
        <span
          aria-hidden="true"
          className="font-mono text-xs text-tinta/40 transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>

      <div className="absolute right-0 top-12 z-50 w-64 border border-tinta/12 bg-hueso p-2 shadow-[0_4px_20px_rgb(26_26_26/0.08)]">
        {/* El nombre completo va acá, donde sí hay ancho: la barra muestra el
            primer nombre, y quien abre el menú confirma con qué cuenta entró.
            Sin borde debajo — el espacio ya separa. */}
        <p className="px-3 pb-2 pt-1 font-sans text-sm leading-snug text-tinta/65">{nombre}</p>

        {/* ── Este menú ES la separación entre lo público y lo propio ──
            Las rutas de acá no están en la barra de navegación: quien no entró
            no las ve ni sabe que existen. Es lo que hace que estar registrado
            se note como un lugar y no como un texto que dice "estás dentro". */}
        <p className="px-3 pb-1 pt-3 font-mono text-xs uppercase tracking-wider text-tinta/45">
          Tu espacio
        </p>

        {enlaces.map((enlace) => (
          <Link
            key={enlace.href}
            href={enlace.href}
            className="flex min-h-[44px] items-center border-l-4 border-transparent px-3 font-mono text-base text-tinta/70 transition-colors hover:bg-tinta/[0.03] hover:text-terracota-texto"
          >
            {enlace.etiqueta}
          </Link>
        ))}

        {/* Borde arriba y no solo espacio: acá sí hay ambigüedad que resolver.
            Salir no es una opción más de la lista — es la única que deshace
            algo, y tiene que leerse como otra clase de acción. */}
        <form action={salir} className="mt-2 border-t border-tinta/12 pt-2">
          {/* Server action por POST. Un enlace GET que desloguea se puede
              disparar desde una imagen en cualquier página y dejar a la persona
              afuera sin que haya tocado nada. */}
          <button
            type="submit"
            className="flex min-h-[44px] w-full items-center border-l-4 border-transparent px-3 text-left font-mono text-base text-tinta/70 transition-colors hover:bg-tinta/[0.03] hover:text-terracota-texto"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </details>
  );
}
