'use client';

import { MapaAliados } from '@/components/MapaAliados';
import { BotonConstelacion, useConstelacionElegida } from '@/components/firmamento/MapaEstelar';
import { CLASE_BOTON_PANEL } from '@/components/firmamento/panel/Tarjeta';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import { formatearDistancia } from '@/lib/geo/distancia';

export type ConstelacionLista = {
  id: string;
  codigo: string;
  /** «C04 · Carrera 31 · Tienda y víveres — 13 comercios». */
  etiqueta: string;
  metros: number;
};

/**
 * El mapa de «Mi constelación» con la lista de las constelaciones cercanas: abre
 * encendida la propia y deja recorrer las demás (con la lista o con «Ver una
 * sola» del propio mapa) y volver. Es el patrón de `MapaEstelar` (un solo estado,
 * la constelación elegida), pero con su propio mapa: este sí lleva aliados.
 */
export function ExplorarConstelaciones({
  portafolios,
  seleccionado,
  propia,
  cercanas,
}: {
  portafolios: Portafolio[];
  /** Id del propio negocio: el mapa vuela a él y abre su ficha. */
  seleccionado: string;
  /** Id de su constelación, o null si es una estrella suelta. */
  propia: string | null;
  cercanas: ConstelacionLista[];
}) {
  // Desestructurado a propósito: pasar el objeto entero rompe `react-hooks/refs`.
  const { elegida, elegir, fijar, caja } = useConstelacionElegida(120, propia ?? '');

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
      <div ref={caja} className="min-w-0 scroll-mt-24">
        <MapaAliados
          portafolios={portafolios}
          noche
          conFiltro
          seleccionado={seleccionado}
          constelacionElegida={elegida}
          alElegirConstelacion={fijar}
          hrefLista="#lista-aliados-cerca"
        />
      </div>

      <div className="min-w-0">
        <h3 className="font-display text-lg font-medium text-tinta">Constelaciones cerca de ti</h3>
        <p className="mt-1 font-sans text-sm leading-relaxed text-tinta/70">
          Toca una para verla en el mapa. Distancia en línea recta desde tu negocio hasta su centro.
        </p>
        {/* Siempre en su sitio (deshabilitado si ya se ve la propia): si apareciera al tocar una
            fila, empujaría la lista justo bajo el dedo. */}
        {propia !== null && (
          <button
            type="button"
            disabled={elegida === propia}
            onClick={() => elegir(propia)}
            className={`${CLASE_BOTON_PANEL} mt-3 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent`}
          >
            {elegida === propia ? 'Estás viendo la tuya' : 'Volver a la mía'}
          </button>
        )}
        <ol className="mt-3">
          {cercanas.map((c) => {
            const esLaMia = c.id === propia;
            return (
              <li key={c.id} className="border-b border-tinta/12 py-3 last:border-b-0">
                <p className="break-words font-sans text-base font-medium text-tinta">
                  {c.etiqueta}
                  {esLaMia && <span className="ml-2 font-sans text-sm font-normal text-tinta/70">(la tuya)</span>}
                </p>
                <p className="mt-0.5 font-sans text-sm text-tinta/70">
                  A <span className="tabular-nums">{formatearDistancia(c.metros)}</span>
                </p>
                <BotonConstelacion
                  variante="texto"
                  codigo={c.codigo}
                  activa={c.id === elegida}
                  alAlternar={() => elegir(c.id)}
                />
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
