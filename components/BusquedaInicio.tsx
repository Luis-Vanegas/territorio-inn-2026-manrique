'use client';

import { createContext, useContext, useMemo, useState } from 'react';

/**
 * Estado compartido del buscador y el mapa del inicio. El buscador (arriba, en
 * el título) y el mapa (abajo) son hermanos en una página de servidor: el
 * contexto es lo más corto que los conecta sin pasar la consulta por la URL en
 * cada letra. La búsqueda en sí es `buscarNegocios` (lib/busqueda.ts), que corre
 * en el mapa; acá solo vive lo que la persona escribió.
 */

export const ID_CAMPO_BUSQUEDA = 'buscar-inicio';
export const ID_MAPA_INICIO = 'mapa-inicio';

type Valor = {
  consulta: string;
  setConsulta: (c: string) => void;
  /** Categorías con más negocios, para no arrancar con la caja en blanco. */
  sugerencias: string[];
};

const Contexto = createContext<Valor | null>(null);

export function ProveedorBusqueda({
  sugerencias,
  children,
}: {
  sugerencias: string[];
  children: React.ReactNode;
}) {
  const [consulta, setConsulta] = useState('');
  const valor = useMemo(() => ({ consulta, setConsulta, sugerencias }), [consulta, sugerencias]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useBusquedaInicio(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error('useBusquedaInicio va dentro de <ProveedorBusqueda>');
  return v;
}

/** «Prueba con:» + una categoría por botón. */
export function Sugerencias() {
  const { setConsulta, sugerencias } = useBusquedaInicio();
  if (sugerencias.length === 0) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-2 font-sans text-sm text-tinta/60">
      Prueba con:
      {sugerencias.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setConsulta(s)}
          className="min-h-[44px] border border-tinta/55 px-4 text-tinta/75 transition-colors hover:border-azul hover:text-azul-texto"
        >
          {s}
        </button>
      ))}
    </p>
  );
}
