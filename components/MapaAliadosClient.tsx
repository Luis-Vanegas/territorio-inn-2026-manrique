'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Polygon, Popup, useMap } from 'react-leaflet';
import { detenerMapa } from '@/components/mapa/detenerMapa';
import L from 'leaflet';
import type { GeoJsonObject } from 'geojson';
import 'leaflet/dist/leaflet.css';

import { POLIGONO_MANRIQUE, CENTRO_MANRIQUE, TESELAS, ZOOM } from '@/lib/geo/constantes';
import BARRIOS from '@/lib/geo/barrios-manrique.json';
import type { Coordenada } from '@/lib/geo/constantes';
import type { DatosConstelaciones, EstrellaOsm } from '@/lib/geo/constelaciones';
import { grupoDeCategoria, type Grupo } from '@/lib/categorias/grupos';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import { enlaceWhatsapp } from '@/lib/contacto';
import { contar } from '@/lib/interacciones';
import type { CentralidadMapa, ResultadosMapa } from './MapaAliados';
import { CapaConstelaciones, CapaResultados } from './mapa/CapaConstelaciones';
import { svgEstrella } from './mapa/formas';
import { PALETA_NOCHE } from '@/lib/paleta';
import { useTemaOscuro } from '@/lib/tema';

/**
 * Mapa de la vitrina.
 *
 * Los marcadores son divIcon y no <Marker> por defecto por dos razones:
 * la estética (una estrella del color de su grupo, en vez del pin azul de
 * Leaflet) y porque los íconos default de Leaflet se rompen con bundlers —
 * resuelven sus PNG por ruta relativa y en Next terminan en 404.
 *
 * Un aliado es la estrella GRANDE (28 px); los comercios de OSM, las chicas
 * (CapaConstelaciones). La categoría exacta va escrita en el popup y en el
 * `title`. La caja del marcador mide 44 px (objetivo táctil).
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
      html: `<span class="marcador-grupo${activo ? ' marcador-grupo--activo' : ''}">${svgEstrella(grupo.color, 28, { brillo: true })}</span>`,
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

/**
 * Por debajo de este zoom los nombres de barrio se pisan entre sí (a 14, el
 * encuadre de toda la comuna, se montan La Salle y San José de la Cima), así que
 * se ven al acercarse. El contorno queda siempre.
 */
const ZOOM_ETIQUETAS_BARRIO = 15;

function EtiquetasBarrioSegunZoom() {
  const mapa = useMap();
  useEffect(() => {
    const marcar = () =>
      mapa
        .getContainer()
        .classList.toggle('etiquetas-barrio-ocultas', mapa.getZoom() < ZOOM_ETIQUETAS_BARRIO);
    marcar();
    mapa.on('zoomend', marcar);
    return () => {
      mapa.off('zoomend', marcar);
    };
  }, [mapa]);
  return null;
}

type Props = {
  portafolios: Portafolio[];
  alSeleccionar?: (id: string) => void;
  /** Posición del visitante, si dio permiso. Dibuja su punto, pero no mueve el encuadre. */
  ubicacionUsuario?: Coordenada | null;
  /** Id del negocio resaltado desde el listado: el mapa vuela hacia él. */
  seleccionado?: string | null;
  /** Datos ya cargados: si es null la capa de comercios de OSM no se dibuja. */
  constelaciones?: DatosConstelaciones | null;
  /** Líneas y nombres de las constelaciones (interruptor «Líneas de constelación»). */
  lineas?: boolean;
  /** Id de una constelación para verla sola y acercarse a ella; '' = todas. */
  filtroConstelacion?: string;
  /** Siempre teselas oscuras, sin importar el tema (la página /firmamento es nocturna). */
  noche?: boolean;
  /** Capa interna del POT (solo el panel del equipo): contorno discontinuo y nombre, sin clics. */
  centralidades?: CentralidadMapa[];
  /**
   * Búsqueda activa: se dibujan solo `portafolios` (ya filtrados) y estos
   * comercios de OSM; no hay líneas, nombres ni sueltos, y el encuadre va a ellos.
   */
  resultados?: ResultadosMapa | null;
};

/** Hasta aquí el encuadre de resultados se anima; con más puntos se salta directo. */
const MAX_RESULTADOS_ANIMADOS = 12;

type Registro = Map<string, L.Marker>;
const SIN_COMERCIOS: EstrellaOsm[] = [];

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
function Encuadre({ foco, animar }: { foco: L.LatLngBounds | null; animar: boolean }) {
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

  // El primer encuadre va sin animar: con StrictMode (y al salir de la página) el
  // mapa se desmonta a mitad del zoom animado y Leaflet termina la transición
  // sobre un panel ya borrado (`_leaflet_pos` de undefined en `_onZoomTransitionEnd`).
  const primero = useRef(true);
  useEffect(() => {
    mapa.fitBounds(foco ?? LIMITES_COMUNA, { padding: [16, 16], maxZoom: ZOOM.seleccion, animate: !primero.current && animar });
    primero.current = false;
    return () => {
      detenerMapa(mapa);
    };
  }, [mapa, foco, animar]);

  return null;
}

/**
 * Vuela al negocio que se tocó en el listado y abre su popup. `seleccionado` es
 * el id de un aliado o `osm:<id>` (un comercio de los resultados de búsqueda).
 */
function IrASeleccionado({
  seleccionado,
  portafolios,
  comercios,
  registro,
}: {
  seleccionado?: string | null;
  portafolios: Portafolio[];
  comercios: EstrellaOsm[];
  registro: React.MutableRefObject<Registro>;
}) {
  const mapa = useMap();

  useEffect(() => {
    if (!seleccionado) return;
    const p = portafolios.find((x) => x.id === seleccionado);
    const c = p ? null : comercios.find((x) => `osm:${x.osm}` === seleccionado);
    const destino: L.LatLngExpression | null = p ? [p.latitud, p.longitud] : c ? [c.lat, c.lon] : null;
    if (!destino) return;

    const zoom = Math.max(mapa.getZoom(), ZOOM.seleccion);
    const abrir = () => registro.current.get(seleccionado)?.openPopup();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      mapa.setView(destino, zoom, { animate: false });
      abrir();
    } else {
      mapa.once('moveend', abrir);
      mapa.flyTo(destino, zoom, { duration: 0.7 });
    }
    return () => {
      mapa.off('moveend', abrir);
      detenerMapa(mapa); // un vuelo en curso no debe seguir sobre un mapa desmontado
    };
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
  lineas = true,
  noche = false,
  centralidades,
  resultados,
}: Props) {
  const registro = useRef<Registro>(new Map());
  const registrar = useCallback((id: string, marcador: L.Marker | null) => {
    if (marcador) registro.current.set(id, marcador);
    else registro.current.delete(id);
  }, []);
  const comerciosResultado = resultados?.comercios ?? SIN_COMERCIOS;

  // El polígono no cambia nunca; sin memo, react-leaflet vuelve a montar la
  // capa GeoJSON en cada render y el mapa parpadea al filtrar por categoría.
  const capaLimite = useMemo(
    () => POLIGONO_MANRIQUE as unknown as GeoJsonObject,
    [],
  );

  // Con búsqueda se encuadran los resultados (los que caen dentro del margen de
  // paneo: un aliado en otro país no debe alejar el mapa); sin ellos, la comuna.
  const { foco, animar } = useMemo(() => {
    if (resultados) {
      const puntos = [
        ...portafolios.map((p) => L.latLng(p.latitud, p.longitud)),
        ...resultados.comercios.map((e) => L.latLng(e.lat, e.lon)),
      ].filter((pt) => LIMITES_PANEO.contains(pt));
      return {
        foco: puntos.length > 0 ? L.latLngBounds(puntos) : null,
        animar: puntos.length <= MAX_RESULTADOS_ANIMADOS,
      };
    }
    const c = constelaciones?.constelaciones.find((x) => x.id === filtroConstelacion);
    if (!c) return { foco: null, animar: true };
    return { foco: L.latLngBounds(c.estrellas.map((e) => L.latLng(e.lat, e.lon))).pad(0.5), animar: true };
  }, [resultados, portafolios, constelaciones, filtroConstelacion]);

  // Con "menos movimiento" se apagan también las animaciones de zoom y de
  // desplazamiento de Leaflet (el CSS global solo alcanza a las de CSS). Este
  // componente solo corre en el navegador (ssr:false), así que window existe.
  const oscuro = useTemaOscuro() || noche;
  const capaPot = useMemo(
    () =>
      centralidades && centralidades.length > 0
        ? ({
            type: 'FeatureCollection',
            features: centralidades.map((c) => ({
              type: 'Feature',
              properties: { nombre: c.nombre, jerarquia: c.jerarquia },
              geometry: c.geometry,
            })),
          } as unknown as GeoJsonObject)
        : null,
    [centralidades],
  );
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

      {/* Los 15 barrios oficiales: solo contorno y nombre, sin clics, para que
          no le roben el toque a las estrellas ni a los marcadores.
          ponytail: la etiqueta va al centro del recuadro del barrio; en uno muy
          cóncavo puede caer cerca del borde. Si molesta, guardar un punto de
          etiqueta por barrio en extraer-barrios.mjs. */}
      <GeoJSON
        data={BARRIOS as unknown as GeoJsonObject}
        interactive={false}
        style={{ className: 'limite-barrio', weight: 0.75, opacity: 0.45, dashArray: '3 4', fill: false }}
        onEachFeature={(f, capa) =>
          capa.bindTooltip(f.properties.nombre, {
            permanent: true,
            direction: 'center',
            className: 'etiqueta-barrio',
          })
        }
      />

      <GeoJSON
        data={capaLimite}
        style={{
          className: 'limite-comuna',
          color: '#0B1026', // el CSS (.limite-comuna) lo cambia con el tema
          weight: 1.25,
          opacity: 0.55,
          fillColor: '#3c8af6',
          fillOpacity: 0.04,
        }}
      />

      {capaPot && (
        <GeoJSON
          key={oscuro ? 'pot-noche' : 'pot-dia'}
          data={capaPot}
          interactive={false}
          style={{
            className: 'limite-centralidad',
            color: oscuro ? PALETA_NOCHE.sodio : PALETA_NOCHE.noche,
            weight: 2.5,
            opacity: 0.95,
            dashArray: '9 6',
            fillColor: oscuro ? PALETA_NOCHE.sodio : PALETA_NOCHE.noche,
            fillOpacity: 0.06,
          }}
          onEachFeature={(f, capa) =>
            capa.bindTooltip(`${f.properties.nombre} · ${f.properties.jerarquia}`, {
              permanent: true,
              direction: 'center',
              className: oscuro ? 'etiqueta-centralidad etiqueta-centralidad--noche' : 'etiqueta-centralidad',
            })
          }
        />
      )}

      <EtiquetasBarrioSegunZoom />
      <Encuadre foco={foco} animar={animar} />
      <IrASeleccionado
        seleccionado={seleccionado}
        portafolios={portafolios}
        comercios={comerciosResultado}
        registro={registro}
      />

      {resultados ? (
        <CapaResultados comercios={resultados.comercios} ubicacion={ubicacionUsuario} registrar={registrar} />
      ) : (
        constelaciones && (
        <CapaConstelaciones
          datos={constelaciones}
          filtroId={filtroConstelacion}
          lineas={lineas}
          ubicacion={ubicacionUsuario}
        />
        )
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
            ref={(m) => registrar(p.id, m)}
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
                  dangerouslySetInnerHTML={{ __html: svgEstrella(grupo.color, 16) }}
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
                  className="mt-1 inline-flex min-h-[44px] items-center font-sans text-xs text-azul-texto underline decoration-azul/40 underline-offset-4 hover:text-tinta"
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
