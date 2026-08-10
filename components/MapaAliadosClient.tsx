'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { GeoJsonObject } from 'geojson';
import 'leaflet/dist/leaflet.css';

import {
  POLIGONO_MANRIQUE,
  CENTRO_MANRIQUE,
  LIMITES_MAPA,
  ZOOM,
} from '@/lib/geo/constantes';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import { enlaceWhatsapp } from '@/lib/contacto';

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

type Props = {
  portafolios: Portafolio[];
  alSeleccionar?: (id: string) => void;
};

export default function MapaAliadosClient({ portafolios, alSeleccionar }: Props) {
  // El polígono no cambia nunca; sin memo, react-leaflet vuelve a montar la
  // capa GeoJSON en cada render y el mapa parpadea al filtrar por categoría.
  const capaLimite = useMemo(
    () => POLIGONO_MANRIQUE as unknown as GeoJsonObject,
    [],
  );

  return (
    <MapContainer
      center={[CENTRO_MANRIQUE[0], CENTRO_MANRIQUE[1]]}
      zoom={ZOOM.inicial}
      minZoom={ZOOM.minimo}
      maxZoom={ZOOM.maximo}
      maxBounds={[
        [LIMITES_MAPA[0][0], LIMITES_MAPA[0][1]],
        [LIMITES_MAPA[1][0], LIMITES_MAPA[1][1]],
      ]}
      maxBoundsViscosity={0.8}
      scrollWheelZoom={false} // si no, la rueda secuestra el scroll de la página
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &middot; &copy; <a href="https://carto.com/attributions">CARTO</a>'
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

      {portafolios.map((p) => (
        <Marker
          key={p.id}
          position={[p.latitud, p.longitud]}
          icon={iconoPunto}
          title={p.nombre}
          eventHandlers={
            alSeleccionar ? { click: () => alSeleccionar(p.id) } : undefined
          }
        >
          <Popup minWidth={200}>
            <span className="block font-mono text-[10px] uppercase tracking-wide text-terracota">
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
                className="mt-2 inline-block font-mono text-xs text-terracota underline decoration-terracota/40 underline-offset-4 hover:text-tinta"
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
