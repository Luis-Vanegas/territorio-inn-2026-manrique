'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { MapaAliados } from '@/components/MapaAliados';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import type { DefinicionCampo } from '@/lib/db/camposPersonalizados.repo';
import type { Coordenada } from '@/lib/geo/constantes';
import { distanciaMetros } from '@/lib/geo/distancia';
import { contar } from '@/lib/interacciones';
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
    'No diste permiso de ubicación. Podés activarlo desde el candado de la barra de direcciones.',
  error: 'No pudimos ubicarte. Probá de nuevo o revisá el GPS del dispositivo.',
};

export function VitrinaAliados({
  aliados,
  definicionesCampos,
  filtro,
}: {
  aliados: Portafolio[];
  definicionesCampos: DefinicionCampo[];
  filtro: ReactNode;
}) {
  const [ubicacion, setUbicacion] = useState<Coordenada | null>(null);
  const [estadoGeo, setEstadoGeo] = useState<EstadoGeo>('inicial');
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

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
   */
  const listados = useMemo(() => {
    const conDistancia = aliados.map((p) => ({
      portafolio: p,
      distancia: ubicacion ? distanciaMetros(ubicacion, [p.latitud, p.longitud]) : null,
    }));

    if (!ubicacion) return conDistancia;
    return conDistancia.sort((a, b) => (a.distancia ?? 0) - (b.distancia ?? 0));
  }, [aliados, ubicacion]);

  // Abrir la ficha de un negocio cuenta como vista. Scrollear el listado NO:
  // si contáramos cada tarjeta que pasa por pantalla, el número mediría el
  // scroll de la página y no el interés en un negocio.
  const alSeleccionar = useCallback((id: string) => {
    setSeleccionado(id);
    contar(id, 'vista');
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const cercanos = ubicacion
    ? listados.filter((l) => (l.distancia ?? Infinity) < 1000).length
    : 0;

  return (
    <>
      <section className="mt-14" aria-label="Mapa de negocios aliados">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
            Dónde están
          </h2>
          <span className="font-mono text-xs text-tinta/40">
            {aliados.length} {aliados.length === 1 ? 'negocio' : 'negocios'} en el mapa
          </span>
        </div>

        {/* Antes de pedir permiso hay que decir qué se hace con el dato.
            No es cortesía: es lo que hace que la persona diga que sí. */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={pedirUbicacion}
            disabled={estadoGeo === 'pidiendo'}
            className="group inline-flex items-center gap-2 border border-terracota px-4 py-2 font-mono text-xs text-terracota transition-all duration-200 hover:bg-terracota hover:text-hueso active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"
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
            <span className="font-mono text-xs text-tinta/55">
              {cercanos > 0
                ? `${cercanos} ${cercanos === 1 ? 'negocio' : 'negocios'} a menos de 1 km · lista ordenada por cercanía`
                : 'Ninguno a menos de 1 km — la lista igual va del más cercano al más lejano'}
            </span>
          )}

          {estadoGeo !== 'inicial' && estadoGeo !== 'listo' && (
            <span
              role="status"
              className="font-mono text-xs text-tinta/55"
            >
              {MENSAJE_GEO[estadoGeo]}
            </span>
          )}

          {estadoGeo === 'inicial' && (
            <span className="font-mono text-xs text-tinta/40">
              Tu ubicación se usa solo en tu navegador. No se envía ni se guarda.
            </span>
          )}
        </div>

        <div className="mt-4 h-[460px] w-full overflow-hidden border border-tinta/12 sm:h-[600px] lg:h-[680px]">
          <MapaAliados
            portafolios={aliados}
            alSeleccionar={alSeleccionar}
            ubicacionUsuario={ubicacion}
            seleccionado={seleccionado}
          />
        </div>

        <p className="mt-3 font-mono text-xs text-tinta/40">
          Tocá un punto terracota para ver el negocio en la lista.
        </p>
      </section>

      <section className="mt-20" aria-label="Listado de negocios aliados">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
            {ubicacion ? 'Quiénes son — de lo más cerca a lo más lejos' : 'Quiénes son'}
          </h2>
        </div>

        <div className="mt-5">{filtro}</div>

        <div className="mt-10">
          {listados.map((l, i) => (
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
      </section>
    </>
  );
}
