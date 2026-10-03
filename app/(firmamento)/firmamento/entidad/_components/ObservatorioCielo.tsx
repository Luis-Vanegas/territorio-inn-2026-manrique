'use client';

import { Estrella } from '@/components/firmamento/Estrella';
import {
  BotonConstelacion,
  MapaEstelar,
  useConstelacionElegida,
} from '@/components/firmamento/MapaEstelar';
import { LineaFuente, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { VentanaNoche } from '@/components/firmamento/VentanaNoche';
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
 * Todo va en una sola `VentanaNoche`: es lectura de datos, la parte de noche de
 * una página de día. La `Tarjeta` de adentro toma sola la paleta de noche.
 */

const MOSTRAR = 3;

export function ObservatorioCielo({
  filas,
  osmBase,
  fechaCorrida,
}: {
  filas: FilaConstelacion[];
  osmBase: string;
  fechaCorrida: string;
}) {
  const { elegida, elegir, fijar, caja } = useConstelacionElegida(80);
  const primeras = [...filas].sort((a, b) => b.tamano - a.tamano).slice(0, MOSTRAR);

  return (
    <VentanaNoche
      titulo="Constelaciones comerciales de la Comuna 3"
      id="mapa-estelar"
      descripcion="Cada marca es un comercio mapeado en OpenStreetMap; las líneas unen a los de una misma constelación. No hay aliados individuales en este mapa."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <MapaEstelar elegida={elegida} fijar={fijar} caja={caja} />

        <Tarjeta titulo="Dónde apoyar primero" id="apoyar-primero">
          <p className="font-sans text-sm leading-relaxed text-tinta/70">
            Las {MOSTRAR} constelaciones con más comercios juntos: un solo programa o una sola brigada llega a más
            negocios.
          </p>
          <ol className="mt-3">
            {primeras.map((f, i) => {
              const activa = f.id === elegida;
              return (
                <li key={f.id} className="flex gap-3 border-b border-tinta/12 py-3 last:border-b-0">
                  <Estrella tamano={18} className="mt-1 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-base font-medium text-tinta">
                      <span className="sr-only">{i + 1}. </span>
                      {f.codigo} · <span className="tabular-nums">{f.tamano}</span> locales
                    </p>
                    <p className="mt-0.5 break-words font-sans text-sm text-tinta/70">{f.nombre}</p>
                    {f.barrio && (
                      <p className="mt-0.5 break-words font-sans text-sm text-tinta/70">Cerca del barrio {f.barrio}</p>
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
          <p className="mt-3 font-sans text-sm leading-relaxed text-tinta/70">
            El orden es por tamaño. Todavía no lo cruzamos con la red: con menos de 5 aliados en una zona no se puede
            publicar el número.
          </p>
          <LineaFuente>
            Fuente: OpenStreetMap, © colaboradores (ODbL) · datos al {fechaLarga(osmBase)} · agrupados el{' '}
            {fechaLarga(fechaCorrida)}
          </LineaFuente>
        </Tarjeta>
      </div>
    </VentanaNoche>
  );
}
