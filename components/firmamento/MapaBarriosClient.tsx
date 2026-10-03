'use client';

import { useEffect, useMemo } from 'react';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Feature, GeoJsonObject } from 'geojson';
import 'leaflet/dist/leaflet.css';

import BARRIOS from '@/lib/geo/barrios-manrique.json';
import { TESELAS, ZOOM } from '@/lib/geo/constantes';
import { claseDeBarrio } from '@/lib/escalaSecuencial';
import { Atribucion } from '@/components/mapa/CapaConstelaciones';

/**
 * Mapa coloreado de los 15 barrios (choropleth): cada polígono toma el color de
 * su clase en `lib/geo/escalaBarrios.ts` y lleva su número encima. El color no es
 * el único portador: el número está escrito en el barrio y la lista de al lado
 * (`MapaBarrios`) trae los mismos valores.
 *
 * Teselas oscuras fijas: es una «ventana de noche». Los polígonos no son
 * interactivos (no hay clic que descubrir): lo que se lee está a la vista, y el
 * nombre aparece desde el zoom 15, porque a 14 se pisan los de La Salle y San
 * José de la Cima (mismo criterio que el mapa de aliados).
 */

const ZOOM_NOMBRES = 15;

const LIMITES = L.geoJSON(BARRIOS as unknown as GeoJsonObject).getBounds();
const LIMITES_PANEO = LIMITES.pad(0.3);

function Encuadre() {
  const mapa = useMap();
  useEffect(() => {
    const fijarMinimo = () => mapa.setMinZoom(Math.max(ZOOM.minimo, mapa.getBoundsZoom(LIMITES_PANEO)));
    fijarMinimo();
    mapa.fitBounds(LIMITES, { padding: [8, 8], maxZoom: ZOOM.seleccion });
    mapa.on('resize', fijarMinimo);
    return () => {
      mapa.off('resize', fijarMinimo);
    };
  }, [mapa]);
  return null;
}

function NombresSegunZoom() {
  const mapa = useMap();
  useEffect(() => {
    const marcar = () =>
      mapa.getContainer().classList.toggle('etiquetas-barrio-ocultas', mapa.getZoom() < ZOOM_NOMBRES);
    marcar();
    mapa.on('zoomend', marcar);
    return () => {
      mapa.off('zoomend', marcar);
    };
  }, [mapa]);
  return null;
}

export default function MapaBarriosClient({ valores }: { valores: Record<string, number> }) {
  const datos = useMemo(() => BARRIOS as unknown as GeoJsonObject, []);

  // Con "menos movimiento" se apagan también las animaciones de Leaflet.
  const sinMovimiento = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  return (
    <MapContainer
      center={LIMITES.getCenter()}
      zoom={ZOOM.inicial}
      minZoom={ZOOM.minimo}
      maxZoom={ZOOM.maximo}
      scrollWheelZoom={false} // si no, la rueda secuestra el scroll de la página
      maxBounds={LIMITES_PANEO}
      maxBoundsViscosity={0.9}
      zoomSnap={0.25} // que el encuadre llene la caja en vez de dejar un margen de zoom entero
      zoomAnimation={!sinMovimiento}
      fadeAnimation={!sinMovimiento}
      markerZoomAnimation={!sinMovimiento}
      className="h-full w-full"
    >
      <TileLayer url={TESELAS.oscuro} attribution={TESELAS.atribucion} maxZoom={ZOOM.maximo} />
      <Atribucion />
      <GeoJSON
        data={datos}
        interactive={false}
        style={(f?: Feature) => {
          const n = valores[f?.properties?.nombre as string] ?? 0;
          return {
            className: 'limite-barrio',
            weight: 1,
            opacity: 0.85,
            dashArray: undefined,
            fill: true,
            fillColor: claseDeBarrio(n).relleno,
            fillOpacity: 0.88,
          };
        }}
        onEachFeature={(f, capa) => {
          const nombre = f.properties.nombre as string;
          const n = valores[nombre] ?? 0;
          const caja = document.createElement('span');
          caja.style.color = claseDeBarrio(n).texto;
          const rotulo = document.createElement('span');
          rotulo.className = 'barrio-nombre';
          rotulo.textContent = nombre;
          const cifra = document.createElement('b');
          cifra.textContent = String(n);
          caja.append(rotulo, cifra);
          capa.bindTooltip(caja, {
            permanent: true,
            direction: 'center',
            className: 'etiqueta-valor-barrio',
          });
        }}
      />
      <Encuadre />
      <NombresSegunZoom />
    </MapContainer>
  );
}
