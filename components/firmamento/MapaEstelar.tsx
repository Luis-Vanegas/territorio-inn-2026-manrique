'use client';

import { useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

import { MapaAliados } from '@/components/MapaAliados';

/**
 * El «mapa + lista que enciende una constelación» de Firmamento, en un solo
 * lugar. Lo usan la tabla de constelaciones de `/firmamento` (`MapaYTabla`) y
 * «Dónde apoyar primero» del observatorio de la entidad (`ObservatorioCielo`).
 *
 * El estado es uno: la constelación elegida. Tocar un botón de la lista la
 * enciende en el mapa; el selector del propio mapa («Ver una sola») cambia el
 * botón marcado. Es el mapa de siempre (`MapaAliados`, noche fija), SIN aliados
 * individuales: el arreglo va vacío, así que ningún nombre, dirección ni
 * coordenada de un negocio de la red llega a estas pantallas (regla k = 5). Las
 * estrellas son comercios de OpenStreetMap, que ya son públicos.
 *
 * Uso:
 *   const { elegida, elegir, fijar, caja } = useConstelacionElegida();
 *   <MapaEstelar elegida={elegida} fijar={fijar} caja={caja} />
 *   <BotonConstelacion codigo="C04" activa={f.id === elegida} alAlternar={() => elegir(f.id)} />
 */

// Referencia estable: un `[]` nuevo por render recalcularía los conteos del mapa.
// `never[]` y no `Portafolio[]`: estas pantallas no importan ni el tipo de un negocio.
const SIN_ALIADOS: never[] = [];

export type EstadoMapaEstelar = {
  /** Id de la constelación encendida; '' = ninguna. */
  elegida: string;
  /** Enciende esa constelación o, si ya lo estaba, la apaga; y trae el mapa a la vista. */
  elegir: (id: string) => void;
  /** Lo usa el selector del propio mapa. */
  fijar: (id: string) => void;
  caja: React.RefObject<HTMLDivElement>;
};

/**
 * @param margenSuperior píxeles que tapan el encabezado y el índice pegajosos:
 *   si el mapa asoma por encima de esa línea, se trae a la vista.
 */
export function useConstelacionElegida(margenSuperior = 120): EstadoMapaEstelar {
  const [elegida, setElegida] = useState('');
  const caja = useRef<HTMLDivElement>(null);
  const sinMovimiento = useReducedMotion();

  function elegir(id: string) {
    const nueva = id === elegida ? '' : id;
    setElegida(nueva);
    // En el celular la lista queda debajo del mapa: si no se ve entero, se trae a la vista.
    const el = caja.current;
    if (nueva && el) {
      const r = el.getBoundingClientRect();
      if (r.top < margenSuperior || r.bottom > window.innerHeight) {
        el.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth', block: 'center' });
      }
    }
  }

  return { elegida, elegir, fijar: setElegida, caja };
}

export function MapaEstelar({
  elegida,
  fijar,
  caja,
  className = '',
}: Pick<EstadoMapaEstelar, 'elegida' | 'fijar' | 'caja'> & { className?: string }) {
  return (
    <div ref={caja} className={`min-w-0 scroll-mt-24 ${className}`}>
      <MapaAliados
        portafolios={SIN_ALIADOS}
        variante="vitrina"
        conFiltro
        noche
        constelacionElegida={elegida}
        alElegirConstelacion={fijar}
      />
    </div>
  );
}

/**
 * Botón de 44 px que enciende o apaga una constelación en el mapa.
 * `codigo`: el chip con el código de la fila de una tabla («C04»).
 * `texto`: «Ver en el mapa» / «Quitar del mapa», para una tarjeta.
 */
export function BotonConstelacion({
  codigo,
  activa,
  alAlternar,
  variante = 'codigo',
}: {
  codigo: string;
  activa: boolean;
  alAlternar: () => void;
  variante?: 'codigo' | 'texto';
}) {
  const estado = activa
    ? 'border-sodio bg-sodio font-medium text-noche'
    : 'border-trazo-2 text-estrella hover:border-sodio hover:text-sodio';

  if (variante === 'texto') {
    return (
      <button
        type="button"
        aria-pressed={activa}
        aria-label={`${activa ? 'Quitar del mapa' : 'Ver en el mapa'} ${codigo}`}
        onClick={alAlternar}
        className={`mt-2 inline-flex min-h-[44px] items-center rounded-lg border px-4 font-sans text-sm transition-colors ${estado}`}
      >
        {activa ? 'Quitar del mapa' : 'Ver en el mapa'}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={activa}
      aria-label={`${activa ? 'Apagar' : 'Encender'} ${codigo} en el mapa`}
      onClick={alAlternar}
      className={`inline-flex min-h-[44px] min-w-[52px] items-center justify-center border px-2 font-sans text-sm font-medium transition-colors ${estado}`}
    >
      {codigo}
    </button>
  );
}
