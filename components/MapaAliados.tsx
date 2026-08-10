'use client';

import dynamic from 'next/dynamic';
import type { Portafolio } from '@/lib/db/portafolios.repo';

/**
 * Frontera de carga del mapa.
 *
 * Leaflet toca `window` al importarse, así que no puede renderizar en el
 * servidor: de ahí el ssr:false. Y `dynamic({ssr:false})` solo se permite
 * dentro de un Client Component, por eso este wrapper existe en vez de llamar
 * a dynamic() directo desde la página, que es un Server Component.
 */

const MapaClient = dynamic(() => import('./MapaAliadosClient'), {
  ssr: false,
  // El placeholder tiene la misma altura que el mapa: si no, la página salta
  // cuando el mapa termina de cargar.
  loading: () => (
    <div className="flex h-full w-full items-center justify-center border border-tinta/10 bg-tinta/[0.02]">
      <span className="font-mono text-xs text-tinta/40">cargando mapa…</span>
    </div>
  ),
});

export function MapaAliados(props: {
  portafolios: Portafolio[];
  alSeleccionar?: (id: string) => void;
}) {
  return <MapaClient {...props} />;
}
