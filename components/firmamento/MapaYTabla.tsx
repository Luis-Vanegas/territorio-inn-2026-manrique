'use client';

import { fechaLarga } from '@/lib/geo/constelaciones';
import type { BarraCategoria, FilaConstelacion } from '@/app/(site)/firmamento/datos';
import { BarrasCategoria } from './BarrasCategoria';
import { BotonConstelacion, MapaEstelar, useConstelacionElegida } from './MapaEstelar';
import { Seccion } from './Seccion';

/**
 * β (mapa estelar) y γ (tabla de constelaciones) comparten un estado: la
 * constelación elegida. Tocar una fila de la tabla la enciende en el mapa; el
 * selector del propio mapa («Ver una sola») cambia la fila marcada.
 *
 * El estado y el mapa viven en `MapaEstelar` (los comparte con el observatorio
 * de la entidad): aquí no hay un segundo mapa.
 */

type Props = {
  /** Mínimo de comercios por constelación (del JSON de OSM, no escrito a mano). */
  minCluster: number;
  filas: FilaConstelacion[];
  barras: BarraCategoria[];
  totalComercios: number;
  osmBase: string;
  fechaCorrida: string;
};

export function MapaYTabla({
  minCluster,
  filas,
  barras,
  totalComercios,
  osmBase,
  fechaCorrida,
}: Props) {
  const { elegida, elegir, fijar, caja } = useConstelacionElegida();

  return (
    <>
      <Seccion
        id="mapa"
        letra="β"
        titulo="Mapa estelar de la Comuna 3"
        descripcion={`${totalComercios} comercios mapeados en OpenStreetMap dentro de la comuna. Las líneas unen a los de cada constelación; los aliados se ven en la sección Aliados.`}
      >
        <MapaEstelar elegida={elegida} fijar={fijar} caja={caja} />

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="border border-trazo bg-noche-2 p-5">
            <h3 className="font-sans text-lg font-medium text-estrella">Cómo leerlo</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 font-sans text-base leading-relaxed text-estrella marker:text-sodio">
              <li>
                Cada marca es un comercio mapeado en OpenStreetMap, y su forma dice a qué grupo pertenece
                (círculo, cuadrado, rombo, triángulo, cruz o anillo). No es aliado: tócala para ver su
                nombre y su dirección.
              </li>
              <li>
                Los comercios unidos por líneas forman una constelación: un grupo de al menos {minCluster}{' '}
                comercios vecinos.
              </li>
              <li>
                Las marcas más pequeñas y tenues, sin líneas, son comercios que no quedaron en ninguna
                constelación.
              </li>
              <li>
                Para encender una constelación, elige una fila de la tabla de abajo o usa «Ver una
                sola» sobre el mapa.
              </li>
            </ul>
          </div>

          <div className="border border-trazo bg-noche-2 p-5">
            <h3 className="font-sans text-lg font-medium text-estrella">Qué hay, por categoría</h3>
            <BarrasCategoria
              className="mt-3"
              columna="Comercios"
              descripcion="Comercios mapeados en OpenStreetMap dentro de la Comuna 3, por categoría, con la forma de su grupo"
              filas={barras.map((b) => ({ id: b.id, nombre: b.nombre, valor: b.n, grupo: b.grupo }))}
            />
            <p className="mt-4 font-sans text-sm leading-relaxed text-tenue">
              Cada categoría lleva la forma de su grupo: el color solo la refuerza. Cuenta los comercios
              con y sin nombre.
            </p>
            <p className="mt-2 font-sans tabular-nums text-xs leading-relaxed text-tenue">
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
                    className={`border-t border-trazo transition-colors ${
                      activa ? 'bg-noche-activa' : 'hover:bg-noche-3'
                    }`}
                  >
                    <th scope="row" className="px-2 py-1 align-middle font-normal sm:px-3">
                      <BotonConstelacion
                        codigo={f.codigo}
                        activa={activa}
                        alAlternar={() => elegir(f.id)}
                      />
                    </th>
                    <td className="min-w-0 px-2 py-2 align-middle sm:px-3">
                      <span className="break-words text-estrella">{f.nombre}</span>
                      {/* En pantallas angostas el radio y la mezcla bajan bajo el nombre. */}
                      <span className="mt-1 block font-sans tabular-nums text-xs text-tenue sm:hidden">
                        Radio {f.radioM} m
                      </span>
                      <span className="mt-1 block break-words text-xs leading-snug text-tenue lg:hidden">
                        {f.mezcla}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right align-middle font-sans tabular-nums sm:px-3">
                      {f.tamano}
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-2 text-right align-middle font-sans tabular-nums sm:table-cell">
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
        <p className="mt-2 font-sans tabular-nums text-xs leading-relaxed text-tenue">
          Fuente: OpenStreetMap, © colaboradores (ODbL) · datos al {fechaLarga(osmBase)} · agrupados el{' '}
          {fechaLarga(fechaCorrida)}
        </p>
      </Seccion>
    </>
  );
}
