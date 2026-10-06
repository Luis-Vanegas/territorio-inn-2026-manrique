'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapaAliados, type ResultadosMapa } from './MapaAliados';
import { ID_CAMPO_BUSQUEDA, Sugerencias, useBusquedaInicio } from './BusquedaInicio';
import { useConstelaciones } from './mapa/useConstelaciones';
import { claseChipConstelacion, useConstelacionElegida } from './firmamento/MapaEstelar';
import { FichaComercioOsm } from './mapa/FichaComercioOsm';
import { TarjetaEmprendimiento } from './vitrina/TarjetaEmprendimiento';
import { buscarNegocios, terminosDe, type NegocioBuscable } from '@/lib/busqueda';
import { aBuscable, aplanarComercios, comerciosConNombre, esComercioOsm } from '@/lib/geo/comerciosOsm';
import { barrioDe } from '@/lib/geo/barrioOficial';
import { distanciaMetros, formatearDistancia } from '@/lib/geo/distancia';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import type { DefinicionCampo } from '@/lib/db/camposPersonalizados.repo';
import type { Coordenada } from '@/lib/geo/constantes';

type EstadoGeo = 'pidiendo' | 'listo' | 'sin_permiso';

export type ConstelacionLista = { id: string; codigo: string; nombre: string; tamano: number };

/** Espera a que la persona deje de escribir antes de mover el mapa. */
const RETRASO_BUSQUEDA_MS = 250;

/** «Qué tengo cerca»: lo que queda a una caminata corta, de lo más cercano a lo más lejano. */
const RADIO_CERCA_M = 500;
const MAX_CERCA = 40;

type Fila = { n: NegocioBuscable; distancia: number | null };

/** Los aliados de una lista son los mismos objetos `Portafolio` que entraron a `buscarNegocios`. */
function coordenadaDe(n: NegocioBuscable): Coordenada {
  if (esComercioOsm(n)) return [n.comercio.lat, n.comercio.lon];
  const p = n as Portafolio;
  return [p.latitud, p.longitud];
}

/** Mismo aspecto que «Líneas de constelación» (MapaAliados), para que se lean como un par. */
function claseInterruptor(activo: boolean) {
  return `inline-flex min-h-[44px] items-center gap-2 border px-4 font-sans text-sm transition-colors ${
    activo
      ? 'border-noche bg-noche text-estrella dark:border-trazo-2'
      : 'border-tinta/40 text-tinta hover:border-azul-texto hover:text-azul-texto'
  }`;
}

const CLASE_ENLACE =
  'inline-flex min-h-[44px] items-center font-sans text-sm text-azul-texto underline decoration-azul underline-offset-4 hover:text-tinta';

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
 * encuadre de siempre (todo Manrique); «Qué tengo cerca» vuelve a pedirlo a mano
 * — sin eso, alguien que tocó "bloquear" sin querer, o cuyo GPS tardó en
 * arrancar, se queda sin forma de recuperar la función.
 *
 * `estado` arranca siempre en 'pidiendo', server y cliente por igual: chequear
 * `'geolocation' in navigator` en el cuerpo del componente (en vez de dentro
 * del efecto) rendería distinto en el servidor —sin `navigator`— que en el
 * cliente, y React tira error de hidratación por la diferencia.
 *
 * Al lado (debajo en el celular) va la lista de constelaciones: tocar una fila la
 * enciende en el mapa. El estado es el de `useConstelacionElegida`, el mismo de
 * los paneles: no hay un segundo mapa ni una segunda lógica.
 *
 * El buscador de arriba (`BusquedaInicio`) filtra ESTE mapa: con una búsqueda
 * activa solo quedan los negocios que devuelve `buscarNegocios` (aliados y
 * comercios de OSM con nombre) y la lista de al lado pasa a ser la de resultados.
 * «Qué tengo cerca» hace lo mismo con lo que queda a menos de 500 m, y dice en
 * qué barrio está la persona (`barrioDe`).
 *
 * Tocar un negocio de esas listas (o la estrella de un aliado) abre su ficha en la
 * columna de al lado: la tarjeta REAL de la vitrina (`TarjetaEmprendimiento`,
 * angosta) o, para un comercio de OSM, lo que OSM sabe (`FichaComercioOsm`).
 *
 * ponytail: en el celular la ficha queda debajo del mapa y no se desplaza sola
 * al tocar una estrella (el popup ya muestra lo básico). Si se pide, scrollIntoView.
 */
export function MapaAliadosDestacado({
  portafolios,
  constelaciones,
  definicionesCampos,
}: {
  portafolios: Portafolio[];
  constelaciones: ConstelacionLista[];
  definicionesCampos: DefinicionCampo[];
}) {
  const { elegida, elegir, fijar, caja } = useConstelacionElegida();
  const [ubicacion, setUbicacion] = useState<Coordenada | null>(null);
  const [estado, setEstado] = useState<EstadoGeo>('pidiendo');

  const { consulta, setConsulta } = useBusquedaInicio();
  const [q, setQ] = useState('');
  const [enLista, setEnLista] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [cerca, setCerca] = useState(false);
  useEffect(() => {
    const t = setTimeout(
      () => {
        setQ(consulta);
        setEnLista(null);
        setAbierta(null);
        if (consulta.trim()) setCerca(false);
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

  const cercanos = useMemo<Fila[] | null>(() => {
    if (!cerca || !ubicacion) return null;
    const osm = datos ? comerciosConNombre(aplanarComercios(datos)).map(aBuscable) : [];
    return [...portafolios, ...osm]
      .map((n) => ({ n, distancia: distanciaMetros(ubicacion, coordenadaDe(n)) }))
      .filter((f) => f.distancia <= RADIO_CERCA_M)
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, MAX_CERCA);
  }, [cerca, ubicacion, datos, portafolios]);

  // La lista de al lado: resultados de la búsqueda o lo cercano; null = constelaciones.
  const lista = useMemo<Fila[] | null>(() => {
    if (buscando)
      return encontrados.map((n) => ({ n, distancia: ubicacion ? distanciaMetros(ubicacion, coordenadaDe(n)) : null }));
    return cercanos;
  }, [buscando, encontrados, cercanos, ubicacion]);

  // El mapa se filtra con la búsqueda (aunque no haya resultados) o con lo cercano
  // si hay algo: «nada cerca» deja el mapa entero en vez de mostrarlo vacío.
  const filtroMapa = buscando ? lista : cercanos?.length ? cercanos : null;
  const portafoliosVisibles = useMemo(() => {
    if (!filtroMapa) return portafolios;
    const ids = new Set(filtroMapa.filter((f) => !esComercioOsm(f.n)).map((f) => f.n.id));
    return portafolios.filter((p) => ids.has(p.id));
  }, [filtroMapa, portafolios]);
  const resultados = useMemo<ResultadosMapa | null>(
    () => (filtroMapa ? { comercios: filtroMapa.flatMap((f) => (esComercioOsm(f.n) ? [f.n.comercio] : [])) } : null),
    [filtroMapa],
  );

  const fichaAliado = abierta ? (portafolios.find((p) => p.id === abierta) ?? null) : null;
  const fichaOsm =
    abierta && !fichaAliado && datos ? (aplanarComercios(datos).find((e) => `osm:${e.osm}` === abierta) ?? null) : null;

  function abrir(id: string) {
    setEnLista(id);
    setAbierta(id);
  }

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
    // Automático solo al montar — el reintento manual lo dispara «Qué tengo cerca».
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function alternarCerca() {
    const nuevo = !(cerca && !buscando);
    setCerca(nuevo);
    setAbierta(null);
    setEnLista(null);
    if (!nuevo) return;
    if (consulta.trim()) setConsulta('');
    if (ubicacion) return;
    if (!('geolocation' in navigator)) {
      setEstado('sin_permiso');
      return;
    }
    setEstado('pidiendo');
    solicitar();
  }

  const textoQ = q.trim();
  const viendoCerca = cerca && !buscando;
  const barrio = ubicacion ? barrioDe(ubicacion[0], ubicacion[1]) : null;

  return (
    <div>
      {/* aria-live anuncia el conteo sin leer la lista entera en cada letra. */}
      <div aria-live="polite" className={buscando || viendoCerca ? 'mb-4' : undefined}>
        {buscando && (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p className="font-sans text-sm font-medium text-tinta">
                {encontrados.length === 0
                  ? `No encontramos negocios para «${textoQ}»`
                  : `${encontrados.length} ${encontrados.length === 1 ? 'resultado' : 'resultados'} para «${textoQ}»`}
              </p>
              <button type="button" onClick={limpiar} className={CLASE_ENLACE}>
                Limpiar búsqueda
              </button>
            </div>
            {parcial && encontrados.length > 0 && (
              <p className="font-sans text-xs text-tinta/65">Ninguno tiene todo lo que escribiste. Estos se parecen.</p>
            )}
            {encontrados.length === 0 && <Sugerencias />}
          </>
        )}
        {viendoCerca && (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p className="font-sans text-sm font-medium text-tinta">
                {!ubicacion
                  ? estado === 'sin_permiso'
                    ? 'Para ver qué tienes cerca, permite tu ubicación en el navegador.'
                    : 'Buscando tu ubicación…'
                  : `${barrio ? `Estás en ${barrio}` : 'Estás fuera de la Comuna 3'} · ${
                      cercanos?.length
                        ? `${cercanos.length} ${cercanos.length === 1 ? 'negocio' : 'negocios'} a menos de ${RADIO_CERCA_M} m`
                        : `ningún negocio a menos de ${RADIO_CERCA_M} m`
                    }`}
              </p>
              <button type="button" onClick={alternarCerca} className={CLASE_ENLACE}>
                Ver todo el mapa
              </button>
            </div>
            <p className="font-sans text-xs text-tinta/65">
              Tu ubicación se usa solo en tu navegador. No se envía ni se guarda.
            </p>
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
            alSeleccionar={abrir}
            controles={
              <button type="button" aria-pressed={viendoCerca} onClick={alternarCerca} className={claseInterruptor(viendoCerca)}>
                <span aria-hidden="true">◎</span>
                Qué tengo cerca
              </button>
            }
          />
        </div>

        {fichaAliado || fichaOsm ? (
          <section aria-label="Ficha del negocio" className="min-w-0 lg:col-span-4">
            <button type="button" onClick={() => setAbierta(null)} className={CLASE_ENLACE}>
              ← {lista ? 'Volver a la lista' : 'Volver a las constelaciones'}
            </button>
            <div className="mt-1 lg:max-h-[34rem] lg:overflow-y-auto">
              {fichaAliado ? (
                <TarjetaEmprendimiento
                  portafolio={fichaAliado}
                  indice={0}
                  definicionesCampos={definicionesCampos}
                  distancia={ubicacion ? distanciaMetros(ubicacion, [fichaAliado.latitud, fichaAliado.longitud]) : null}
                  datosOsm={datos}
                  angosta
                />
              ) : (
                fichaOsm && (
                  <div className="border-t border-tinta/12 py-5">
                    <FichaComercioOsm
                      comercio={fichaOsm}
                      distancia={ubicacion ? distanciaMetros(ubicacion, [fichaOsm.lat, fichaOsm.lon]) : null}
                      como="h3"
                      conAclaracion
                    />
                  </div>
                )
              )}
            </div>
          </section>
        ) : lista ? (
          lista.length > 0 && (
            <section aria-labelledby="titulo-lista-resultados" className="min-w-0 lg:col-span-4">
              <h2 id="titulo-lista-resultados" className="font-sans text-sm font-medium text-tinta">
                Toca uno para ver su ficha
              </h2>
              <ul className="mt-2 max-h-[34rem] divide-y divide-tinta/10 overflow-y-auto border-y border-tinta/10">
                {lista.map(({ n, distancia }) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => abrir(n.id)}
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
                        {distancia !== null ? ` · ${formatearDistancia(distancia)}` : ''}
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
              {constelaciones.map((c) => {
                const activa = c.id === elegida;
                // La fila entera es el botón (antes solo el código): lo que se lee es el nombre.
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      aria-pressed={activa}
                      onClick={() => elegir(c.id)}
                      className={`group flex min-h-[44px] w-full items-center gap-3 py-1.5 pr-1 text-left transition-colors ${
                        activa ? 'bg-tinta/[0.06]' : 'hover:bg-tinta/[0.03]'
                      }`}
                    >
                      <span
                        className={`inline-flex min-h-[40px] min-w-[52px] shrink-0 items-center justify-center border px-2 font-sans text-sm font-medium transition-colors ${claseChipConstelacion(activa)}`}
                      >
                        {c.codigo}
                      </span>
                      <span className="min-w-0 break-words font-sans text-sm leading-snug text-tinta group-hover:text-azul-texto">
                        {c.nombre}
                        <span className="block text-xs tabular-nums text-tinta/65">{c.tamano} comercios</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
