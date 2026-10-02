'use client';

import { memo, useEffect, useMemo } from 'react';
import { Circle, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

import type { Coordenada } from '@/lib/geo/constantes';
import type { Constelacion, DatosConstelaciones, EstrellaOsm } from '@/lib/geo/constelaciones';
import { nombreVisible } from '@/lib/geo/comerciosOsm';
import { distanciaMetros } from '@/lib/geo/distancia';
import { FichaComercioOsm } from './FichaComercioOsm';
import { svgEstrella, svgPunto } from './formas';

/**
 * Capa de constelaciones: halo + líneas del árbol de expansión mínima + estrellas.
 *
 * Son comercios de OpenStreetMap, no aliados. Por eso van en `noche-3` (azul
 * oscuro) y pequeños, y se dibujan DEBAJO de los marcadores de aliados
 * (`zIndexOffset` negativo). Cada estrella y cada punto suelto es un marcador
 * tocable y enfocable: abre un popup con lo que OSM sabe del comercio
 * (FichaComercioOsm). La estrella dibujada mide 11 px; la caja táctil, 44.
 *
 * Con ~200 comercios el rendimiento importa: los íconos se crean una vez, cada
 * marcador es `memo` y el popup solo monta su contenido mientras está abierto
 * (react-leaflet lo hace así), así que filtrar o mover el mapa no re-renderiza
 * 200 fichas.
 *
 * El trazo de las líneas es CSS (`stroke-dashoffset`, ver `.arista-trazo` en
 * globals.css) y no framer-motion: el SVG de Leaflet lo crea Leaflet, no React,
 * y animar `pathLength` desde React obligaría a re-renderizar cada polilínea.
 * La regla global de `prefers-reduced-motion` lo apaga.
 */

const TEXTO_ATRIBUCION =
  '&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (ODbL)';

/** Un icono por estrella: el desfase del parpadeo va en variables CSS. */
function iconoEstrella(indice: number) {
  const duracion = 3 + (indice % 4); // 3–6 s
  const desfase = -((indice * 0.7) % duracion);
  return L.divIcon({
    className: '',
    html: `<span class="caja-estrella"><span class="estrella-osm" style="animation-duration:${duracion}s;animation-delay:${desfase.toFixed(2)}s">${svgEstrella(11)}</span></span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -10],
  });
}

const ICONO_SUELTO = L.divIcon({
  className: '',
  html: `<span class="caja-estrella">${svgPunto(8)}</span>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -8],
});

// Un divIcon no es una imagen, así que el marcador no trae nombre accesible:
// se le pone el del comercio. Y al cerrar el popup con Esc el foco caería a
// <body>: se devuelve al marcador.
const MANEJADORES: L.LeafletEventHandlerFnMap = {
  add: (ev) => {
    const marcador = ev.target as L.Marker;
    marcador.getElement()?.setAttribute('aria-label', marcador.options.title ?? '');
  },
  popupclose: (ev) => {
    const el = (ev.target as L.Marker).getElement();
    if (el && (!document.activeElement || document.activeElement === document.body)) {
      el.focus({ preventScroll: true });
    }
  },
};

function PopupComercio({ e, ubicacion }: { e: EstrellaOsm; ubicacion?: Coordenada | null }) {
  const distancia = ubicacion ? distanciaMetros(ubicacion, [e.lat, e.lon]) : null;
  return <FichaComercioOsm comercio={e} distancia={distancia} conAclaracion />;
}

const MarcadorComercio = memo(function MarcadorComercio({
  e,
  icono,
  ubicacion,
}: {
  e: EstrellaOsm;
  icono: L.DivIcon;
  ubicacion?: Coordenada | null;
}) {
  return (
    <Marker
      position={[e.lat, e.lon]}
      icon={icono}
      title={nombreVisible(e)}
      zIndexOffset={-10_000}
      eventHandlers={MANEJADORES}
    >
      <Popup minWidth={220} maxWidth={280}>
        <PopupComercio e={e} ubicacion={ubicacion} />
      </Popup>
    </Marker>
  );
});

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
  ubicacion,
}: {
  c: Constelacion;
  orden: number;
  activa: boolean;
  ubicacion?: Coordenada | null;
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
          <MarcadorComercio key={e.osm} e={e} icono={icono} ubicacion={ubicacion} />
        ) : null;
      })}
    </>
  );
}

export function CapaConstelaciones({
  datos,
  filtroId,
  ubicacion,
}: {
  datos: DatosConstelaciones;
  /** Si viene, se dibuja solo esa constelación y no los puntos sueltos. */
  filtroId: string;
  /** Posición del visitante: el popup dice a qué distancia queda cada comercio. */
  ubicacion?: Coordenada | null;
}) {
  const visibles = filtroId
    ? datos.constelaciones.filter((c) => c.id === filtroId)
    : datos.constelaciones;

  return (
    <>
      <Atribucion />
      {!filtroId &&
        datos.puntos_sueltos.map((p) => (
          <MarcadorComercio key={p.osm} e={p} icono={ICONO_SUELTO} ubicacion={ubicacion} />
        ))}
      {visibles.map((c, i) => (
        <Constelacion key={c.id} c={c} orden={i} activa={Boolean(filtroId)} ubicacion={ubicacion} />
      ))}
    </>
  );
}
