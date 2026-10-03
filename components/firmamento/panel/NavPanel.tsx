'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { itemActual, rutaActiva, type ItemNav } from '@/lib/firmamento/navegacion';
import { IconoPanel } from './IconoPanel';

/**
 * Lo que depende de la ruta actual (ítem activo y título) es lo único del panel
 * que necesita JavaScript de cliente, así que vive aquí y el resto del armazón
 * sigue siendo de servidor. `aria-current="page"` marca el ítem activo; además
 * del color lleva peso y una barra de sodio, para que no dependa solo del color.
 *
 * `insignias` va por `href` (p. ej. «moderación: 5 pendientes»); sin entrada,
 * no hay insignia. Las llena el layout del rol cuando exista el dato (Ola 2).
 */
type Insignias = Record<string, number>;

function Insignia({ n, unidad = 'pendientes' }: { n: number; unidad?: string }) {
  return (
    <span className="ml-auto min-w-[22px] rounded-full bg-sodio px-1.5 py-0.5 text-center font-cifra text-xs font-medium leading-none text-noche">
      {n}
      <span className="sr-only"> {unidad}</span>
    </span>
  );
}

export function NavLateral({ items, insignias = {} }: { items: readonly ItemNav[]; insignias?: Insignias }) {
  const ruta = usePathname();

  return (
    <nav aria-label="Secciones del panel" className="mt-6 px-3">
      <ul className="flex flex-col gap-1">
        {items.map((it, i) => {
          const activo = rutaActiva(ruta, it.href, i === 0);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={activo ? 'page' : undefined}
                className={`relative flex min-h-[44px] items-center gap-3 rounded-lg px-3 font-sans text-[15px] transition-colors ${
                  activo
                    ? 'bg-noche-activa font-medium text-estrella before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-sodio'
                    : 'text-tenue hover:bg-noche-3 hover:text-estrella'
                }`}
              >
                <IconoPanel nombre={it.icono} />
                <span>{it.etiqueta}</span>
                {insignias[it.href] ? <Insignia n={insignias[it.href]!} unidad={it.unidad} /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Barra inferior del celular: la misma navegación, con rótulos cortos. */
export function NavInferior({ items, insignias = {} }: { items: readonly ItemNav[]; insignias?: Insignias }) {
  const ruta = usePathname();

  return (
    <nav
      aria-label="Secciones del panel (celular)"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-trazo bg-noche-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((it, i) => {
          const activo = rutaActiva(ruta, it.href, i === 0);
          const n = insignias[it.href];
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={activo ? 'page' : undefined}
                aria-label={n ? `${it.etiqueta}, ${n} ${it.unidad ?? 'pendientes'}` : it.etiqueta}
                className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 font-sans text-xs ${
                  activo
                    ? 'font-medium text-estrella before:absolute before:inset-x-3 before:top-0 before:h-[3px] before:rounded-b-full before:bg-sodio'
                    : 'text-tenue'
                }`}
              >
                <span className="relative">
                  <IconoPanel nombre={it.icono} />
                  {n ? (
                    <span
                      aria-hidden="true"
                      className="absolute -right-2.5 -top-1.5 min-w-[16px] rounded-full bg-sodio px-1 text-center font-cifra text-[11px] font-medium leading-4 text-noche"
                    >
                      {n}
                    </span>
                  ) : null}
                </span>
                <span aria-hidden="true">{it.corta ?? it.etiqueta}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** El título de la barra superior: el ítem de la ruta actual. Es el único h1 del panel. */
export function TituloPanel({ items }: { items: readonly ItemNav[] }) {
  const ruta = usePathname();
  return (
    <h1 className="min-w-0 flex-1 break-words font-display text-lg font-medium leading-tight text-estrella sm:text-2xl">
      {itemActual(ruta, items).etiqueta}
    </h1>
  );
}
