'use client';

import { useEffect, useMemo } from 'react';
import { Circle, CircleMarker, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

import type { Constelacion, DatosConstelaciones } from '@/lib/geo/constelaciones';
import { svgEstrella } from './formas';

/**
 * Capa de constelaciones: halo + líneas del árbol de expansión mínima + estrellas.
 *
 * Son comercios de OpenStreetMap, no aliados. Por eso van en `noche-3` (azul
 * oscuro), pequeños y sin interacción: nada de esto es un botón, así que no
 * entra al orden de tabulación ni compite con los marcadores de aliados.
 *
 * El trazo de las líneas es CSS (`stroke-dashoffset`, ver `.arista-trazo` en
 * globals.css) y no framer-motion: el SVG de Leaflet lo crea Leaflet, no React,
 * y animar `pathLength` desde React obligaría a re-renderizar cada polilínea.
 * La regla global de `prefers-reduced-motion` lo apaga.
 */

const TEXTO_ATRIBUCION =
  '&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (ODbL)';

const COLOR = '#1A2450';

/** Un icono por estrella: el desfase del parpadeo va en variables CSS. */
function iconoEstrella(indice: number) {
  const duracion = 3 + (indice % 4); // 3–6 s
  const desfase = -((indice * 0.7) % duracion);
  return L.divIcon({
    className: '',
    html: `<span class="estrella-osm" style="animation-duration:${duracion}s;animation-delay:${desfase.toFixed(2)}s">${svgEstrella(11)}</span>`,
    iconSize: [11, 11],
    iconAnchor: [5.5, 5.5],
  });
}

function Atribucion() {
  const mapa = useMap();
  useEffect(() => {
    mapa.attributionControl.addAttribution(TEXTO_ATRIBUCION);
    return () => {
      mapa.attributionControl.removeAttribution(TEXTO_ATRIBUCION);
    };
  }, [mapa]);
  return null;
}

function Constelacion({
  c,
  orden,
  activa,
}: {
  c: Constelacion;
  orden: number;
  activa: boolean;
}) {
  const lineas = useMemo(
    () =>
      c.aristas.flatMap((a) => {
        const de = c.estrellas[a.de];
        const hasta = c.estrellas[a.a];
        return de && hasta
          ? [[[de.lat, de.lon] as [number, number], [hasta.lat, hasta.lon] as [number, number]]]
          : [];
      }),
    [c],
  );

  // Los iconos se crean una vez: un icono nuevo por render obligaría a Leaflet
  // a reemplazar el nodo de cada estrella.
  const iconos = useMemo(
    () => c.estrellas.map((_, i) => iconoEstrella(orden * 17 + i)),
    [c, orden],
  );

  // Escalonado corto: 25 ms por constelación y tope de 250 ms, para que todo
  // el trazo termine dentro de los 900 ms de DESIGN.md › Movimiento.
  const retraso = Math.min(orden * 25, 250);

  return (
    <>
      <Circle
        center={[c.centroide.lat, c.centroide.lon]}
        radius={c.radio_p90_m}
        interactive={false}
        className={activa ? 'halo-constelacion halo-constelacion--activa' : 'halo-constelacion'}
      />
      <Polyline
        positions={lineas}
        interactive={false}
        className="arista-constelacion"
        eventHandlers={{
          add: (e) => {
            const trazo = (e.target as L.Polyline).getElement() as SVGPathElement | null;
            if (!trazo) return;
            // pathLength=1 normaliza el largo: dasharray/offset 1 → 0 dibuja el
            // trazo entero sin medirlo. La clase solo se agrega si el atributo
            // quedó puesto; sin ella la línea es sólida (nunca se queda oculta).
            trazo.setAttribute('pathLength', '1');
            trazo.style.animationDelay = `${retraso}ms`;
            trazo.classList.add('arista-trazo');
          },
        }}
      />
      {c.estrellas.map((e, i) => {
        const icono = iconos[i];
        return icono ? (
          <Marker
            key={e.osm}
            position={[e.lat, e.lon]}
            icon={icono}
            interactive={false}
            keyboard={false}
          />
        ) : null;
      })}
    </>
  );
}

export function CapaConstelaciones({
  datos,
  filtroId,
}: {
  datos: DatosConstelaciones;
  /** Si viene, se dibuja solo esa constelación y no los puntos sueltos. */
  filtroId: string;
}) {
  const visibles = filtroId
    ? datos.constelaciones.filter((c) => c.id === filtroId)
    : datos.constelaciones;

  return (
    <>
      <Atribucion />
      {!filtroId &&
        datos.puntos_sueltos.map((p) => (
          <CircleMarker
            key={p.osm}
            center={[p.lat, p.lon]}
            radius={2}
            interactive={false}
            className="suelto-osm"
            pathOptions={{ stroke: false, fillColor: COLOR, fillOpacity: 0.35 }}
          />
        ))}
      {visibles.map((c, i) => (
        <Constelacion key={c.id} c={c} orden={i} activa={Boolean(filtroId)} />
      ))}
    </>
  );
}
