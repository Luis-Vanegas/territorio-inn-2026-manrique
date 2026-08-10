'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Circle,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';
import type { GeoJsonObject } from 'geojson';
import 'leaflet/dist/leaflet.css';

import { POLIGONO_MANRIQUE, CENTRO_MANRIQUE, ZOOM } from '@/lib/geo/constantes';

/**
 * Selector de ubicación: el corazón del registro.
 *
 * Tres formas de marcar el punto, en orden de menor esfuerzo:
 *   1. "Usar mi ubicación" — GPS del dispositivo, un toque
 *   2. tocar el mapa
 *   3. arrastrar el punto ya puesto para afinar
 *
 * Sin límite geográfico a propósito: mientras se junta volumen de datos de
 * prueba, cualquier punto del mundo es válido. El polígono de Manrique queda
 * como referencia visual — ya no bloquea el registro. La franja de Manrique
 * se centra por defecto porque sigue siendo el foco real del proyecto.
 */

const iconoSeleccion = L.divIcon({
  className: '',
  html: `<span class="marcador-portafolio marcador-seleccion"></span>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export type Posicion = { lat: number; lng: number; precision?: number };

type EstadoGeo =
  | { fase: 'inactivo' }
  | { fase: 'buscando' }
  | { fase: 'error'; mensaje: string };

function CapturarClicks({ alElegir }: { alElegir: (p: Posicion) => void }) {
  useMapEvents({
    click: (e) => alElegir({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

/** Expone la instancia del mapa al componente padre para poder centrarlo. */
function CapturarMapa({ alMontar }: { alMontar: (m: LeafletMap) => void }) {
  const mapa = useMap();
  alMontar(mapa);
  return null;
}

export default function SelectorUbicacionClient({
  valorInicial,
  alCambiar,
}: {
  valorInicial: Posicion | null;
  alCambiar: (p: Posicion | null, valida: boolean) => void;
}) {
  const [posicion, setPosicion] = useState<Posicion | null>(valorInicial);
  const [geo, setGeo] = useState<EstadoGeo>({ fase: 'inactivo' });
  const mapaRef = useRef<LeafletMap | null>(null);

  const capaLimite = useMemo(() => POLIGONO_MANRIQUE as unknown as GeoJsonObject, []);

  const elegir = useCallback(
    (p: Posicion, centrar = false) => {
      setPosicion(p);
      alCambiar(p, true);

      if (centrar && mapaRef.current) {
        mapaRef.current.flyTo([p.lat, p.lng], ZOOM.maximo - 1, { duration: 1 });
      }
    },
    [alCambiar],
  );

  const usarMiUbicacion = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeo({
        fase: 'error',
        mensaje: 'Tu navegador no permite compartir la ubicación. Marcá el punto en el mapa.',
      });
      return;
    }

    setGeo({ fase: 'buscando' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: Posicion = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          precision: pos.coords.accuracy,
        };

        setGeo({ fase: 'inactivo' });
        elegir(p, true);
      },
      (error) => {
        const mensajes: Record<number, string> = {
          1: 'No nos diste permiso para ver tu ubicación. Podés marcarla en el mapa.',
          2: 'No pudimos determinar tu ubicación. Marcala en el mapa.',
          3: 'La búsqueda tardó demasiado. Marcá el punto en el mapa.',
        };
        setGeo({
          fase: 'error',
          mensaje: mensajes[error.code] ?? 'No pudimos obtener tu ubicación.',
        });
      },
      {
        enableHighAccuracy: true, // GPS en vez de red: en una cuadra la diferencia importa
        timeout: 12_000,
        maximumAge: 0,            // sin posiciones viejas: puede haberse movido
      },
    );
  }, [elegir]);

  const buscando = geo.fase === 'buscando';

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={usarMiUbicacion}
          disabled={buscando}
          className="inline-flex items-center gap-2 border border-terracota bg-terracota px-4 py-2.5 font-mono text-xs text-hueso transition-colors hover:bg-transparent hover:text-terracota disabled:cursor-wait disabled:opacity-60"
        >
          <span aria-hidden="true">◎</span>
          {buscando ? 'Buscando tu ubicación…' : 'Usar mi ubicación actual'}
        </button>

        <span className="font-mono text-xs text-tinta/40">
          o tocá el mapa donde queda tu negocio
        </span>
      </div>

      {geo.fase === 'error' && (
        <p role="alert" className="mt-3 font-mono text-xs leading-relaxed text-terracota">
          {geo.mensaje}
        </p>
      )}

      <div className="mt-4 h-[380px] w-full border border-tinta/15 sm:h-[520px]">
        <MapContainer
          center={[CENTRO_MANRIQUE[0], CENTRO_MANRIQUE[1]]}
          zoom={ZOOM.seleccion}
          minZoom={ZOOM.minimo}
          maxZoom={ZOOM.maximo}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <CapturarMapa alMontar={(m) => (mapaRef.current = m)} />

          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &middot; &copy; <a href="https://carto.com/attributions">CARTO</a>'
            maxZoom={ZOOM.maximo}
          />

          <GeoJSON
            data={capaLimite}
            style={{
              color: '#1a1a1a',
              weight: 1.5,
              opacity: 0.6,
              fillColor: '#c55a3c',
              fillOpacity: 0.05,
            }}
          />

          <CapturarClicks alElegir={(p) => elegir(p)} />

          {posicion && (
            <>
              {/* Círculo de precisión del GPS: comunica "estoy en algún punto de
                  esta área", que es la verdad. Un pin solo sugiere exactitud
                  que el dispositivo no tiene. */}
              {posicion.precision && posicion.precision > 25 && (
                <Circle
                  center={[posicion.lat, posicion.lng]}
                  radius={posicion.precision}
                  pathOptions={{
                    color: '#c55a3c',
                    weight: 1,
                    opacity: 0.5,
                    fillOpacity: 0.06,
                  }}
                />
              )}

              <Marker
                position={[posicion.lat, posicion.lng]}
                icon={iconoSeleccion}
                draggable
                autoPan
                eventHandlers={{
                  dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    // Al arrastrar a mano se descarta la precisión del GPS:
                    // ahora el punto vale lo que la persona decidió.
                    elegir({ lat, lng });
                  },
                }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* La ubicación es el dato que distingue esta vitrina de cualquier
          directorio de texto: se le da un bloque propio, grande y con acento,
          no un renglón gris que se confunde con las instrucciones. */}
      <div
        role="status"
        aria-live="polite"
        className={[
          'mt-4 border-l-2 px-4 py-3 transition-colors',
          !posicion ? 'border-tinta/15 bg-tinta/[0.02]' : 'border-terracota bg-terracota/[0.04]',
        ].join(' ')}
      >
        {!posicion ? (
          <p className="font-mono text-xs text-tinta/50">
            Todavía no marcaste el punto.
          </p>
        ) : (
          <>
            <p className="flex items-center gap-2 font-mono text-sm text-tinta">
              <span aria-hidden="true">📍</span>
              {posicion.lat.toFixed(6)}, {posicion.lng.toFixed(6)}
            </p>
            <p className="mt-1 font-mono text-xs text-tinta/45">
              {posicion.precision && posicion.precision > 25
                ? `precisión ±${Math.round(posicion.precision)} m — `
                : ''}
              arrastrá el punto para afinarlo
            </p>
          </>
        )}
      </div>
    </div>
  );
}
