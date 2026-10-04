'use client';

import { memo, useEffect, useMemo } from 'react';
import { Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

import type { Coordenada } from '@/lib/geo/constantes';
import type { Constelacion, DatosConstelaciones, EstrellaOsm } from '@/lib/geo/constelaciones';
import { nombreVisible } from '@/lib/geo/comerciosOsm';
import { distanciaMetros } from '@/lib/geo/distancia';
import { grupoDeCategoria, type Grupo } from '@/lib/categorias/grupos';
import { FichaComercioOsm } from './FichaComercioOsm';
import { svgEstrella } from './formas';

/**
 * Capa de constelaciones: estrellas de OSM + líneas del árbol de expansión mínima + nombre.
 *
 * Son comercios de OpenStreetMap, no aliados. Cada uno es una ESTRELLA del color
 * de su grupo (`grupos.ts`), tenue (~55 % de opacidad, sin borde grueso): 12 px las
 * que están en una constelación, 9 px las sueltas, contra 28 px opacos de un
 * aliado (Luis, 4-oct-2026: el tamaño dice aliado/comercio, el color la
 * categoría; el equipo pidió un mapa menos recargado). Se dibujan DEBAJO de los
 * aliados (`zIndexOffset` negativo). Cada una es un marcador tocable y enfocable:
 * abre un popup con lo que OSM sabe del comercio (FichaComercioOsm). La caja
 * táctil mide 44.
 *
 * Las estrellas se dibujan siempre; el interruptor «Líneas de constelación»
 * (`lineas`) solo prende o apaga las líneas. El NOMBRE de una constelación solo
 * se escribe cuando hay una elegida (`filtroId`), no por zoom.
 *
 * Con ~300 comercios el rendimiento importa: los íconos se comparten por grupo,
 * cada marcador es `memo` y el popup solo monta su contenido mientras está abierto.
 *
 * El trazo de las líneas es CSS (`stroke-dashoffset`, ver `.arista-trazo` en
 * globals.css) y no framer-motion: el SVG de Leaflet lo crea Leaflet, no React.
 * La regla global de `prefers-reduced-motion` lo apaga.
 */

const TEXTO_ATRIBUCION =
  '&copy; colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (ODbL)';

/** Un icono por grupo y tamaño: 12 px en una constelación, 9 px suelto. */
const ICONOS = new Map<string, L.DivIcon>();

function iconoComercio(grupo: Grupo, suelto: boolean) {
  const clave = `${grupo.id}:${suelto}`;
  let icono = ICONOS.get(clave);
  if (!icono) {
    icono = L.divIcon({
      className: '',
      html: `<span class="caja-estrella">${svgEstrella(grupo.color, suelto ? 9 : 12, { tenue: true })}</span>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -8],
    });
    ICONOS.set(clave, icono);
  }
  return icono;
}

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

export const MarcadorComercio = memo(function MarcadorComercio({
  e,
  icono,
  ubicacion,
  registrar,
}: {
  e: EstrellaOsm;
  icono: L.DivIcon;
  ubicacion?: Coordenada | null;
  /** Para abrir su popup desde la lista de resultados (clave `osm:<id>`). */
  registrar?: (id: string, marcador: L.Marker | null) => void;
}) {
  return (
    <Marker
      ref={registrar ? (m) => registrar(`osm:${e.osm}`, m) : undefined}
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

export function Atribucion() {
  const mapa = useMap();
  useEffect(() => {
    mapa.attributionControl.addAttribution(TEXTO_ATRIBUCION);
    return () => {
      mapa.attributionControl.removeAttribution(TEXTO_ATRIBUCION);
    };
  }, [mapa]);
  return null;
}

/** Nombre de la constelación elegida: código y nombre, sin caja. */
function iconoNombre(c: Constelacion) {
  const codigo = escaparHtml(c.codigo ?? c.id.toUpperCase());
  const nombre = c.nombre ? `<span class="nombre"> · ${escaparHtml(c.nombre)}</span>` : '';
  return L.divIcon({
    className: '',
    html: `<span class="etiqueta-constelacion">${codigo}${nombre}</span>`,
    iconSize: [0, 0],
    iconAnchor: [-8, 18],
  });
}

function escaparHtml(t: string) {
  return t.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);
}

function Constelacion({
  c,
  orden,
  lineasVisibles,
  conNombre,
  ubicacion,
}: {
  c: Constelacion;
  orden: number;
  lineasVisibles: boolean;
  conNombre: boolean;
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

  const nombre = useMemo(() => iconoNombre(c), [c]);

  // Escalonado corto: 25 ms por constelación y tope de 250 ms, para que todo
  // el trazo termine dentro de los 900 ms de DESIGN.md › Movimiento.
  const retraso = Math.min(orden * 25, 250);

  return (
    <>
      {lineasVisibles && conNombre && (
        <Marker
          position={[c.centroide.lat, c.centroide.lon]}
          icon={nombre}
          interactive={false}
          keyboard={false}
          zIndexOffset={-20_000}
        />
      )}
      {lineasVisibles && (
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
      )}
      {c.estrellas.map((e) => (
        <MarcadorComercio key={e.osm} e={e} icono={iconoComercio(grupoDeCategoria(e.categoria), false)} ubicacion={ubicacion} />
      ))}
    </>
  );
}

export function CapaConstelaciones({
  datos,
  filtroId,
  lineas,
  ubicacion,
}: {
  datos: DatosConstelaciones;
  /** Interruptor «Líneas de constelación»: las estrellas se ven igual. */
  lineas: boolean;
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
          <MarcadorComercio
            key={p.osm}
            e={p}
            icono={iconoComercio(grupoDeCategoria(p.categoria), true)}
            ubicacion={ubicacion}
          />
        ))}
      {visibles.map((c, i) => (
        <Constelacion key={c.id} c={c} orden={i} lineasVisibles={lineas} conNombre={Boolean(filtroId)} ubicacion={ubicacion} />
      ))}
    </>
  );
}

/**
 * Resultado de una búsqueda: SOLO los comercios de OSM que devolvió
 * `buscarNegocios`, sin líneas, sin nombres de constelación y sin sueltos
 * ajenos. Los aliados que coinciden los dibuja el mapa aparte.
 */
export function CapaResultados({
  comercios,
  ubicacion,
  registrar,
}: {
  comercios: EstrellaOsm[];
  ubicacion?: Coordenada | null;
  registrar: (id: string, marcador: L.Marker | null) => void;
}) {
  return (
    <>
      <Atribucion />
      {comercios.map((e) => (
        <MarcadorComercio
          key={e.osm}
          e={e}
          icono={iconoComercio(grupoDeCategoria(e.categoria), false)}
          ubicacion={ubicacion}
          registrar={registrar}
        />
      ))}
    </>
  );
}
