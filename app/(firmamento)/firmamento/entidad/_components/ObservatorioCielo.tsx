'use client';

import { Estrella } from '@/components/firmamento/Estrella';
import {
  BotonConstelacion,
  MapaEstelar,
  useConstelacionElegida,
} from '@/components/firmamento/MapaEstelar';
import type { FilaConstelacion } from '@/app/(site)/firmamento/datos';
import { fechaLarga } from '@/lib/geo/constelaciones';

/**
 * El mapa de constelaciones y «Dónde apoyar primero», que comparten un estado: la
 * constelación elegida. Tocar «Ver en el mapa» enciende esa constelación; el
 * selector del propio mapa («Ver una sola») cambia el botón marcado.
 *
 * El estado y el mapa son los de `/firmamento` (`components/firmamento/MapaEstelar`),
 * SIN aliados individuales: ningún nombre, dirección ni coordenada de un negocio
 * de la red llega a esta pantalla (regla k = 5). Las marcas son comercios de
 * OpenStreetMap, que ya son públicos.
 *
 * `composicion` es la tarjeta de composición de la red, que se renderiza en el
 * servidor y entra como hijo: así el estado de esta columna no la arrastra al cliente.
 */

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
  const { elegida, elegir, fijar, caja } = useConstelacionElegida(80);
  const primeras = [...filas].sort((a, b) => b.tamano - a.tamano).slice(0, MOSTRAR);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
      <div className="min-w-0">
        <h2 className="mb-3 font-sans text-lg font-medium text-estrella">
          Constelaciones comerciales de la Comuna 3
        </h2>
        <MapaEstelar elegida={elegida} fijar={fijar} caja={caja} />
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
                    <BotonConstelacion
                      variante="texto"
                      codigo={f.codigo}
                      activa={activa}
                      alAlternar={() => elegir(f.id)}
                    />
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
