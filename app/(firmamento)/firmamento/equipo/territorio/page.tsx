import type { Metadata } from 'next';

import type { CentralidadMapa } from '@/components/MapaAliados';
import { MapaBarrios } from '@/components/firmamento/MapaBarrios';
import { VentanaNoche } from '@/components/firmamento/VentanaNoche';
import { CLASE_BOTON_PANEL, hoyBogota, LineaFuente, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import POT from '@/public/firmamento/centralidades.json';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { fichasParaCalidad } from '@/lib/db/equipo.repo';
import { cobertura, OSM, territorio } from '@/lib/firmamento/territorio';
import { MapaTerritorio } from './_components/MapaTerritorio';

export const metadata: Metadata = { title: 'Territorio' };

export const dynamic = 'force-dynamic';

const numero = (n: number) => n.toLocaleString('es-CO');
const pct = (aliados: number, comercios: number) =>
  comercios > 0 ? `${Math.round((aliados / comercios) * 100)} %` : '—';

const CLASE_TH = 'px-2 py-2 sm:px-3 text-left font-sans text-xs font-medium text-tinta/70';
const CLASE_TD = 'border-t border-tinta/12 px-2 sm:px-3 py-2.5 font-sans text-sm tabular-nums text-tinta';

// Solo lo que dibuja el mapa: el resto del JSON (mezcla de categorías, áreas) no viaja al navegador.
const CENTRALIDADES: CentralidadMapa[] = POT.centralidades.map((c) => ({
  id: c.id,
  nombre: c.nombre,
  jerarquia: c.jerarquia,
  geometry: c.geometry as CentralidadMapa['geometry'],
}));

/**
 * Dónde está la red de aliados y dónde no, contra los comercios mapeados en
 * OpenStreetMap. Los comercios de OSM no son aliados ni un censo: la cobertura
 * es una aproximación y el texto lo dice. Las centralidades del POT son una
 * capa de uso interno (licencia de los polígonos pendiente): solo existe acá.
 */
export default async function TerritorioPage() {
  await exigirEquipo();

  const fichas = await fichasParaCalidad();
  const aprobados = fichas.filter((f) => f.estado === 'aprobado');
  const { constelaciones, barrios, fueraDeConstelacion } = territorio(aprobados);
  const cob = cobertura(aprobados);
  const hoy = hoyBogota();
  const fechaOsm = OSM.osm_base.slice(0, 10);
  const fuente = `Fuente: OpenStreetMap (ODbL), descarga ${fechaOsm}; aliados publicados de la base de Constelaciones, ${hoy}`;

  return (
    <div className="flex flex-col gap-6">
      <VentanaNoche titulo="Comercios mapeados, barrio por barrio" id="titulo-mapa-barrios">
        <MapaBarrios
          marco={false}
          filas={barrios.map((b) => ({ barrio: b.barrio, valor: b.comercios }))}
          cifra="comercios"
          descripcion="Comercios mapeados en OpenStreetMap por barrio oficial de la Comuna 3, de más a menos"
          fuente={`Fuente: OpenStreetMap (ODbL), descarga ${fechaOsm} · barrios: Alcaldía de Medellín`}
        />
      </VentanaNoche>

      <VentanaNoche
        titulo="Constelaciones y centralidades"
        id="titulo-mapa-constelaciones"
        descripcion="Cada estrella es un comercio de OpenStreetMap. Enciende las centralidades del Plan de Ordenamiento Territorial (POT) de Medellín, las zonas que la ciudad planea como centros de comercio y servicios, para ver dónde coinciden."
      >
        <MapaTerritorio centralidades={CENTRALIDADES} />
      </VentanaNoche>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Tarjeta titulo="Dónde está la red y dónde no" id="titulo-red" plegable abierta>
          <p className="max-w-prose font-sans text-base leading-relaxed text-tinta/70">
            OpenStreetMap tiene <span className="tabular-nums text-tinta">{numero(OSM.resumen.total_comercios)}</span>{' '}
            comercios mapeados, en <span className="tabular-nums text-tinta">{numero(OSM.resumen.constelaciones)}</span>{' '}
            constelaciones y <span className="tabular-nums text-tinta">{numero(OSM.resumen.puntos_sueltos)}</span> sueltos.
            Hay <span className="tabular-nums text-tinta">{numero(cob.dentro)}</span> aliados publicados dentro de la
            comuna; <span className="tabular-nums text-tinta">{numero(fueraDeConstelacion)}</span> no caen en ninguna
            constelación.
          </p>
          <p className="mt-3 max-w-prose font-sans text-sm leading-relaxed text-tinta/70">
            Los comercios de OpenStreetMap no son aliados ni un censo: sirven para ver dónde falta llegar, no para
            medir el comercio de la comuna.
          </p>
          <LineaFuente>{fuente}</LineaFuente>
        </Tarjeta>

        <Tarjeta
          titulo="Plan de brigada"
          id="titulo-brigada"
          plegable
          abierta
          accion={
            <a href="/api/admin/exportar?conjunto=brigada" download className={CLASE_BOTON_PANEL}>
              Descargar CSV
            </a>
          }
        >
          <p className="font-sans text-sm leading-relaxed text-tinta/70">
            El plan de brigada es la lista de lugares para salir a registrar negocios en persona: las constelaciones
            con más comercios sin registrar. Allí empieza el registro asistido, cuando el equipo llena la ficha con
            el dueño presente. El CSV marca los comercios que quedan a pocos metros de un aliado.
          </p>
          <ol className="mt-4 flex flex-col">
            {constelaciones.slice(0, 5).map((c, i) => (
              <li key={c.id} className="flex gap-3 border-t border-tinta/12 py-3 first:border-t-0 first:pt-0">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-morado-texto font-sans text-xs tabular-nums text-morado-texto">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-sans text-base font-medium text-tinta">
                    {c.codigo} · {c.nombre}
                  </p>
                  <p className="font-sans text-sm tabular-nums text-tinta/70">
                    {c.comercios} comercios · {c.aliados} {c.aliados === 1 ? 'aliado' : 'aliados'}
                    {c.barrio && <> · {c.barrio}</>}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Tarjeta>
      </div>

      <Tarjeta
        titulo="Centralidades del POT"
        id="titulo-centralidades"
        plegable
        resumen={`${POT.centralidades.length} en la comuna`}
      >
        <p className="font-sans text-sm leading-relaxed text-tinta/70">
          Las centralidades del Plan de Ordenamiento Territorial (POT) de Medellín son las zonas que la ciudad planea
          como centros de comercio y servicios. Uso interno: licencia de los polígonos pendiente, por eso no se dibujan en páginas públicas. Del comercio de
          OpenStreetMap, {POT.resumen.pct_comercios_dentro_de_centralidad.toLocaleString('es-CO')} % cae dentro de una
          centralidad.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse">
            <caption className="sr-only">Centralidades urbanas del POT y comercios de OpenStreetMap dentro de cada una</caption>
            <thead>
              <tr>
                <th scope="col" className={CLASE_TH}>Centralidad</th>
                <th scope="col" className={CLASE_TH}>Jerarquía</th>
                <th scope="col" className={`${CLASE_TH} text-right`}>Comercios OSM</th>
                <th scope="col" className={`${CLASE_TH} hidden sm:table-cell`}>Barrios</th>
              </tr>
            </thead>
            <tbody>
              {POT.centralidades.map((c) => (
                <tr key={c.id}>
                  <th scope="row" className={`${CLASE_TD} text-left font-normal`}>{c.nombre}</th>
                  <td className={CLASE_TD}>{c.jerarquia}</td>
                  <td className={`${CLASE_TD} text-right`}>{c.comercios_dentro}</td>
                  <td className={`${CLASE_TD} hidden sm:table-cell`}>{c.barrios.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <LineaFuente>
          Fuente: Alcaldía de Medellín, POT (Acuerdo 48 de 2014), centralidades urbanas; comercio: OpenStreetMap (ODbL) ·
          corrida {POT.fecha_corrida.slice(0, 10)}
        </LineaFuente>
      </Tarjeta>

      <Tarjeta titulo="Cobertura por constelación" id="titulo-constelaciones" plegable resumen={`${constelaciones.length} constelaciones`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <caption className="sr-only">
              Comercios de OpenStreetMap y aliados por constelación, de más a menos comercios sin registrar
            </caption>
            <thead>
              <tr>
                <th scope="col" className={CLASE_TH}>Constelación</th>
                <th scope="col" className={`${CLASE_TH} text-right`}>Comercios OSM</th>
                <th scope="col" className={`${CLASE_TH} text-right`}>Aliados</th>
                <th scope="col" className={`${CLASE_TH} text-right`}>Cobertura</th>
                <th scope="col" className={`${CLASE_TH} hidden sm:table-cell`}>Barrio</th>
              </tr>
            </thead>
            <tbody>
              {constelaciones.map((c) => (
                <tr key={c.id}>
                  <th scope="row" className={`${CLASE_TD} text-left font-normal`}>
                    <span className="font-display italic text-morado-texto">{c.codigo}</span> {c.nombre}
                  </th>
                  <td className={`${CLASE_TD} text-right`}>{c.comercios}</td>
                  <td className={`${CLASE_TD} text-right`}>{c.aliados}</td>
                  <td className={`${CLASE_TD} text-right`}>{pct(c.aliados, c.comercios)}</td>
                  <td className={`${CLASE_TD} hidden text-tinta/70 sm:table-cell`}>{c.barrio ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <LineaFuente>
          {fuente}. Un aliado está en una constelación si cae dentro del radio que contiene al 90 % de sus comercios.
        </LineaFuente>
      </Tarjeta>

      <Tarjeta titulo="Cobertura por barrio oficial" id="titulo-barrios" plegable resumen={`${barrios.length} barrios`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <caption className="sr-only">
              Comercios de OpenStreetMap y aliados por barrio oficial, de más a menos comercios sin registrar
            </caption>
            <thead>
              <tr>
                <th scope="col" className={CLASE_TH}>Barrio</th>
                <th scope="col" className={`${CLASE_TH} text-right`}>Comercios OSM</th>
                <th scope="col" className={`${CLASE_TH} text-right`}>Aliados</th>
                <th scope="col" className={`${CLASE_TH} text-right`}>Cobertura</th>
              </tr>
            </thead>
            <tbody>
              {barrios.map((b) => (
                <tr key={b.barrio}>
                  <th scope="row" className={`${CLASE_TD} text-left font-normal`}>{b.barrio}</th>
                  <td className={`${CLASE_TD} text-right`}>{b.comercios}</td>
                  <td className={`${CLASE_TD} text-right`}>{b.aliados}</td>
                  <td className={`${CLASE_TD} text-right`}>{pct(b.aliados, b.comercios)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <LineaFuente>
          {fuente}. El barrio sale del punto (polígonos de la Alcaldía de Medellín), no del que escribió cada negocio.
        </LineaFuente>
      </Tarjeta>
    </div>
  );
}
