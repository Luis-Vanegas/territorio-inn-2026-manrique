'use client';

import { useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

import { Estrella } from '@/components/firmamento/Estrella';
import { MapaAliados } from '@/components/MapaAliados';
import type { FilaConstelacion } from '@/app/(site)/firmamento/datos';
import { fechaLarga } from '@/lib/geo/constelaciones';

/**
 * El mapa de constelaciones y «Dónde apoyar primero», que comparten un estado: la
 * constelación elegida. Tocar «Ver en el mapa» enciende esa constelación; el
 * selector del propio mapa («Ver una sola») cambia el botón marcado.
 *
 * Es el mapa de siempre (`MapaAliados`, noche) SIN aliados individuales: el
 * arreglo va vacío, así que ningún nombre, dirección ni coordenada de un negocio
 * de la red llega a esta pantalla (regla k = 5). Las estrellas son comercios de
 * OpenStreetMap, que ya son públicos.
 *
 * `composicion` es la tarjeta de composición de la red, que se renderiza en el
 * servidor y entra como hijo: así el estado de esta columna no la arrastra al cliente.
 */

// Referencia estable: un `[]` nuevo por render recalcularía los conteos del mapa.
// `never[]` y no `Portafolio[]`: este panel no importa ni el tipo de un negocio.
const SIN_ALIADOS: never[] = [];

const MOSTRAR = 3;

export function ObservatorioCielo({
  filas,
  osmBase,
  fechaCorrida,
  composicion,
}: {
  filas: FilaConstelacion[];
  osmBase: string;
  fechaCorrida: string;
  composicion: React.ReactNode;
}) {
  const [elegida, setElegida] = useState('');
  const cajaMapa = useRef<HTMLDivElement>(null);
  const sinMovimiento = useReducedMotion();

  const primeras = [...filas].sort((a, b) => b.tamano - a.tamano).slice(0, MOSTRAR);

  function elegir(id: string) {
    const nueva = id === elegida ? '' : id;
    setElegida(nueva);
    // En el celular el mapa queda arriba de la lista: si no se ve entero, se trae a la vista.
    const caja = cajaMapa.current;
    if (nueva && caja) {
      const r = caja.getBoundingClientRect();
      if (r.top < 80 || r.bottom > window.innerHeight) {
        caja.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth', block: 'center' });
      }
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
      <div ref={cajaMapa} className="min-w-0 scroll-mt-20">
        <h2 className="mb-3 font-sans text-lg font-medium text-estrella">
          Constelaciones comerciales de la Comuna 3
        </h2>
        <MapaAliados
          portafolios={SIN_ALIADOS}
          variante="vitrina"
          conFiltro
          noche
          constelacionElegida={elegida}
          alElegirConstelacion={setElegida}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <div className="border border-trazo bg-noche-2 p-5">
          <h2 className="font-sans text-lg font-medium text-estrella">Dónde apoyar primero</h2>
          <p className="mt-2 font-sans text-sm leading-relaxed text-tenue">
            Las {MOSTRAR} constelaciones con más comercios juntos: un solo programa o una sola brigada
            llega a más negocios.
          </p>
          <ol className="mt-3">
            {primeras.map((f, i) => {
              const activa = f.id === elegida;
              return (
                <li key={f.id} className="flex gap-3 border-b border-trazo py-3 last:border-b-0">
                  <Estrella tamano={18} className="mt-1 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-base font-medium text-estrella">
                      <span className="sr-only">{i + 1}. </span>
                      {f.codigo} · <span className="font-cifra tabular-nums">{f.tamano}</span> locales
                    </p>
                    <p className="mt-0.5 break-words font-sans text-sm text-tenue">{f.nombre}</p>
                    {f.barrio && (
                      <p className="mt-0.5 break-words font-sans text-sm text-tenue">
                        Cerca del barrio {f.barrio}
                      </p>
                    )}
                    <button
                      type="button"
                      aria-pressed={activa}
                      aria-label={`${activa ? 'Quitar del mapa' : 'Ver en el mapa'} ${f.codigo}`}
                      onClick={() => elegir(f.id)}
                      className={`mt-2 inline-flex min-h-[44px] items-center rounded-lg border px-4 font-sans text-sm transition-colors ${
                        activa
                          ? 'border-sodio bg-sodio font-medium text-noche'
                          : 'border-trazo-2 text-estrella hover:border-sodio hover:text-sodio'
                      }`}
                    >
                      {activa ? 'Quitar del mapa' : 'Ver en el mapa'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 font-sans text-sm leading-relaxed text-tenue">
            El orden es por tamaño. Todavía no lo cruzamos con la red: con menos de 5 aliados en una
            zona no se puede publicar el número.
          </p>
          <p className="mt-2 font-cifra text-xs leading-relaxed text-tenue">
            Fuente: OpenStreetMap, © colaboradores (ODbL) · datos al {fechaLarga(osmBase)} · agrupados el{' '}
            {fechaLarga(fechaCorrida)}
          </p>
        </div>

        {composicion}
      </div>
    </div>
  );
}
