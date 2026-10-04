'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

import { CLASES_BARRIO } from '@/lib/escalaSecuencial';
import { PALETA_NOCHE } from '@/lib/paleta';
import { BarrasCategoria } from './BarrasCategoria';

/**
 * Los 15 barrios de la Comuna 3 coloreados por una cifra (hoy, comercios de
 * OpenStreetMap por barrio), con su leyenda y la lista equivalente.
 *
 * Es una «ventana de noche» (`.modo-noche`): sirve igual dentro de una página de
 * día. Leaflet toca `window` al importarse, de ahí el `dynamic` con `ssr: false`
 * (solo se permite en un Client Component, por eso este wrapper).
 *
 * Qué entra: SOLO cifras públicas. Los comercios de OSM ya lo son. Una cifra de
 * aliados por barrio es un dato de la red y pasa antes por `suprimir()` de
 * `lib/privacidad/kAnonimato.ts` (regla k = 5): este componente pinta números,
 * no decide la privacidad, así que quien lo llame con aliados debe suprimir
 * antes y no pintar una celda «<5» con un color que revele su valor.
 *
 * Accesibilidad: el color no es el único portador (el número va escrito en cada
 * barrio), la lista de al lado trae los 15 valores y una tabla `sr-only` los
 * repite para el lector de pantalla.
 */

const MapaClient = dynamic(() => import('./MapaBarriosClient'), {
  ssr: false,
  // Misma altura que el mapa: si no, la página salta cuando termina de cargar.
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-noche-3">
      <span className="font-sans text-sm text-tenue">Cargando mapa…</span>
    </div>
  ),
});

export type FilaBarrioMapa = { barrio: string; valor: number };

export function MapaBarrios({
  filas,
  cifra = 'comercios',
  descripcion,
  fuente,
  marco = true,
}: {
  /** Los 15 barrios, con 0 donde no haya: una que falte diría que no existe. */
  filas: FilaBarrioMapa[];
  /** Qué cuenta cada número, en plural: «comercios». */
  cifra?: string;
  /** Lo que lee el lector de pantalla al llegar a la tabla. */
  descripcion: string;
  /** Línea de fuente y fecha (toda cifra lleva la suya). */
  fuente: React.ReactNode;
  /** Sin marco propio cuando ya va dentro de una tarjeta. */
  marco?: boolean;
}) {
  const valores = useMemo(() => Object.fromEntries(filas.map((f) => [f.barrio, f.valor])), [filas]);
  const ordenadas = useMemo(
    () => [...filas].sort((a, b) => b.valor - a.valor || a.barrio.localeCompare(b.barrio, 'es')),
    [filas],
  );

  return (
    <div className="modo-noche" style={{ backgroundColor: 'transparent' }}>
      <div className={marco ? 'border border-trazo bg-noche-2 p-4 sm:p-5' : ''}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
          <div className="min-w-0">
            <div
              role="group"
              aria-label={`Mapa de los barrios de la Comuna 3 coloreados por ${cifra}. Cada barrio lleva su número; la lista de al lado trae los mismos valores.`}
              className="h-[360px] w-full overflow-hidden border border-trazo sm:h-[460px]"
            >
              <MapaClient valores={valores} />
            </div>

            <p className="mt-3 font-sans text-sm font-medium text-estrella">
              Más claro, más {cifra}
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 font-sans text-sm text-estrella">
              {CLASES_BARRIO.map((c) => (
                <li key={c.etiqueta} className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-block h-4 w-6 border border-trazo-2"
                    style={{ backgroundColor: c.relleno }}
                  />
                  {c.etiqueta}
                </li>
              ))}
            </ul>
            <p className="mt-2 font-sans text-sm leading-relaxed text-tenue">
              El color solo agrupa: cada barrio lleva su número escrito. Los nombres aparecen al acercar el
              mapa.
            </p>
          </div>

          <div className="min-w-0">
            <h3 className="font-sans text-lg font-medium text-estrella">Barrio por barrio</h3>
            <BarrasCategoria
              className="mt-3"
              encabezado="Barrio"
              columna={cifra.charAt(0).toUpperCase() + cifra.slice(1)}
              descripcion={descripcion}
              filas={ordenadas.map((f) => ({
                id: f.barrio,
                nombre: f.barrio,
                valor: f.valor,
                color: PALETA_NOCHE['noche-azul'],
              }))}
            />
          </div>
        </div>

        <p className="mt-5 break-words font-sans tabular-nums text-xs leading-relaxed text-tenue">{fuente}</p>
      </div>
    </div>
  );
}
