'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Portafolio } from '@/lib/db/portafolios.repo';
import type { Coordenada } from '@/lib/geo/constantes';
import { GRUPOS, grupoDeCategoria, type IdGrupo } from '@/lib/categorias/grupos';
import { fechaLarga } from '@/lib/geo/constelaciones';
import {
  aplanarComercios,
  etiquetaConstelacion,
  filtrarPorCategoria,
  lineaMezcla,
} from '@/lib/geo/comerciosOsm';
import { svgEstrella, svgForma } from './mapa/formas';
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
}) {
  const [activa, setActiva] = useState(true);
  const [filtro, setFiltro] = useState('');
  // El JSON (~43 KB) se pide aquí y no se importa: fuera del bundle inicial.
  const { datos: datosCrudos, estado } = useConstelaciones();
  const datos = useMemo(
    () => (datosCrudos ? filtrarPorCategoria(datosCrudos, categoria) : null),
    [datosCrudos, categoria],
  );
  // Con una categoría activa la constelación elegida puede haber desaparecido.
  const elegida = datos?.constelaciones.find((c) => c.id === filtro) ?? null;
  const filtroValido = elegida ? filtro : '';

  // Conteo por grupo de lo que el mapa muestra ahora: aliados y, con la capa
  // prendida, las estrellas de la constelación elegida (o todas).
  const conteos = useMemo(() => {
    const total: Record<IdGrupo, number> = { comida: 0, tienda: 0, belleza: 0, oficios: 0, salud: 0, otros: 0 };
    for (const p of portafolios) total[grupoDeCategoria(p.categoria_id).id]++;
    if (activa && datos) {
      const estrellas = elegida ? elegida.estrellas : aplanarComercios(datos);
      for (const e of estrellas) total[grupoDeCategoria(e.categoria).id]++;
    }
    return total;
  }, [portafolios, activa, datos, elegida]);

  const fuente = useMemo(
    () =>
      datos
        ? `Comercios mapeados en OpenStreetMap, © colaboradores de OpenStreetMap (ODbL). Datos de OSM al ${fechaLarga(datos.osm_base)}; agrupados el ${fechaLarga(datos.fecha_corrida)}.`
        : null,
    [datos],
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          aria-pressed={activa}
          onClick={() => {
            setActiva((a) => !a);
            setFiltro(''); // apagada, un filtro «aplicado» que no aplica confunde al lector de pantalla
          }}
          className={`inline-flex min-h-[44px] items-center gap-2 border px-4 font-sans text-sm transition-colors ${
            activa
              ? 'border-noche bg-noche text-estrella dark:border-trazo-2'
              : 'border-tinta/40 text-tinta hover:border-azul-texto hover:text-azul-texto'
          }`}
        >
          <span aria-hidden="true">{activa ? '★' : '☆'}</span>
          Constelaciones
        </button>

        {conFiltro && datos && (
          <label className="inline-flex max-w-full flex-wrap items-center gap-2 font-sans text-sm text-tinta/80">
            Ver una sola
            <select
              value={filtroValido}
              onChange={(e) => {
                setFiltro(e.target.value);
                if (e.target.value) setActiva(true);
              }}
              className="min-h-[44px] max-w-full border border-tinta/55 bg-hueso px-3 font-sans text-sm text-tinta"
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

      <div className={`${ALTURAS[variante]} w-full overflow-hidden border border-tinta/12`}>
        <MapaClient
          portafolios={portafolios}
          alSeleccionar={alSeleccionar}
          ubicacionUsuario={ubicacionUsuario}
          seleccionado={seleccionado}
          constelaciones={activa ? datos : null}
          filtroConstelacion={activa ? filtroValido : ''}
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
            {g.nombre} ({g.formaNombre}) · {conteos[g.id]}
          </li>
        ))}
        {activa && datos && (
          <li className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-flex"
              dangerouslySetInnerHTML={{ __html: svgEstrella(12) }}
            />
            Estrella: comercio mapeado en OpenStreetMap, no es aliado. Tócala para ver su nombre y dirección
          </li>
        )}
      </ul>
      <p className="mt-1.5 font-sans text-xs text-tinta/70">
        Cada número suma los aliados y los comercios de OpenStreetMap que se ven ahora en el mapa.
      </p>

      {activa && elegida && (
        <p aria-live="polite" className="mt-2 font-cifra text-xs leading-relaxed text-tinta/70">
          Qué hay aquí: {lineaMezcla(elegida)}
        </p>
      )}

      {activa && fuente && (
        <p className="mt-2 font-cifra text-xs leading-relaxed text-tinta/70">{fuente}</p>
      )}
    </div>
  );
}
