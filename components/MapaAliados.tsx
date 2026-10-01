'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import type { Coordenada } from '@/lib/geo/constantes';
import { GRUPOS } from '@/lib/categorias/grupos';
import {
  cargarConstelaciones,
  fechaLarga,
  SNAPSHOT_OSM,
  type DatosConstelaciones,
} from '@/lib/geo/constelaciones';
import { svgEstrella, svgForma } from './mapa/formas';

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

type EstadoCarga = 'cargando' | 'listo' | 'error';

export function MapaAliados({
  portafolios,
  alSeleccionar,
  ubicacionUsuario,
  seleccionado,
  variante = 'portada',
  conFiltro = false,
  hrefLista = '/aliados#listado',
}: {
  portafolios: Portafolio[];
  alSeleccionar?: (id: string) => void;
  ubicacionUsuario?: Coordenada | null;
  seleccionado?: string | null;
  variante?: keyof typeof ALTURAS;
  /** Muestra el selector de constelación (solo en /aliados). */
  conFiltro?: boolean;
  /** Dónde está la lista equivalente al mapa, para quien no puede usarlo. */
  hrefLista?: string;
}) {
  const [activa, setActiva] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [datos, setDatos] = useState<DatosConstelaciones | null>(null);
  const [estado, setEstado] = useState<EstadoCarga>('cargando');

  // El JSON (~34 KB) se pide aquí y no se importa: fuera del bundle inicial.
  useEffect(() => {
    let vivo = true;
    cargarConstelaciones()
      .then((d) => {
        if (!vivo) return;
        setDatos(d);
        setEstado('listo');
      })
      .catch(() => vivo && setEstado('error'));
    return () => {
      vivo = false;
    };
  }, []);

  const fuente = useMemo(
    () =>
      datos
        ? `Comercios mapeados en OpenStreetMap, © colaboradores de OpenStreetMap (ODbL). Datos de OSM al ${fechaLarga(SNAPSHOT_OSM)}; agrupados el ${fechaLarga(datos.fecha_corrida)}.`
        : null,
    [datos],
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          aria-pressed={activa}
          onClick={() => setActiva((a) => !a)}
          className={`inline-flex min-h-[44px] items-center gap-2 border px-4 font-sans text-sm transition-colors ${
            activa
              ? 'border-noche bg-noche text-estrella'
              : 'border-tinta/40 text-tinta hover:border-azul-texto hover:text-azul-texto'
          }`}
        >
          <span aria-hidden="true">{activa ? '★' : '☆'}</span>
          Constelaciones
        </button>

        {conFiltro && datos && (
          <label className="inline-flex items-center gap-2 font-sans text-sm text-tinta/80">
            Ver una sola
            <select
              value={filtro}
              onChange={(e) => {
                setFiltro(e.target.value);
                if (e.target.value) setActiva(true);
              }}
              className="min-h-[44px] border border-tinta/40 bg-hueso px-3 font-sans text-sm text-tinta"
            >
              <option value="">Todas ({datos.constelaciones.length})</option>
              {datos.constelaciones.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} · {c.tamano} comercios
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

      <div className={`${ALTURAS[variante]} w-full overflow-hidden border border-tinta/12`}>
        <MapaClient
          portafolios={portafolios}
          alSeleccionar={alSeleccionar}
          ubicacionUsuario={ubicacionUsuario}
          seleccionado={seleccionado}
          constelaciones={activa ? datos : null}
          filtroConstelacion={activa ? filtro : ''}
        />
      </div>

      {estado === 'error' && (
        <p role="status" className="mt-3 font-sans text-xs text-tinta/65">
          No pudimos cargar las constelaciones. El mapa de aliados funciona igual.
        </p>
      )}

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-sans text-xs text-tinta/75">
        {GRUPOS.map((g) => (
          <li key={g.id} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-flex"
              dangerouslySetInnerHTML={{ __html: svgForma(g, 16) }}
            />
            {g.nombre} ({g.formaNombre})
          </li>
        ))}
        {activa && datos && (
          <li className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-flex"
              dangerouslySetInnerHTML={{ __html: svgEstrella(12) }}
            />
            Estrella: comercio mapeado en OpenStreetMap, no es aliado
          </li>
        )}
      </ul>

      {activa && fuente && (
        <p className="mt-2 font-cifra text-xs leading-relaxed text-tinta/70">{fuente}</p>
      )}
    </div>
  );
}
