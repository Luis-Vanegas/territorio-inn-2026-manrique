'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import type { Coordenada } from '@/lib/geo/constantes';
import { GRUPOS } from '@/lib/categorias/grupos';
import type { EstrellaOsm } from '@/lib/geo/constelaciones';
import { etiquetaConstelacion, filtrarPorCategoria, lineaMezcla } from '@/lib/geo/comerciosOsm';
import { svgEstrella } from './mapa/formas';
import { useConstelaciones } from './mapa/useConstelaciones';

/**
 * Frontera de carga del mapa + controles que lo rodean.
 *
 * Leaflet toca `window` al importarse, así que no puede renderizar en el
 * servidor: de ahí el ssr:false. Y `dynamic({ssr:false})` solo se permite
 * dentro de un Client Component, por eso este wrapper existe en vez de llamar
 * a dynamic() directo desde la página, que es un Server Component.
 *
 * El interruptor, el filtro, la leyenda y la línea de fuente viven acá y no
 * dentro de Leaflet: son HTML normal, con foco y lector de pantalla, y el JSON
 * de constelaciones se pide aquí para que el filtro pueda listar sus opciones.
 */

/**
 * Una centralidad urbana del POT (Acuerdo 48 de 2014) para la capa interna del
 * panel del equipo. Solo la pasa Territorio: la licencia de los polígonos está
 * pendiente y no se dibujan en páginas públicas. El JSON NO se importa acá, así
 * que ningún bundle público lo carga.
 */
export type CentralidadMapa = {
  id: string;
  nombre: string;
  jerarquia: string;
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown };
};

/**
 * Lo que devuelve una búsqueda: si se pasa, el mapa muestra SOLO esto (los
 * aliados de `portafolios` que coinciden y estos comercios de OSM), sin líneas
 * ni nombres de constelación, y se encuadra en ellos.
 */
export type ResultadosMapa = { comercios: EstrellaOsm[] };

const ALTURAS = {
  portada: 'h-[380px] sm:h-[460px] lg:h-[520px]',
  vitrina: 'h-[460px] sm:h-[600px] lg:h-[680px]',
} as const;

const MapaClient = dynamic(() => import('./MapaAliadosClient'), {
  ssr: false,
  // El placeholder tiene la misma altura que el mapa: si no, la página salta
  // cuando el mapa termina de cargar.
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-tinta/[0.02]">
      <span className="font-sans text-xs text-tinta/60">cargando mapa…</span>
    </div>
  ),
});

export function MapaAliados({
  portafolios,
  alSeleccionar,
  ubicacionUsuario,
  seleccionado,
  variante = 'portada',
  conFiltro = false,
  categoria,
  hrefLista = '/aliados#listado',
  noche = false,
  constelacionElegida,
  alElegirConstelacion,
  centralidades,
  alto,
  resultados,
  seleccionadoEnLista,
  controles,
}: {
  portafolios: Portafolio[];
  alSeleccionar?: (id: string) => void;
  ubicacionUsuario?: Coordenada | null;
  seleccionado?: string | null;
  variante?: keyof typeof ALTURAS;
  /** Muestra el selector de constelación (solo en /aliados). */
  conFiltro?: boolean;
  /** `?categoria=` de la vitrina: filtra también las estrellas de OpenStreetMap. */
  categoria?: string;
  /** Dónde está la lista equivalente al mapa, para quien no puede usarlo. */
  hrefLista?: string;
  /** Modo noche fijo (teselas oscuras y controles de Firmamento), sin seguir el tema. */
  noche?: boolean;
  /** Constelación elegida desde afuera (la tabla de /firmamento); si se pasa, el mapa la obedece. */
  constelacionElegida?: string;
  /** Avisa cuando la persona elige otra con el selector del propio mapa. */
  alElegirConstelacion?: (id: string) => void;
  /** Capa interna de centralidades del POT: si se pasa, aparece el interruptor (apagado de entrada). */
  centralidades?: CentralidadMapa[];
  /** Clases de alto del mapa; pisa las de `variante`. */
  alto?: string;
  /** Búsqueda activa: `portafolios` ya viene filtrado y acá van los comercios de OSM que coinciden. */
  resultados?: ResultadosMapa | null;
  /** Negocio de la lista de resultados a donde vuela el mapa y abre su popup (`id` de aliado u `osm:<id>`). */
  seleccionadoEnLista?: string | null;
  /** Botones extra de la barra, junto a «Líneas de constelación» (el inicio pone «Qué tengo cerca»). */
  controles?: React.ReactNode;
}) {
  const [verPot, setVerPot] = useState(false);
  const [activaInterna, setActivaInterna] = useState(true);
  const [filtroInterno, setFiltroInterno] = useState('');
  const filtro = constelacionElegida ?? filtroInterno;
  const setFiltro = (id: string) => {
    setFiltroInterno(id);
    alElegirConstelacion?.(id);
  };
  // Elegir una fila de la tabla de /firmamento enciende la capa aunque estuviera apagada.
  const activa = activaInterna || Boolean(constelacionElegida);
  // El JSON (~43 KB) se pide aquí y no se importa: fuera del bundle inicial.
  const { datos: datosCrudos, estado } = useConstelaciones();
  const datos = useMemo(
    () => (datosCrudos ? filtrarPorCategoria(datosCrudos, categoria) : null),
    [datosCrudos, categoria],
  );
  // Con una categoría activa la constelación elegida puede haber desaparecido.
  const elegida = datos?.constelaciones.find((c) => c.id === filtro) ?? null;
  const filtroValido = elegida ? filtro : '';

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          aria-pressed={activa}
          onClick={() => {
            setActivaInterna(!activa);
            setFiltro(''); // apagada, un filtro «aplicado» que no aplica confunde al lector de pantalla
          }}
          className={`inline-flex min-h-[44px] items-center gap-2 border px-4 font-sans text-sm transition-colors ${
            noche
              ? activa
                ? 'border-sodio bg-sodio text-noche'
                : 'border-trazo-2 text-estrella hover:border-sodio hover:text-sodio'
              : activa
                ? 'border-noche bg-noche text-estrella dark:border-trazo-2'
                : 'border-tinta/40 text-tinta hover:border-azul-texto hover:text-azul-texto'
          }`}
        >
          <span aria-hidden="true">{activa ? '★' : '☆'}</span>
          Líneas de constelación
        </button>

        {controles}

        {centralidades && (
          <button
            type="button"
            aria-pressed={verPot}
            onClick={() => setVerPot(!verPot)}
            className={`inline-flex min-h-[44px] items-center gap-2 border px-4 font-sans text-sm transition-colors ${
              noche
                ? verPot
                  ? 'border-sodio bg-sodio text-noche'
                  : 'border-trazo-2 text-estrella hover:border-sodio hover:text-sodio'
                : verPot
                  ? 'border-noche bg-noche text-estrella dark:border-trazo-2'
                  : 'border-tinta/40 text-tinta hover:border-azul-texto hover:text-azul-texto'
            }`}
          >
            <span aria-hidden="true">{verPot ? '▣' : '▢'}</span>
            Centralidades del POT
          </button>
        )}

        {conFiltro && datos && (
          <label className="inline-flex max-w-full flex-wrap items-center gap-2 font-sans text-sm text-tinta/80">
            Ver una sola
            <select
              value={filtroValido}
              onChange={(e) => {
                setFiltro(e.target.value);
                if (e.target.value) setActivaInterna(true);
              }}
              className="min-h-[44px] w-full min-w-0 border border-tinta/55 bg-hueso px-3 font-sans text-sm text-tinta sm:w-auto sm:max-w-md"
            >
              <option value="">Todas ({datos.constelaciones.length})</option>
              {datos.constelaciones.map((c) => (
                <option key={c.id} value={c.id}>
                  {etiquetaConstelacion(c)}
                </option>
              ))}
            </select>
          </label>
        )}

        <Link
          href={hrefLista}
          className="inline-flex min-h-[44px] items-center font-sans text-sm text-azul-texto underline decoration-azul/40 underline-offset-4 hover:text-tinta"
        >
          Ver los aliados en lista
        </Link>
      </div>

      <div className={`${alto ?? ALTURAS[variante]} w-full overflow-hidden border border-tinta/12`}>
        <MapaClient
          portafolios={portafolios}
          alSeleccionar={alSeleccionar}
          ubicacionUsuario={ubicacionUsuario}
          seleccionado={seleccionadoEnLista ?? seleccionado}
          constelaciones={datos}
          resultados={resultados}
          lineas={activa}
          filtroConstelacion={activa ? filtroValido : ''}
          noche={noche}
          centralidades={verPot ? centralidades : undefined}
        />
      </div>

      {centralidades && (
        <p className="mt-2 font-sans text-xs leading-relaxed text-tinta/70">
          Uso interno: licencia de los polígonos pendiente.
          {verPot && ' Contorno discontinuo con el nombre: centralidad urbana del POT 2014, Alcaldía de Medellín.'}
        </p>
      )}

      {estado === 'error' && (
        <p role="status" className="mt-3 font-sans text-xs text-tinta/65">
          No pudimos cargar las constelaciones. El mapa de aliados funciona igual.
        </p>
      )}

      {/* Leyenda mínima (equipo, 4-oct-2026: «solo las categorías»): una fila con los
          6 grupos y una línea para el tamaño. La atribución de OpenStreetMap (ODbL)
          la pone Leaflet en la esquina del mapa; no se quita. */}
      <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-sans text-xs text-tinta/75">
        {GRUPOS.map((g) => (
          <li key={g.id} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-flex" dangerouslySetInnerHTML={{ __html: svgEstrella(g.color, 14) }} />
            {g.nombre}
          </li>
        ))}
      </ul>
      <p className="mt-1.5 font-sans text-xs leading-relaxed text-tinta/70">
        Estrella grande: aliado de Constelaciones. Estrella pequeña: comercio de OpenStreetMap, el mapa abierto.
        Una constelación es un grupo de comercios cercanos.
      </p>

      {activa && elegida && !resultados && (
        <p aria-live="polite" className="mt-2 break-words font-sans text-xs leading-relaxed text-tinta/75">
          Qué hay aquí, en {[elegida.codigo, elegida.nombre].filter(Boolean).join(' · ') || elegida.id}:{' '}
          {lineaMezcla(elegida)}
        </p>
      )}

    </div>
  );
}
