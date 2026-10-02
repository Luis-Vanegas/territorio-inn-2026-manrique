'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { GeoJsonObject } from 'geojson';
import 'leaflet/dist/leaflet.css';

import { POLIGONO_MANRIQUE, CENTRO_MANRIQUE, TESELAS, ZOOM } from '@/lib/geo/constantes';
import type { Coordenada } from '@/lib/geo/constantes';
import type { DatosConstelaciones } from '@/lib/geo/constelaciones';
import { grupoDeCategoria, type Grupo } from '@/lib/categorias/grupos';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import { enlaceWhatsapp } from '@/lib/contacto';
import { contar } from '@/lib/interacciones';
import { CapaConstelaciones } from './mapa/CapaConstelaciones';
import { svgForma } from './mapa/formas';
import { useTemaOscuro } from './mapa/useTemaOscuro';

/**
 * Mapa de la vitrina.
 *
 * Los marcadores son divIcon y no <Marker> por defecto por dos razones:
 * la estética (una forma y un color por grupo, en vez del pin azul de Leaflet)
 * y porque los íconos default de Leaflet se rompen con bundlers — resuelven sus
 * PNG por ruta relativa y en Next terminan en 404.
 *
 * Cada grupo de categoría tiene su forma además de su color (DESIGN.md ›
 * Categorías): el color solo no basta con daltonismo. La caja del marcador mide
 * 44 px (objetivo táctil) aunque la forma dibujada mida 26.
 *
 * ponytail: sin cluster de marcadores. Hoy son ~8 aliados. Pasada la centena
 * (plan de diseño §3 › Mapa) hay que agrupar, p. ej. con leaflet.markercluster;
 * es una dependencia nueva, se consulta antes de instalarla.
 */

const iconosGrupo = new Map<string, L.DivIcon>();

function iconoGrupo(grupo: Grupo, activo: boolean) {
  const clave = `${grupo.id}:${activo}`;
  let icono = iconosGrupo.get(clave);
  if (!icono) {
    icono = L.divIcon({
      className: '', // Leaflet mete estilos propios si esto queda vacío por defecto
      html: `<span class="marcador-grupo${activo ? ' marcador-grupo--activo' : ''}">${svgForma(grupo, 26)}</span>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -16],
    });
    iconosGrupo.set(clave, icono);
  }
  return icono;
}

const iconoUsuario = L.divIcon({
  className: '',
  html: `<span class="marcador-usuario"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -11],
});

/** La comuna y su margen de paneo: se calculan una vez, el polígono no cambia. */
const LIMITES_COMUNA = L.geoJSON(POLIGONO_MANRIQUE as unknown as GeoJsonObject).getBounds();
const LIMITES_PANEO = LIMITES_COMUNA.pad(0.35);

/** Contorno de la comuna como [lat, lng] (el GeoJSON guarda [lng, lat]): es el hueco de la máscara. */
const CONTORNO_COMUNA: [number, number][] = (
  POLIGONO_MANRIQUE.features[0]!.geometry as unknown as { coordinates: number[][][] }
).coordinates[0]!.map((p) => [p[1] as number, p[0] as number]);

/** Rectángulo grande con la comuna recortada: lo de afuera queda velado, suave. */
const MASCARA: [number, number][][] = (() => {
  const g = LIMITES_PANEO.pad(2);
  return [
    [
      [g.getSouth(), g.getWest()],
      [g.getSouth(), g.getEast()],
      [g.getNorth(), g.getEast()],
      [g.getNorth(), g.getWest()],
    ],
    CONTORNO_COMUNA,
  ];
})();

type Props = {
  portafolios: Portafolio[];
  alSeleccionar?: (id: string) => void;
  /** Posición del visitante, si dio permiso. Dibuja su punto, pero no mueve el encuadre. */
  ubicacionUsuario?: Coordenada | null;
  /** Id del negocio resaltado desde el listado: el mapa vuela hacia él. */
  seleccionado?: string | null;
  /** Datos ya cargados: si es null la capa de constelaciones no se dibuja. */
  constelaciones?: DatosConstelaciones | null;
  /** Id de una constelación para verla sola y acercarse a ella; '' = todas. */
  filtroConstelacion?: string;
};

/**
 * Encuadre en la comuna (D2 del plan de diseño).
 *
 * Antes el mapa se ajustaba a TODOS los puntos, y como un aliado puede estar en
 * cualquier parte del mundo (migración 006) la vista terminaba sobre media
 * Medellín con la comuna en un borde. Ahora se encuadra el polígono y el paneo
 * queda acotado a su margen: el zoom mínimo es el que deja ver ese margen justo,
 * así no se puede alejar hasta perder el territorio. Los aliados que caigan
 * fuera siguen en la lista, solo que el mapa no los muestra.
 *
 * Con `foco` (una constelación elegida en el filtro) se acerca a ella; al
 * quitarlo vuelve a la comuna.
 */
function Encuadre({ foco }: { foco: L.LatLngBounds | null }) {
  const mapa = useMap();

  useEffect(() => {
    const fijarMinimo = () =>
      mapa.setMinZoom(Math.max(ZOOM.minimo, mapa.getBoundsZoom(LIMITES_PANEO)));
    fijarMinimo();
    mapa.on('resize', fijarMinimo);
    return () => {
      mapa.off('resize', fijarMinimo);
    };
  }, [mapa]);

  useEffect(() => {
    mapa.fitBounds(foco ?? LIMITES_COMUNA, { padding: [16, 16], maxZoom: ZOOM.seleccion });
  }, [mapa, foco]);

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

    const destino: L.LatLngExpression = [p.latitud, p.longitud];
    const zoom = Math.max(mapa.getZoom(), ZOOM.seleccion);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      mapa.setView(destino, zoom, { animate: false });
    } else {
      mapa.flyTo(destino, zoom, { duration: 0.7 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionado, mapa]);

  return null;
}

export default function MapaAliadosClient({
  portafolios,
  alSeleccionar,
  ubicacionUsuario,
  seleccionado,
  constelaciones,
  filtroConstelacion = '',
}: Props) {
  // El polígono no cambia nunca; sin memo, react-leaflet vuelve a montar la
  // capa GeoJSON en cada render y el mapa parpadea al filtrar por categoría.
  const capaLimite = useMemo(
    () => POLIGONO_MANRIQUE as unknown as GeoJsonObject,
    [],
  );

  const foco = useMemo(() => {
    const c = constelaciones?.constelaciones.find((x) => x.id === filtroConstelacion);
    if (!c) return null;
    return L.latLngBounds(c.estrellas.map((e) => L.latLng(e.lat, e.lon))).pad(0.5);
  }, [constelaciones, filtroConstelacion]);

  // Con "menos movimiento" se apagan también las animaciones de zoom y de
  // desplazamiento de Leaflet (el CSS global solo alcanza a las de CSS). Este
  // componente solo corre en el navegador (ssr:false), así que window existe.
  const oscuro = useTemaOscuro();
  const sinMovimiento = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  return (
    <MapContainer
      center={[CENTRO_MANRIQUE[0], CENTRO_MANRIQUE[1]]}
      zoom={ZOOM.inicial}
      minZoom={ZOOM.minimo}
      maxZoom={ZOOM.maximo}
      scrollWheelZoom={false} // si no, la rueda secuestra el scroll de la página
      maxBounds={LIMITES_PANEO}
      maxBoundsViscosity={0.9}
      zoomAnimation={!sinMovimiento}
      fadeAnimation={!sinMovimiento}
      markerZoomAnimation={!sinMovimiento}
      className="h-full w-full"
    >
      <TileLayer
        url={oscuro ? TESELAS.oscuro : TESELAS.claro}
        attribution={TESELAS.atribucion}
        maxZoom={ZOOM.maximo}
      />

      {/* Máscara: color y opacidad salen de .mascara-fuera (CSS) para que sigan
          al tema; un atributo SVG no puede leer variables CSS. */}
      <Polygon
        positions={MASCARA}
        interactive={false}
        className="mascara-fuera"
        pathOptions={{ stroke: false }}
      />

      <GeoJSON
        data={capaLimite}
        style={{
          className: 'limite-comuna',
          color: '#1a1a1a', // el CSS (.limite-comuna) lo cambia con el tema
          weight: 1.25,
          opacity: 0.55,
          fillColor: '#3c8af6',
          fillOpacity: 0.04,
        }}
      />

      <Encuadre foco={foco} />
      <IrASeleccionado seleccionado={seleccionado} portafolios={portafolios} />

      {constelaciones && (
        <CapaConstelaciones
          datos={constelaciones}
          filtroId={filtroConstelacion}
          ubicacion={ubicacionUsuario}
        />
      )}

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
            <span className="mt-1 block font-sans text-xs text-tinta/65">
              Posición aproximada de tu dispositivo. No se guarda en ningún lado.
            </span>
          </Popup>
        </Marker>
      )}

      {portafolios.map((p) => {
        const grupo = grupoDeCategoria(p.categoria_id);
        return (
          <Marker
            key={p.id}
            position={[p.latitud, p.longitud]}
            icon={iconoGrupo(grupo, p.id === seleccionado)}
            title={`${p.nombre} · ${grupo.nombre}`}
            eventHandlers={
              alSeleccionar ? { click: () => alSeleccionar(p.id) } : undefined
            }
          >
            <Popup minWidth={200}>
              <span className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wide text-morado-texto">
                <span
                  aria-hidden="true"
                  className="inline-flex"
                  dangerouslySetInnerHTML={{ __html: svgForma(grupo, 16) }}
                />
                {p.categoria_nombre}
              </span>
              <strong className="mt-1 block font-display text-base font-medium text-tinta">
                {p.nombre}
              </strong>

              {/* La ubicación "canta" acá también: ícono + mono, no un dato
                  perdido entre el resto del popup. */}
              <span className="mt-1.5 flex items-start gap-1 font-sans text-xs text-tinta/65">
                <span aria-hidden="true">📍</span>
                <span>
                  {p.direccion}
                  <span className="text-tinta/60"> · {p.barrio}</span>
                </span>
              </span>

              {p.whatsapp && (
                <a
                  href={enlaceWhatsapp(p.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => contar(p.id, 'contacto')}
                  className="mt-2 inline-block font-sans text-xs text-azul-texto underline decoration-azul/40 underline-offset-4 hover:text-tinta"
                >
                  Escribir por WhatsApp →
                </a>
              )}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
