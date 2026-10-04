'use client';

import { useState } from 'react';

import { FichaComercioOsm } from '@/components/mapa/FichaComercioOsm';
import type { EstadoCarga } from '@/components/mapa/useConstelaciones';
import { fechaLarga, type EstrellaOsm } from '@/lib/geo/constelaciones';

/**
 * «Otros comercios del barrio»: los locales mapeados en OpenStreetMap, aparte
 * de los aliados y sin mezclarse con ellos. Es una lista de información, sin
 * acciones: lo que se filtra viene del buscador y del filtro de categorías que
 * ya tiene la vitrina, no de controles propios.
 *
 * Se pinta por tandas, igual que el listado de aliados: son ~200 y en un
 * celular no hace falta montarlos todos de golpe. Quien lo usa le pone `key`
 * (búsqueda + categoría) para que la tanda vuelva a la primera al filtrar.
 */

const POR_TANDA = 12;

export type ComercioListado = { comercio: EstrellaOsm; distancia: number | null };

export function OtrosComercios({
  items,
  estado,
  osmBase,
  filtrado,
  cercania,
  sinNombre = 0,
}: {
  items: ComercioListado[];
  estado: EstadoCarga;
  /** Fecha del snapshot de OSM (`osm_base` del JSON). */
  osmBase?: string;
  /** Hay búsqueda o categoría activa: cambia el mensaje de lista vacía. */
  filtrado: boolean;
  /** La lista viene ordenada por cercanía y muestra la distancia. */
  cercania: boolean;
  /** Comercios sin nombre en OSM: se ven en el mapa pero no en esta lista. */
  sinNombre?: number;
}) {
  const [visibles, setVisibles] = useState(POR_TANDA);

  return (
    <section
      id="otros-comercios"
      aria-labelledby="titulo-otros-comercios"
      className="mt-20 scroll-mt-24"
    >
      <h2
        id="titulo-otros-comercios"
        className="font-display text-3xl font-medium leading-tight text-tinta sm:text-4xl"
      >
        Otros comercios del barrio
      </h2>
      <p className="mt-3 max-w-xl font-sans text-base leading-relaxed text-tinta/75">
        Estos locales los mapearon voluntarios en OpenStreetMap, un mapa abierto. No son aliados
        de Constelaciones: no se registraron aquí.
        {cercania && ' Van del más cercano al más lejano.'}
      </p>
      {osmBase && (
        <p className="mt-2 font-sans tabular-nums text-xs leading-relaxed text-tinta/70">
          © colaboradores de OpenStreetMap (ODbL). Datos de OpenStreetMap al {fechaLarga(osmBase)}.
        </p>
      )}

      {estado === 'cargando' && (
        <p role="status" className="mt-8 font-sans text-sm text-tinta/70">
          Cargando los comercios…
        </p>
      )}
      {estado === 'error' && (
        <p role="status" className="mt-8 font-sans text-sm text-tinta/70">
          No pudimos cargar los otros comercios. Los aliados se ven igual.
        </p>
      )}

      {estado === 'listo' && items.length === 0 && (
        <p className="mt-8 border-t border-tinta/12 pt-6 font-sans text-sm text-tinta/70">
          {filtrado
            ? 'Ningún otro comercio coincide con lo que buscas.'
            : 'No hay otros comercios para mostrar.'}
        </p>
      )}

      {estado === 'listo' && items.length === 0 && sinNombre > 0 && (
        <p className="mt-3 font-sans text-xs text-tinta/70">
          {sinNombre} {sinNombre === 1 ? 'comercio sin nombre aparece' : 'comercios sin nombre aparecen'} solo en el mapa.
        </p>
      )}

      {items.length > 0 && (
        <>
          <p aria-live="polite" className="mt-8 font-sans text-xs text-tinta/70">
            {items.length} {items.length === 1 ? 'comercio' : 'comercios'} con nombre
            {sinNombre > 0 &&
              `; ${sinNombre} ${sinNombre === 1 ? 'más sin nombre aparece' : 'más sin nombre aparecen'} solo en el mapa`}
          </p>
          <ul className="mt-2">
            {items.slice(0, visibles).map((i) => (
              <li key={i.comercio.osm} className="border-t border-tinta/12 py-5">
                <FichaComercioOsm comercio={i.comercio} distancia={i.distancia} como="h3" />
              </li>
            ))}
          </ul>

          {items.length > visibles && (
            <button
              type="button"
              onClick={() => setVisibles((v) => v + POR_TANDA)}
              className="mt-6 min-h-[44px] border border-azul-texto px-6 py-3 font-sans text-sm text-azul-texto transition-colors hover:bg-azul-texto hover:text-hueso"
            >
              Ver más comercios ({items.length - visibles} más)
            </button>
          )}
        </>
      )}
    </section>
  );
}
