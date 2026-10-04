'use client';

import { usePathname } from 'next/navigation';

import { itemActual, NAV, pestanasDe, type RolFirmamento } from '@/lib/firmamento/navegacion';
import { BarraPestanas } from './Pestanas';

/**
 * Lo que depende de la ruta actual (pestaña activa, subpestaña y título) es lo
 * único del armazón que necesita JavaScript de cliente (`usePathname`), así que
 * vive aquí y `PanelShell` sigue siendo de servidor. En el HTML del servidor ya
 * sale todo marcado: la ruta se conoce al renderizar.
 *
 * `insignias` va por `href` (p. ej. «moderación: 5 pendientes»); una pestaña con
 * subpestañas muestra la suma de las suyas.
 */
type Insignias = Record<string, number>;

function useRutaPanel(rol: RolFirmamento) {
  const actual = itemActual(usePathname(), NAV[rol]);
  const pestanas = pestanasDe(rol);
  const activa = pestanas.find((p) => p.items.includes(actual)) ?? pestanas[0]!;
  return { actual, pestanas, activa };
}

export function NavPanel({ rol, insignias = {} }: { rol: RolFirmamento; insignias?: Insignias }) {
  const { actual, pestanas } = useRutaPanel(rol);
  return (
    <BarraPestanas
      etiqueta="Secciones del panel"
      items={pestanas.map((p) => ({
        href: p.href,
        texto: p.etiqueta,
        corta: p.corta,
        n: p.items.reduce((t, it) => t + (insignias[it.href] ?? 0), 0),
        unidad: p.items.length === 1 ? p.items[0]!.unidad : undefined,
        activo: p.items.includes(actual), // una página oculta (el registro) no marca ninguna
      }))}
    />
  );
}

/** Las secciones de la pestaña activa del equipo, como subpestañas. Sin subsecciones, nada. */
export function SubNavPanel({ rol, insignias = {} }: { rol: RolFirmamento; insignias?: Insignias }) {
  const { actual, activa } = useRutaPanel(rol);
  if (activa.items.length < 2) return null;
  return (
    <BarraPestanas
      etiqueta={`Secciones de ${activa.etiqueta}`}
      nivel="sub"
      items={activa.items.map((it) => ({
        href: it.href,
        texto: it.etiqueta,
        corta: it.corta,
        n: insignias[it.href],
        unidad: it.unidad,
        activo: it === actual,
      }))}
    />
  );
}

/** El título de la sección actual: el único h1 del panel. */
export function TituloPanel({ rol }: { rol: RolFirmamento }) {
  const { actual } = useRutaPanel(rol);
  return (
    <h1 className="break-words font-display text-3xl font-medium leading-tight text-tinta sm:text-4xl">
      {actual.etiqueta}
    </h1>
  );
}
