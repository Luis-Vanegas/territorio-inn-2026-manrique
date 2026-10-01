'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';

import { MapaAliados } from '@/components/MapaAliados';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import type { DefinicionCampo } from '@/lib/db/camposPersonalizados.repo';
import type { Coordenada } from '@/lib/geo/constantes';
import { distanciaMetros } from '@/lib/geo/distancia';
import { contar } from '@/lib/interacciones';
import { buscarNegocios } from '@/lib/busqueda';
import { TarjetaEmprendimiento } from './TarjetaEmprendimiento';

/**
 * Mapa + listado con estado compartido.
 *
 * Existe porque son dos vistas del mismo dato y tenían que hablarse: tocar un
 * punto del mapa no hacía nada en la lista, y la lista no sabía dónde estaba
 * parado quien la miraba. Ese diálogo es estado de cliente, así que vive acá y
 * no en la página (que sigue siendo Server Component y hace las consultas).
 *
 * La ubicación NO se pide al montar. Un permiso que salta solo se deniega por
 * reflejo, y Chrome castiga al sitio que lo pide sin gesto del usuario. Se pide
 * cuando la persona toca el botón, que además explica para qué es.
 */

type EstadoGeo = 'inicial' | 'pidiendo' | 'listo' | 'denegado' | 'error';

const MENSAJE_GEO: Record<Exclude<EstadoGeo, 'inicial' | 'listo'>, string> = {
  pidiendo: 'Buscando dónde estás…',
  denegado:
    'No diste permiso de ubicación. Puedes activarlo desde el candado de la barra de direcciones.',
  error: 'No pudimos ubicarte. Prueba de nuevo o revisa el GPS del dispositivo.',
};

// El listado se pinta por tandas: con cientos de negocios, una tarjeta por
// cada uno hacía la página pesada de renderizar. El mapa y la búsqueda siguen
// trabajando sobre TODOS (están en memoria), así que nada queda inalcanzable.
// ponytail: el payload sigue llevando todas las fichas; si pasa de unos
// cientos, la paginación pasa al servidor (?pagina=) y el mapa pide solo puntos.
const POR_TANDA = 24;

export function VitrinaAliados({
  aliados,
  definicionesCampos,
  filtro,
  busquedaInicial = '',
}: {
  aliados: Portafolio[];
  definicionesCampos: DefinicionCampo[];
  filtro: ReactNode;
  busquedaInicial?: string;
}) {
  const [ubicacion, setUbicacion] = useState<Coordenada | null>(null);
  const [estadoGeo, setEstadoGeo] = useState<EstadoGeo>('inicial');
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [visibles, setVisibles] = useState(POR_TANDA);

  const pedirUbicacion = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setEstadoGeo('error');
      return;
    }

    setEstadoGeo('pidiendo');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacion([pos.coords.latitude, pos.coords.longitude]);
        setEstadoGeo('listo');
      },
      (err) => {
        setEstadoGeo(err.code === err.PERMISSION_DENIED ? 'denegado' : 'error');
      },
      // 10 s alcanza para un fix de GPS en celular; más que eso, la persona ya
      // se cansó. maximumAge acepta una posición reciente en vez de encender la
      // antena de nuevo si acaba de ubicarse.
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  /**
   * Con ubicación, el orden es por cercanía: el propósito del módulo es que
   * alguien descubra lo que tiene a la vuelta, y "a la vuelta" es un orden, no
   * un filtro — cortar por radio escondería el único negocio del barrio si
   * queda a 1,2 km.
   *
   * La búsqueda de texto filtra acá mismo, en el cliente: `aliados` ya está
   * completo en memoria (la categoría, que sí necesita su propia consulta
   * para los conteos, filtra del lado del servidor vía `?categoria=`) y a
   * escala de barrio no hay volumen que justifique un roundtrip nuevo por
   * cada letra que alguien escribe.
   *
   * Sin ubicación, el orden es el de relevancia de la búsqueda (lib/busqueda.ts,
   * el mismo algoritmo del buscador de la portada).
   */
  const { resultados: filtrados, parcial } = useMemo(
    () => buscarNegocios(aliados, busqueda),
    [aliados, busqueda],
  );

  const listados = useMemo(() => {
    const conDistancia = filtrados.map((p) => ({
      portafolio: p,
      distancia: ubicacion ? distanciaMetros(ubicacion, [p.latitud, p.longitud]) : null,
    }));

    if (!ubicacion) return conDistancia;
    return conDistancia.sort((a, b) => (a.distancia ?? 0) - (b.distancia ?? 0));
  }, [filtrados, ubicacion]);

  const portafoliosFiltrados = useMemo(() => listados.map((l) => l.portafolio), [listados]);

  // Abrir la ficha de un negocio cuenta como vista. Scrollear el listado NO:
  // si contáramos cada tarjeta que pasa por pantalla, el número mediría el
  // scroll de la página y no el interés en un negocio.
  const alSeleccionar = useCallback(
    (id: string) => {
      setSeleccionado(id);
      contar(id, 'vista');

      // Un punto del mapa puede ser de una tarjeta que aún no se pintó: se
      // abre la tanda hasta ella, y flushSync la deja en el DOM antes de
      // buscarla para hacer scroll.
      const posicion = listados.findIndex((l) => l.portafolio.id === id);
      if (posicion >= visibles) flushSync(() => setVisibles(posicion + 1));

      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [listados, visibles],
  );

  const cercanos = ubicacion
    ? listados.filter((l) => (l.distancia ?? Infinity) < 1000).length
    : 0;

  return (
    <>
      <section className="mt-14" aria-label="Mapa de negocios aliados">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-sans text-xs uppercase tracking-wider text-tinta/65">
            Dónde están
          </h2>
          <span className="font-sans text-xs text-tinta/60">
            {busqueda.trim()
              ? `${listados.length} de ${aliados.length} ${aliados.length === 1 ? 'negocio' : 'negocios'}`
              : `${aliados.length} ${aliados.length === 1 ? 'negocio' : 'negocios'} en el mapa`}
          </span>
        </div>

        <label className="mt-4 block max-w-sm">
          <span className="sr-only">Buscar por nombre, categoría o descripción</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setVisibles(POR_TANDA);
            }}
            placeholder="Busca por nombre, rubro o qué necesitas…"
            className="w-full border-0 border-b border-tinta/20 bg-transparent px-0 py-2 font-sans text-[15px] text-tinta placeholder:text-tinta/35 focus:border-azul focus:outline-none focus:ring-0"
          />
        </label>

        {/* Antes de pedir permiso hay que decir qué se hace con el dato.
            No es cortesía: es lo que hace que la persona diga que sí. */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={pedirUbicacion}
            disabled={estadoGeo === 'pidiendo'}
            className="group inline-flex items-center gap-2 border border-azul-texto px-4 py-2 font-sans text-xs text-azul-texto transition-all duration-200 hover:bg-azul-texto hover:text-hueso active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"
          >
            <span
              aria-hidden="true"
              className={
                estadoGeo === 'pidiendo'
                  ? 'inline-block animate-pulse'
                  : 'inline-block transition-transform duration-200 group-hover:scale-110'
              }
            >
              ◎
            </span>
            {ubicacion ? 'Actualizar mi ubicación' : 'Ver los que tengo cerca'}
          </button>

          {estadoGeo === 'listo' && (
            <span className="font-sans text-xs text-tinta/65">
              {cercanos > 0
                ? `${cercanos} ${cercanos === 1 ? 'negocio' : 'negocios'} a menos de 1 km · lista ordenada por cercanía`
                : 'Ninguno a menos de 1 km — la lista igual va del más cercano al más lejano'}
            </span>
          )}

          {estadoGeo !== 'inicial' && estadoGeo !== 'listo' && (
            <span
              role="status"
              className="font-sans text-xs text-tinta/65"
            >
              {MENSAJE_GEO[estadoGeo]}
            </span>
          )}

          {estadoGeo === 'inicial' && (
            <span className="font-sans text-xs text-tinta/60">
              Tu ubicación se usa solo en tu navegador. No se envía ni se guarda.
            </span>
          )}
        </div>

        <div className="mt-4">
          <MapaAliados
            portafolios={portafoliosFiltrados}
            alSeleccionar={alSeleccionar}
            ubicacionUsuario={ubicacion}
            seleccionado={seleccionado}
            variante="vitrina"
            conFiltro
            hrefLista="#listado"
          />
        </div>

        <p className="mt-3 font-sans text-xs text-tinta/60">
          Toca un marcador para ver el negocio en la lista.
        </p>
      </section>

      <section id="listado" className="mt-20 scroll-mt-24" aria-label="Listado de negocios aliados">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-sans text-xs uppercase tracking-wider text-tinta/65">
            {ubicacion ? 'Quiénes son — de lo más cerca a lo más lejos' : 'Quiénes son'}
          </h2>
        </div>

        <div className="mt-5">{filtro}</div>

        {busqueda.trim() && listados.length === 0 && (
          <p className="mt-10 border-t border-tinta/12 pt-8 font-sans text-tinta/60">
            Nada coincide con «{busqueda.trim()}».{' '}
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="underline decoration-azul underline-offset-4 hover:text-azul-texto"
            >
              Borrar la búsqueda
            </button>
            .
          </p>
        )}

        {parcial && listados.length > 0 && (
          <p className="mt-10 border-t border-tinta/12 pt-8 font-sans text-sm text-tinta/65">
            Ningún negocio tiene todo lo que escribiste. Estos se parecen.
          </p>
        )}

        <div className="mt-10">
          {listados.slice(0, visibles).map((l, i) => (
            <TarjetaEmprendimiento
              key={l.portafolio.id}
              portafolio={l.portafolio}
              indice={i}
              definicionesCampos={definicionesCampos}
              distancia={l.distancia}
              activo={l.portafolio.id === seleccionado}
            />
          ))}
        </div>

        {listados.length > visibles && (
          <button
            type="button"
            onClick={() => setVisibles((v) => v + POR_TANDA)}
            className="mt-10 border border-azul-texto px-6 py-3 font-sans text-sm text-azul-texto transition-colors hover:bg-azul-texto hover:text-hueso"
          >
            Ver más negocios ({listados.length - visibles} más)
          </button>
        )}
      </section>
    </>
  );
}
