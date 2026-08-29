'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { GeoJsonObject } from 'geojson';
import 'leaflet/dist/leaflet.css';

import { POLIGONO_MANRIQUE, CENTRO_MANRIQUE, TESELAS, ZOOM } from '@/lib/geo/constantes';
import type { Coordenada } from '@/lib/geo/constantes';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import { enlaceWhatsapp } from '@/lib/contacto';
import { contar } from '@/lib/interacciones';

/**
 * Mapa de la vitrina.
 *
 * Los marcadores son divIcon y no <Marker> por defecto por dos razones:
 * la estética (un punto terracota, el único acento del sistema, en vez del pin
 * azul de Leaflet) y porque los íconos default de Leaflet se rompen con
 * bundlers — resuelven sus PNG por ruta relativa y en Next terminan en 404.
 */

const iconoPunto = L.divIcon({
  className: '', // Leaflet mete estilos propios si esto queda vacío por defecto
  html: `<span class="marcador-portafolio"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -9],
});

const iconoPuntoActivo = L.divIcon({
  className: '',
  html: `<span class="marcador-portafolio marcador-activo"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -9],
});

const iconoUsuario = L.divIcon({
  className: '',
  html: `<span class="marcador-usuario"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -11],
});

type Props = {
  portafolios: Portafolio[];
  alSeleccionar?: (id: string) => void;
  /** Posición del visitante, si dio permiso. Dibuja su punto y entra al encuadre. */
  ubicacionUsuario?: Coordenada | null;
  /** Id del negocio resaltado desde el listado: el mapa vuela hacia él. */
  seleccionado?: string | null;
};

/**
 * Encuadre automático.
 *
 * Desde la migración 006 un negocio puede estar en cualquier parte del mundo,
 * así que centrar fijo en Manrique con zoom 14 dejaba marcadores fuera de
 * pantalla sin ninguna señal de que existían. El encuadre se recalcula cuando
 * cambian los puntos (filtro por categoría) o aparece la ubicación del visitante.
 */
function AjustarVista({
  puntos,
  ubicacionUsuario,
}: {
  puntos: Coordenada[];
  ubicacionUsuario?: Coordenada | null;
}) {
  const mapa = useMap();

  // La clave serializa las coordenadas: el array se recrea en cada render del
  // padre y un dep por referencia dispararía un fitBounds por render.
  const clave = JSON.stringify([puntos, ubicacionUsuario]);

  useEffect(() => {
    const todos = ubicacionUsuario ? [...puntos, ubicacionUsuario] : puntos;
    if (todos.length === 0) return;

    mapa.fitBounds(L.latLngBounds(todos.map((p) => L.latLng(p[0], p[1]))), {
      padding: [48, 48],
      // Con un solo punto fitBounds se va al zoom máximo y se ve el techo de
      // una casa sin contexto de barrio.
      maxZoom: ZOOM.seleccion,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, mapa]);

  return null;
}

/** Vuela al negocio que se tocó en el listado. */
function IrASeleccionado({
  seleccionado,
  portafolios,
}: {
  seleccionado?: string | null;
  portafolios: Portafolio[];
}) {
  const mapa = useMap();

  useEffect(() => {
    if (!seleccionado) return;
    const p = portafolios.find((x) => x.id === seleccionado);
    if (!p) return;

    mapa.flyTo([p.latitud, p.longitud], Math.max(mapa.getZoom(), ZOOM.seleccion), {
      duration: 0.7,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionado, mapa]);

  return null;
}

export default function MapaAliadosClient({
  portafolios,
  alSeleccionar,
  ubicacionUsuario,
  seleccionado,
}: Props) {
  // El polígono no cambia nunca; sin memo, react-leaflet vuelve a montar la
  // capa GeoJSON en cada render y el mapa parpadea al filtrar por categoría.
  const capaLimite = useMemo(
    () => POLIGONO_MANRIQUE as unknown as GeoJsonObject,
    [],
  );

  const puntos = useMemo<Coordenada[]>(
    () => portafolios.map((p) => [p.latitud, p.longitud] as Coordenada),
    [portafolios],
  );

  return (
    <MapContainer
      center={[CENTRO_MANRIQUE[0], CENTRO_MANRIQUE[1]]}
      zoom={ZOOM.inicial}
      minZoom={ZOOM.minimo}
      maxZoom={ZOOM.maximo}
      scrollWheelZoom={false} // si no, la rueda secuestra el scroll de la página
      className="h-full w-full"
    >
      <TileLayer
        url={TESELAS.url}
        attribution={TESELAS.atribucion}
        maxZoom={ZOOM.maximo}
      />

      <GeoJSON
        data={capaLimite}
        style={{
          color: '#1a1a1a',
          weight: 1.25,
          opacity: 0.55,
          fillColor: '#c55a3c',
          fillOpacity: 0.04,
        }}
      />

      <AjustarVista puntos={puntos} ubicacionUsuario={ubicacionUsuario} />
      <IrASeleccionado seleccionado={seleccionado} portafolios={portafolios} />

      {ubicacionUsuario && (
        <Marker
          position={[ubicacionUsuario[0], ubicacionUsuario[1]]}
          icon={iconoUsuario}
          title="Tu ubicación aproximada"
        >
          <Popup minWidth={160}>
            <strong className="block font-display text-sm font-medium text-tinta">
              Estás por acá
            </strong>
            <span className="mt-1 block font-mono text-[11px] text-tinta/55">
              Posición aproximada de tu dispositivo. No se guarda en ningún lado.
            </span>
          </Popup>
        </Marker>
      )}

      {portafolios.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitud, p.longitud]}
          icon={p.id === seleccionado ? iconoPuntoActivo : iconoPunto}
          title={p.nombre}
          eventHandlers={
            alSeleccionar ? { click: () => alSeleccionar(p.id) } : undefined
          }
        >
          <Popup minWidth={200}>
            <span className="block font-mono text-[10px] uppercase tracking-wide text-terracota-texto">
              {p.categoria_nombre}
            </span>
            <strong className="mt-1 block font-display text-base font-medium text-tinta">
              {p.nombre}
            </strong>

            {/* La ubicación "canta" acá también: ícono + mono, no un dato
                perdido entre el resto del popup. */}
            <span className="mt-1.5 flex items-start gap-1 font-mono text-xs text-tinta/65">
              <span aria-hidden="true">📍</span>
              <span>
                {p.direccion}
                <span className="text-tinta/35"> · {p.barrio}</span>
              </span>
            </span>

            {p.whatsapp && (
              <a
                href={enlaceWhatsapp(p.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => contar(p.id, 'contacto')}
                className="mt-2 inline-block font-mono text-xs text-terracota-texto underline decoration-terracota/40 underline-offset-4 hover:text-tinta"
              >
                Escribir por WhatsApp →
              </a>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
