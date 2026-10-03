'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

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

function Insignia({ n }: { n: number }) {
  return (
    <span className="ml-auto min-w-[22px] rounded-full bg-sodio px-1.5 py-0.5 text-center font-cifra text-xs font-medium leading-none text-noche">
      {n}
      <span className="sr-only"> pendientes</span>
    </span>
  );
}

/** Las secciones sueltas primero y después cada grupo, en el orden del arreglo. */
function agrupar(items: readonly ItemNav[]) {
  const principales = items.filter((it) => !it.grupo);
  const grupos = new Map<string, ItemNav[]>();
  for (const it of items) {
    if (it.grupo) grupos.set(it.grupo, [...(grupos.get(it.grupo) ?? []), it]);
  }
  return { principales, grupos: [...grupos] };
}

function EnlaceLateral({ it, activo, n }: { it: ItemNav; activo: boolean; n?: number }) {
  return (
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
      {n ? <Insignia n={n} /> : null}
    </Link>
  );
}

export function NavLateral({ items, insignias = {} }: { items: readonly ItemNav[]; insignias?: Insignias }) {
  const ruta = usePathname();
  const { principales, grupos } = agrupar(items);
  const inicio = items[0]?.href;
  const lista = (its: readonly ItemNav[]) =>
    its.map((it) => (
      <li key={it.href}>
        <EnlaceLateral it={it} activo={rutaActiva(ruta, it.href, it.href === inicio)} n={insignias[it.href]} />
      </li>
    ));

  // min-h-0 + overflow: con muchos ítems (equipo) el menú se desplaza dentro de
  // la barra lateral y la tarjeta de abajo no se le monta encima.
  return (
    <nav aria-label="Secciones del panel" className="mt-6 min-h-0 flex-1 overflow-y-auto px-3 pb-4">
      <ul className="flex flex-col gap-1">{lista(principales)}</ul>
      {grupos.map(([grupo, its]) => (
        <div key={grupo} className="mt-5">
          <p id={`grupo-${grupo.replace(/\s+/g, '-')}`} className="px-3 pb-1 font-sans text-xs font-medium text-tenue-2">
            {grupo}
          </p>
          <ul aria-labelledby={`grupo-${grupo.replace(/\s+/g, '-')}`} className="flex flex-col gap-1">
            {lista(its)}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function InsigniaIcono({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute -right-2.5 -top-1.5 min-w-[16px] rounded-full bg-sodio px-1 text-center font-cifra text-[11px] font-medium leading-4 text-noche"
    >
      {n}
    </span>
  );
}

const CLASE_INFERIOR =
  'relative flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 px-1 font-sans text-xs';
const CLASE_INFERIOR_ACTIVA =
  'font-medium text-estrella before:absolute before:inset-x-3 before:top-0 before:h-[3px] before:rounded-b-full before:bg-sodio';

/**
 * Barra inferior del celular: las secciones principales con rótulos cortos. Si
 * el rol tiene secciones agrupadas (equipo), van detrás de «Más», un botón con
 * `aria-expanded` que abre la lista completa encima de la barra (mismo patrón
 * que el menú de la persona: Esc devuelve el foco, un toque afuera cierra).
 */
export function NavInferior({ items, insignias = {} }: { items: readonly ItemNav[]; insignias?: Insignias }) {
  const ruta = usePathname();
  const { principales, grupos } = agrupar(items);
  const inicio = items[0]?.href;
  // Abierto «en» una ruta: al navegar desde la lista, la ruta cambia y se cierra
  // sola, sin un efecto que lo sincronice.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const abierto = abiertoEn === ruta;
  const setAbierto = (v: boolean) => setAbiertoEn(v ? ruta : null);
  const contenedor = useRef<HTMLElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const idPanel = useId();

  useEffect(() => {
    if (!abierto) return;
    function alTeclear(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAbiertoEn(null);
        boton.current?.focus();
      }
    }
    function alTocarAfuera(e: PointerEvent) {
      if (!contenedor.current?.contains(e.target as Node)) setAbiertoEn(null);
    }
    document.addEventListener('keydown', alTeclear);
    document.addEventListener('pointerdown', alTocarAfuera);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.removeEventListener('pointerdown', alTocarAfuera);
    };
  }, [abierto]);

  const agrupados = grupos.flatMap(([, its]) => its);
  const masActivo = agrupados.some((it) => rutaActiva(ruta, it.href, false));
  const pendientesMas = agrupados.reduce((t, it) => t + (insignias[it.href] ?? 0), 0);
  const columnas = principales.length + (grupos.length > 0 ? 1 : 0);

  return (
    <nav
      ref={contenedor}
      aria-label="Secciones del panel (celular)"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-trazo bg-noche-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {abierto && (
        <div
          id={idPanel}
          className="absolute inset-x-0 bottom-full max-h-[70vh] overflow-y-auto border-t border-trazo-2 bg-noche-2 px-3 pb-3 pt-2"
        >
          {grupos.map(([grupo, its], i) => (
            <div key={grupo} className="mt-2">
              <p id={`${idPanel}-g${i}`} className="px-3 pb-1 font-sans text-xs font-medium text-tenue-2">
                {grupo}
              </p>
              <ul aria-labelledby={`${idPanel}-g${i}`} className="grid grid-cols-1 gap-1 min-[400px]:grid-cols-2">
                {its.map((it) => (
                  <li key={it.href}>
                    <EnlaceLateral it={it} activo={rutaActiva(ruta, it.href, false)} n={insignias[it.href]} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <ul className="grid" style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}>
        {principales.map((it) => {
          const activo = rutaActiva(ruta, it.href, it.href === inicio);
          const n = insignias[it.href];
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={activo ? 'page' : undefined}
                aria-label={n ? `${it.etiqueta}, ${n} pendientes` : it.etiqueta}
                className={`${CLASE_INFERIOR} ${activo ? CLASE_INFERIOR_ACTIVA : 'text-tenue'}`}
              >
                <span className="relative">
                  <IconoPanel nombre={it.icono} />
                  <InsigniaIcono n={n} />
                </span>
                <span aria-hidden="true">{it.corta ?? it.etiqueta}</span>
              </Link>
            </li>
          );
        })}
        {grupos.length > 0 && (
          <li>
            <button
              ref={boton}
              type="button"
              aria-expanded={abierto}
              aria-controls={idPanel}
              aria-label={pendientesMas ? `Más secciones, ${pendientesMas} pendientes` : 'Más secciones'}
              onClick={() => setAbierto(!abierto)}
              className={`${CLASE_INFERIOR} ${masActivo || abierto ? CLASE_INFERIOR_ACTIVA : 'text-tenue'}`}
            >
              <span className="relative">
                <IconoPanel nombre="mas" />
                <InsigniaIcono n={pendientesMas} />
              </span>
              <span aria-hidden="true">Más</span>
            </button>
          </li>
        )}
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
