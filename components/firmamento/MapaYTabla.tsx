'use client';

import { useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { MapaAliados } from '@/components/MapaAliados';
import { svgForma } from '@/components/mapa/formas';
import { fechaLarga } from '@/lib/geo/constelaciones';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import type { BarraCategoria, FilaConstelacion } from '@/app/(site)/firmamento/datos';
import { Seccion } from './Seccion';

/**
 * β (mapa estelar) y γ (tabla de constelaciones) comparten un estado: la
 * constelación elegida. Tocar una fila de la tabla la enciende en el mapa; el
 * selector del propio mapa («Ver una sola») cambia la fila marcada.
 *
 * El mapa es el de siempre (`MapaAliados`), en modo noche fijo: aquí no hay un
 * segundo mapa.
 */

type Props = {
  portafolios: Portafolio[];
  filas: FilaConstelacion[];
  barras: BarraCategoria[];
  totalComercios: number;
  osmBase: string;
  fechaCorrida: string;
};

export function MapaYTabla({
  portafolios,
  filas,
  barras,
  totalComercios,
  osmBase,
  fechaCorrida,
}: Props) {
  const [elegida, setElegida] = useState('');
  const cajaMapa = useRef<HTMLDivElement>(null);
  const sinMovimiento = useReducedMotion();

  function elegir(id: string) {
    const nueva = id === elegida ? '' : id;
    setElegida(nueva);
    // La tabla queda debajo del mapa: si el mapa no se ve entero, se lo trae a la vista.
    const caja = cajaMapa.current;
    if (nueva && caja) {
      const r = caja.getBoundingClientRect();
      if (r.top < 120 || r.bottom > window.innerHeight) {
        caja.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth', block: 'center' });
      }
    }
  }

  const maximo = Math.max(...barras.map((b) => b.n), 1);

  return (
    <>
      <Seccion
        id="mapa"
        letra="β"
        titulo="Mapa estelar de la Comuna 3"
        descripcion={`${totalComercios} comercios mapeados en OpenStreetMap dentro de la comuna. Las líneas unen a los de cada constelación; las formas grandes de color son los aliados de la red.`}
      >
        <div ref={cajaMapa}>
          <MapaAliados
            portafolios={portafolios}
            variante="vitrina"
            conFiltro
            noche
            constelacionElegida={elegida}
            alElegirConstelacion={setElegida}
          />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="border border-trazo bg-noche-2 p-5">
            <h3 className="font-sans text-lg font-medium text-estrella">Cómo leerlo</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 font-sans text-base leading-relaxed text-estrella marker:text-sodio">
              <li>
                Cada estrella es un comercio mapeado en OpenStreetMap. No es aliado: tócala para ver su
                nombre y su dirección.
              </li>
              <li>
                Las estrellas unidas por líneas forman una constelación: un grupo de al menos 6
                comercios vecinos.
              </li>
              <li>
                Los puntos pequeños y sueltos son comercios que no quedaron en ninguna constelación.
              </li>
              <li>
                Para encender una constelación, elige una fila de la tabla de abajo o usa «Ver una
                sola» sobre el mapa.
              </li>
            </ul>
          </div>

          <div className="border border-trazo bg-noche-2 p-5">
            <h3 className="font-sans text-lg font-medium text-estrella">Qué hay, por categoría</h3>
            <ul className="mt-3 space-y-3">
              {barras.map((b) => (
                <li key={b.id}>
                  <div className="flex items-center justify-between gap-3 font-sans text-sm text-estrella">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-flex shrink-0"
                        dangerouslySetInnerHTML={{ __html: svgForma(b.grupo, 16) }}
                      />
                      <span className="min-w-0 break-words">{b.nombre}</span>
                    </span>
                    <span className="shrink-0 font-cifra tabular-nums text-estrella">{b.n}</span>
                  </div>
                  <div className="mt-1 h-2 bg-noche-3" aria-hidden="true">
                    <div
                      className="h-full"
                      style={{ width: `${(b.n / maximo) * 100}%`, backgroundColor: b.grupo.color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-sans text-sm leading-relaxed text-tenue">
              Cada categoría lleva la forma de su grupo: el color solo la refuerza. Cuenta los comercios
              con y sin nombre.
            </p>
            <p className="mt-2 font-cifra text-xs leading-relaxed text-tenue">
              Fuente: OpenStreetMap, © colaboradores (ODbL) · datos al {fechaLarga(osmBase)}
            </p>
          </div>
        </div>
      </Seccion>

      <Seccion
        id="constelaciones"
        letra="γ"
        titulo={`Las ${filas.length} constelaciones`}
        descripcion="Agrupamiento por densidad (HDBSCAN) sobre las coordenadas de los comercios, medidas en metros. Elige una fila y se enciende en el mapa."
      >
        <div className="overflow-x-auto border border-trazo">
          <table className="w-full border-collapse text-left font-sans text-sm text-estrella">
            <caption className="sr-only">
              Constelaciones de comercios de OpenStreetMap en la Comuna 3: código, nombre, cantidad de
              comercios, radio en metros y mezcla de categorías. Elige el código de una fila para
              encenderla en el mapa.
            </caption>
            <thead className="bg-noche-3 text-tenue">
              <tr>
                <th scope="col" className="px-2 py-3 font-medium sm:px-3">
                  Código
                </th>
                <th scope="col" className="px-2 py-3 font-medium sm:px-3">
                  Nombre
                </th>
                <th scope="col" className="px-2 py-3 text-right text-xs font-medium sm:px-3 sm:text-sm">
                  Comercios
                </th>
                <th scope="col" className="hidden px-3 py-3 text-right font-medium sm:table-cell">
                  Radio
                </th>
                <th scope="col" className="hidden px-3 py-3 font-medium lg:table-cell">
                  Mezcla principal
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const activa = f.id === elegida;
                return (
                  <tr
                    key={f.id}
                    onClick={() => elegir(f.id)}
                    className={`cursor-pointer border-t border-trazo transition-colors ${
                      activa ? 'bg-noche-activa' : 'hover:bg-noche-3'
                    }`}
                  >
                    <th scope="row" className="px-2 py-1 align-middle font-normal sm:px-3">
                      <button
                        type="button"
                        aria-pressed={activa}
                        aria-label={`${activa ? 'Apagar' : 'Encender'} ${f.codigo} en el mapa`}
                        className={`inline-flex min-h-[44px] min-w-[52px] items-center justify-center border px-2 font-sans text-sm font-medium transition-colors ${
                          activa
                            ? 'border-sodio bg-sodio text-noche'
                            : 'border-trazo-2 text-sodio hover:border-sodio'
                        }`}
                      >
                        {f.codigo}
                      </button>
                    </th>
                    <td className="min-w-0 px-2 py-2 align-middle sm:px-3">
                      <span className="break-words text-estrella">{f.nombre}</span>
                      {/* En pantallas angostas el radio y la mezcla bajan bajo el nombre. */}
                      <span className="mt-1 block font-cifra text-xs text-tenue sm:hidden">
                        Radio {f.radioM} m
                      </span>
                      <span className="mt-1 block break-words text-xs leading-snug text-tenue lg:hidden">
                        {f.mezcla}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right align-middle font-cifra tabular-nums sm:px-3">
                      {f.tamano}
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-2 text-right align-middle font-cifra tabular-nums sm:table-cell">
                      {f.radioM} m
                    </td>
                    <td className="hidden px-3 py-2 align-middle text-tenue lg:table-cell">
                      {f.mezcla}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-3xl font-sans text-sm leading-relaxed text-tenue">
          El nombre une la calle que más repiten los comercios del grupo en OpenStreetMap con su
          categoría más común; «Sin calle registrada» quiere decir que OpenStreetMap no trae calle para
          ellos. El radio es la distancia del centro al comercio más lejano del grupo.
        </p>
        <p className="mt-2 font-cifra text-xs leading-relaxed text-tenue">
          Fuente: OpenStreetMap, © colaboradores (ODbL) · datos al {fechaLarga(osmBase)} · agrupados el{' '}
          {fechaLarga(fechaCorrida)}
        </p>
      </Seccion>
    </>
  );
}
