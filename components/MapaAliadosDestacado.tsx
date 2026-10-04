'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapaAliados, type ResultadosMapa } from './MapaAliados';
import { ID_CAMPO_BUSQUEDA, Sugerencias, useBusquedaInicio } from './BusquedaInicio';
import { useConstelaciones } from './mapa/useConstelaciones';
import { BotonConstelacion, useConstelacionElegida } from './firmamento/MapaEstelar';
import { buscarNegocios, terminosDe, type NegocioBuscable } from '@/lib/busqueda';
import { aBuscable, aplanarComercios, comerciosConNombre, esComercioOsm } from '@/lib/geo/comerciosOsm';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import type { Coordenada } from '@/lib/geo/constantes';

type EstadoGeo = 'pidiendo' | 'listo' | 'sin_permiso';

export type ConstelacionLista = { id: string; codigo: string; nombre: string; tamano: number };

/** Espera a que la persona deje de escribir antes de mover el mapa. */
const RETRASO_BUSQUEDA_MS = 250;

/**
 * Mapa del inicio, con ubicación automática al montar.
 *
 * A diferencia de VitrinaAliados (que pide el permiso solo cuando la persona
 * toca un botón — un permiso que salta sin gesto se deniega por reflejo, y
 * Chrome castiga al sitio que lo pide así), acá el pedido es automático a
 * pedido explícito: la idea es que la primera impresión del sitio ya muestre
 * qué tan cerca está el visitante de los negocios.
 *
 * Si el navegador deniega el permiso o no responde, el mapa se queda con el
 * encuadre de siempre (todo Manrique) y aparece un botón chico para volver a
 * intentarlo a mano — sin eso, alguien que tocó "bloquear" sin querer, o cuyo
 * GPS tardó en arrancar, se queda sin forma de recuperar la función.
 *
 * `estado` arranca siempre en 'pidiendo', server y cliente por igual: chequear
 * `'geolocation' in navigator` en el cuerpo del componente (en vez de dentro
 * del efecto) rendería distinto en el servidor —sin `navigator`— que en el
 * cliente, y React tira error de hidratación por la diferencia.
 *
 * Al lado (debajo en el celular) va la lista de constelaciones: tocar una la
 * enciende en el mapa. El estado es el de `useConstelacionElegida`, el mismo de
 * los paneles: no hay un segundo mapa ni una segunda lógica.
 *
 * El buscador de arriba (`BusquedaInicio`) filtra ESTE mapa: con una búsqueda
 * activa solo quedan los negocios que devuelve `buscarNegocios` (aliados y
 * comercios de OSM con nombre) y la lista de al lado pasa a ser la de resultados.
 */
export function MapaAliadosDestacado({
  portafolios,
  constelaciones,
}: {
  portafolios: Portafolio[];
  constelaciones: ConstelacionLista[];
}) {
  const { elegida, elegir, fijar, caja } = useConstelacionElegida();
  const [ubicacion, setUbicacion] = useState<Coordenada | null>(null);
  const [estado, setEstado] = useState<EstadoGeo>('pidiendo');

  const { consulta, setConsulta } = useBusquedaInicio();
  const [q, setQ] = useState('');
  const [enLista, setEnLista] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(
      () => {
        setQ(consulta);
        setEnLista(null);
      },
      consulta.trim() ? RETRASO_BUSQUEDA_MS : 0,
    );
    return () => clearTimeout(t);
  }, [consulta]);

  const { datos } = useConstelaciones();
  const buscando = terminosDe(q).length > 0;
  const { encontrados, parcial } = useMemo(() => {
    if (!buscando) return { encontrados: [] as NegocioBuscable[], parcial: false };
    const osm = datos ? comerciosConNombre(aplanarComercios(datos)).map(aBuscable) : [];
    const r = buscarNegocios<NegocioBuscable>([...portafolios, ...osm], q);
    return { encontrados: r.resultados, parcial: r.parcial };
  }, [buscando, datos, portafolios, q]);

  const portafoliosVisibles = useMemo(() => {
    if (!buscando) return portafolios;
    const ids = new Set(encontrados.filter((n) => !esComercioOsm(n)).map((n) => n.id));
    return portafolios.filter((p) => ids.has(p.id));
  }, [buscando, encontrados, portafolios]);
  const resultados = useMemo<ResultadosMapa | null>(
    () => (buscando ? { comercios: encontrados.flatMap((n) => (esComercioOsm(n) ? [n.comercio] : [])) } : null),
    [buscando, encontrados],
  );

  function limpiar() {
    setConsulta('');
    document.getElementById(ID_CAMPO_BUSQUEDA)?.focus();
  }

  // Sin setState sincrónico en el cuerpo: solo suscribe el callback async de
  // la API del navegador, que es donde React espera que se actualice el estado.
  const solicitar = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacion([pos.coords.latitude, pos.coords.longitude]);
        setEstado('listo');
      },
      () => setEstado('sin_permiso'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) solicitar();
    // Automático solo al montar — el reintento manual lo dispara el botón de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reintentar = useCallback(() => {
    setEstado('pidiendo');
    solicitar();
  }, [solicitar]);

  const textoQ = q.trim();

  return (
    <div>
      {/* aria-live anuncia el conteo sin leer la lista entera en cada letra. */}
      <div aria-live="polite" className={buscando ? 'mb-4' : undefined}>
        {buscando && (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p className="font-sans text-sm font-medium text-tinta">
                {encontrados.length === 0
                  ? `No encontramos negocios para «${textoQ}»`
                  : `${encontrados.length} ${encontrados.length === 1 ? 'resultado' : 'resultados'} para «${textoQ}»`}
              </p>
              <button
                type="button"
                onClick={limpiar}
                className="inline-flex min-h-[44px] items-center font-sans text-sm text-azul-texto underline decoration-azul underline-offset-4 hover:text-tinta"
              >
                Limpiar búsqueda
              </button>
            </div>
            {parcial && encontrados.length > 0 && (
              <p className="font-sans text-xs text-tinta/65">Ninguno tiene todo lo que escribiste. Estos se parecen.</p>
            )}
            {encontrados.length === 0 && <Sugerencias />}
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div ref={caja} className="min-w-0 scroll-mt-24 lg:col-span-8">
          <MapaAliados
            portafolios={portafoliosVisibles}
            ubicacionUsuario={ubicacion}
            variante="portada"
            constelacionElegida={elegida}
            alElegirConstelacion={fijar}
            resultados={resultados}
            seleccionadoEnLista={enLista}
          />
          {estado === 'sin_permiso' && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={reintentar}
                className="inline-flex min-h-[44px] items-center gap-2 border border-tinta/55 px-3 py-1.5 font-sans text-xs text-tinta/60 transition-colors hover:border-azul-texto hover:text-azul-texto"
              >
                <span aria-hidden="true">◎</span>
                Ver los que tengo cerca
              </button>
              <span className="max-w-md font-sans text-xs leading-relaxed text-tinta/65">
                Si lo presionas y das permiso a tu ubicación, te mostramos qué negocios tienes cerca y a qué
                distancia. Tu ubicación se usa solo en tu navegador. No se envía ni se guarda.
              </span>
            </div>
          )}
        </div>

        {buscando ? (
          encontrados.length > 0 && (
            <section aria-labelledby="titulo-lista-resultados" className="min-w-0 lg:col-span-4">
              <h2 id="titulo-lista-resultados" className="font-sans text-sm font-medium text-tinta">
                Toca uno para verlo en el mapa
              </h2>
              <ul className="mt-2 max-h-[34rem] divide-y divide-tinta/10 overflow-y-auto border-y border-tinta/10">
                {encontrados.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => setEnLista(n.id)}
                      aria-pressed={enLista === n.id}
                      className={`flex min-h-[44px] w-full flex-col items-start py-2 pl-2 pr-1 text-left transition-colors hover:text-azul-texto ${
                        enLista === n.id ? 'bg-tinta/[0.06]' : ''
                      }`}
                    >
                      <span className="break-words font-sans text-sm font-medium leading-snug text-tinta">
                        {n.nombre}
                        {!esComercioOsm(n) && (
                          <span className="ml-2 border border-tinta/30 px-1.5 text-xs font-normal text-tinta/75">
                            Aliado
                          </span>
                        )}
                      </span>
                      <span className="break-words font-sans text-xs text-tinta/65">
                        {n.categoria_otra || n.categoria_nombre}
                        {n.barrio ? ` · ${n.barrio}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        ) : (
          <section aria-labelledby="titulo-lista-constelaciones" className="min-w-0 lg:col-span-4">
            <h2 id="titulo-lista-constelaciones" className="font-sans text-sm font-medium text-tinta">
              {constelaciones.length} constelaciones · toca una para verla
            </h2>
            <ul className="mt-2 max-h-[34rem] divide-y divide-tinta/10 overflow-y-auto border-y border-tinta/10">
              {constelaciones.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-1.5">
                  <BotonConstelacion codigo={c.codigo} activa={c.id === elegida} alAlternar={() => elegir(c.id)} />
                  <span className="min-w-0 break-words font-sans text-sm leading-snug text-tinta">
                    {c.nombre}
                    <span className="block text-xs tabular-nums text-tinta/65">{c.tamano} comercios</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
