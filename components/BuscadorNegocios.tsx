'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';

import { buscarNegocios, relacionados, type NegocioBuscable } from '@/lib/busqueda';
import { aBuscable, aplanarComercios, esComercioOsm, horarioLegible } from '@/lib/geo/comerciosOsm';
import { useConstelaciones } from './mapa/useConstelaciones';

const MAXIMO_RESULTADOS = 5;

/**
 * Buscador de la portada: resultados al instante mientras se escribe.
 *
 * Es un <form method="get" action="/aliados"> de verdad: Enter lleva a la
 * vitrina con `?q=`, y eso funciona aunque el JavaScript no cargue. Lo de
 * arriba (resultados en vivo, sugerencias) es mejora encima, no el camino.
 *
 * Los comercios de OpenStreetMap entran a la misma búsqueda, con su etiqueta
 * «OpenStreetMap». Su JSON (~43 KB) se pide recién cuando la persona enfoca la
 * caja o toca una sugerencia: quien solo mira la portada no lo descarga.
 *
 * Los resultados van en el flujo de la página y no flotando encima: un panel
 * flotante pide z-index, cierre al hacer clic afuera y manejo de teclado de
 * combobox, y en celular tapa justo lo que la persona quiere ver.
 */
export function BuscadorNegocios({
  negocios,
  sugerencias,
}: {
  negocios: NegocioBuscable[];
  /** Categorías con más negocios, para no arrancar con la caja en blanco. */
  sugerencias: string[];
}) {
  const [consulta, setConsulta] = useState('');
  const [pidioOsm, setPidioOsm] = useState(false);
  const idCampo = useId();

  const { datos } = useConstelaciones(pidioOsm);
  const todos = useMemo<NegocioBuscable[]>(
    () => (datos ? [...negocios, ...aplanarComercios(datos).map(aBuscable)] : negocios),
    [negocios, datos],
  );

  const { resultados, parcial } = useMemo(() => buscarNegocios(todos, consulta), [todos, consulta]);
  const buscando = consulta.trim().length > 1;
  const recomendados = useMemo(
    () => (buscando ? relacionados(negocios, resultados, 3) : []),
    [buscando, negocios, resultados],
  );

  const hrefVitrina = `/aliados?q=${encodeURIComponent(consulta.trim())}`;

  return (
    <div>
      <form method="get" action="/aliados" role="search">
        <label htmlFor={idCampo} className="font-sans text-sm uppercase tracking-[0.15em] text-tinta/65">
          ¿Qué necesitas en el barrio?
        </label>
        <div className="mt-3 flex gap-2">
          <input
            id={idCampo}
            type="search"
            name="q"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            onFocus={() => setPidioOsm(true)}
            placeholder="Arepas, barbería, arreglo de celulares…"
            autoComplete="off"
            className="min-h-[48px] min-w-0 flex-1 border border-tinta/55 bg-hueso px-4 font-sans text-base text-tinta placeholder:text-tinta/65 focus:border-azul focus:outline-none"
          />
          <button
            type="submit"
            className="min-h-[48px] shrink-0 border border-azul-texto bg-azul-texto px-5 font-sans text-base text-hueso transition-colors hover:bg-transparent hover:text-azul-texto"
          >
            Buscar
          </button>
        </div>
      </form>

      {!buscando && sugerencias.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-2 font-sans text-sm text-tinta/60">
          Prueba con:
          {sugerencias.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setPidioOsm(true);
                setConsulta(s);
              }}
              className="min-h-[44px] border border-tinta/55 px-4 text-tinta/75 transition-colors hover:border-azul hover:text-azul-texto"
            >
              {s}
            </button>
          ))}
        </p>
      )}

      {/* aria-live anuncia cuántos hay sin leer la lista entera en cada letra. */}
      <p aria-live="polite" className="sr-only">
        {buscando ? `${resultados.length} resultados encontrados` : ''}
      </p>

      {buscando && (
        <div className="mt-4 border-t border-tinta/12">
          {resultados.length === 0 ? (
            <p className="py-4 font-sans text-sm text-tinta/70">
              No encontramos negocios con esa búsqueda.{' '}
              <Link href="/aliados" className="underline decoration-azul underline-offset-4 hover:text-azul-texto">
                Ver todos
              </Link>
            </p>
          ) : (
            <>
              {parcial && (
                <p className="pt-3 font-sans text-xs text-tinta/60">
                  Ninguno tiene todo lo que escribiste. Estos se parecen:
                </p>
              )}
              <ul>
                {resultados.slice(0, MAXIMO_RESULTADOS).map((n) => (
                  <FilaNegocio
                    key={n.id}
                    negocio={n}
                    // Un comercio de OSM no tiene ficha: lleva a su lugar en «Otros comercios».
                    href={esComercioOsm(n) ? `${hrefVitrina}#otros-comercios` : `${hrefVitrina}#${n.id}`}
                  />
                ))}
              </ul>
              <Link
                href={hrefVitrina}
                className="mt-2 inline-flex min-h-[44px] items-center font-sans text-sm text-azul-texto underline decoration-azul underline-offset-4"
              >
                {resultados.length > MAXIMO_RESULTADOS
                  ? `Ver los ${resultados.length} resultados en el mapa →`
                  : 'Verlos en el mapa →'}
              </Link>
            </>
          )}

          {recomendados.length > 0 && (
            <div className="mt-4">
              <p className="font-sans text-xs uppercase tracking-wider text-tinta/60">También te puede interesar</p>
              <ul>
                {recomendados.map((n) => (
                  <FilaNegocio key={n.id} negocio={n} href={`/aliados#${n.id}`} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilaNegocio({ negocio, href }: { negocio: NegocioBuscable; href: string }) {
  const osm = esComercioOsm(negocio) ? negocio.comercio : null;
  const horario = osm?.detalle?.horario;
  return (
    <li className="border-b border-tinta/10">
      <Link href={href} className="group flex min-h-[52px] items-center justify-between gap-3 py-2.5">
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate font-sans text-base font-medium text-tinta group-hover:text-azul-texto">
              {negocio.nombre}
            </span>
            {osm && (
              <span className="shrink-0 border border-tinta/25 px-1.5 font-sans text-xs text-tinta/75">
                OpenStreetMap
              </span>
            )}
          </span>
          <span className="block truncate font-sans text-sm text-tinta/65">
            {negocio.categoria_otra || negocio.categoria_nombre}
            {osm
              ? osm.detalle?.direccion
                ? ` · ${osm.detalle.direccion}`
                : ''
              : negocio.barrio
                ? ` · ${negocio.barrio}`
                : ''}
          </span>
          {horario && (
            <span className="block truncate font-sans text-sm text-tinta/65">
              {horarioLegible(horario)}
            </span>
          )}
        </span>
        <span aria-hidden="true" className="shrink-0 text-tinta/40 group-hover:text-azul-texto">
          →
        </span>
      </Link>
    </li>
  );
}
