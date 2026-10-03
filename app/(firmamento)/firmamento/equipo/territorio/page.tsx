import type { Metadata } from 'next';

import { CLASE_BOTON_PANEL, hoyBogota, LineaFuente, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { fichasParaCalidad } from '@/lib/db/equipo.repo';
import { cobertura, OSM, territorio } from '@/lib/firmamento/territorio';

export const metadata: Metadata = { title: 'Territorio' };

export const dynamic = 'force-dynamic';

const numero = (n: number) => n.toLocaleString('es-CO');
const pct = (aliados: number, comercios: number) =>
  comercios > 0 ? `${Math.round((aliados / comercios) * 100)} %` : '—';

const CLASE_TH = 'px-2 py-2 sm:px-3 text-left font-sans text-xs font-medium text-tenue';
const CLASE_TD = 'border-t border-trazo px-2 sm:px-3 py-2.5 font-sans text-sm text-estrella';

/**
 * Dónde está la red de aliados y dónde no, contra los comercios mapeados en
 * OpenStreetMap. Los comercios de OSM no son aliados ni un censo: la cobertura
 * es una aproximación y el texto lo dice.
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
      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta titulo="Dónde está la red y dónde no" id="titulo-red">
          <p className="max-w-prose font-sans text-base leading-relaxed text-tenue">
            OpenStreetMap tiene <span className="font-cifra text-estrella">{numero(OSM.resumen.total_comercios)}</span>{' '}
            comercios mapeados en la Comuna 3, agrupados en{' '}
            <span className="font-cifra text-estrella">{numero(OSM.resumen.constelaciones)}</span> constelaciones y{' '}
            <span className="font-cifra text-estrella">{numero(OSM.resumen.puntos_sueltos)}</span> sueltos. Hay{' '}
            <span className="font-cifra text-estrella">{numero(cob.dentro)}</span> aliados publicados dentro de la comuna;{' '}
            <span className="font-cifra text-estrella">{numero(fueraDeConstelacion)}</span> de los publicados no caen en
            ninguna constelación.
          </p>
          <p className="mt-3 max-w-prose font-sans text-sm leading-relaxed text-tenue">
            Los comercios de OpenStreetMap no son aliados ni un censo: los mapeó
            alguien. Sirven para ver dónde falta llegar, no para medir el comercio
            de la comuna.
          </p>
          <LineaFuente>{fuente}</LineaFuente>
        </Tarjeta>

        <Tarjeta
          titulo="Plan de brigada"
          id="titulo-brigada"
          accion={
            <a href="/api/admin/exportar?conjunto=brigada" download className={CLASE_BOTON_PANEL}>
              Descargar CSV
            </a>
          }
        >
          <p className="font-sans text-sm leading-relaxed text-tenue">
            Constelaciones con más comercios sin registrar: por aquí empieza el
            registro asistido. El CSV trae cada comercio de OpenStreetMap con su
            dirección, en este orden, y marca los que quedan a pocos metros de un
            aliado (probablemente ya están en la red).
          </p>
          <ol className="mt-4 flex flex-col">
            {constelaciones.slice(0, 5).map((c, i) => (
              <li key={c.id} className="flex gap-3 border-t border-trazo py-3 first:border-t-0 first:pt-0">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-sodio font-cifra text-xs text-sodio">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-sans text-base font-medium text-estrella">
                    {c.codigo} · {c.nombre}
                  </p>
                  <p className="font-sans text-sm text-tenue">
                    <span className="font-cifra">{c.comercios}</span> comercios ·{' '}
                    <span className="font-cifra">{c.aliados}</span> {c.aliados === 1 ? 'aliado' : 'aliados'}
                    {c.barrio && <> · {c.barrio}</>}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Tarjeta>
      </div>

      <Tarjeta titulo="Cobertura por constelación" id="titulo-constelaciones">
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
                    <span className="font-display italic text-sodio">{c.codigo}</span> {c.nombre}
                  </th>
                  <td className={`${CLASE_TD} text-right font-cifra`}>{c.comercios}</td>
                  <td className={`${CLASE_TD} text-right font-cifra`}>{c.aliados}</td>
                  <td className={`${CLASE_TD} text-right font-cifra`}>{pct(c.aliados, c.comercios)}</td>
                  <td className={`${CLASE_TD} hidden text-tenue sm:table-cell`}>{c.barrio ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <LineaFuente>
          {fuente}. Un aliado está en una constelación si cae dentro del radio que contiene al 90 % de sus comercios.
        </LineaFuente>
      </Tarjeta>

      <Tarjeta titulo="Cobertura por barrio oficial" id="titulo-barrios">
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
                  <td className={`${CLASE_TD} text-right font-cifra`}>{b.comercios}</td>
                  <td className={`${CLASE_TD} text-right font-cifra`}>{b.aliados}</td>
                  <td className={`${CLASE_TD} text-right font-cifra`}>{pct(b.aliados, b.comercios)}</td>
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
