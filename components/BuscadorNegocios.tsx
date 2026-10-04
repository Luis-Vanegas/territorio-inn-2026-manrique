'use client';

import { ID_CAMPO_BUSQUEDA, ID_MAPA_INICIO, Sugerencias, useBusquedaInicio } from './BusquedaInicio';
import { terminosDe } from '@/lib/busqueda';

/**
 * Caja de búsqueda de la portada. No lista resultados: filtra el mapa de abajo
 * (`MapaAliadosDestacado`), que es donde se ven y se tocan; el estado va por
 * `BusquedaInicio`.
 *
 * Sigue siendo un <form method="get" action="/aliados"> de verdad: sin
 * JavaScript, Enter lleva a la vitrina con `?q=`. Con JavaScript la búsqueda ya
 * está aplicada en vivo, así que Enter solo baja al mapa.
 */
export function BuscadorNegocios() {
  const { consulta, setConsulta } = useBusquedaInicio();
  const buscando = terminosDe(consulta).length > 0;

  return (
    <div>
      <form
        method="get"
        action="/aliados"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          document.getElementById(ID_MAPA_INICIO)?.scrollIntoView({ block: 'start' });
        }}
      >
        <label htmlFor={ID_CAMPO_BUSQUEDA} className="font-sans text-sm uppercase tracking-[0.15em] text-tinta/65">
          ¿Qué necesitas en el barrio?
        </label>
        <div className="mt-3 flex gap-2">
          <input
            id={ID_CAMPO_BUSQUEDA}
            type="search"
            name="q"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Almuerzos, barbería, ropa…"
            autoComplete="off"
            className="min-h-[48px] min-w-0 flex-1 border border-tinta/55 bg-hueso px-4 font-sans text-base text-tinta placeholder:text-tinta/65 focus:border-azul focus:outline-none"
          />
          <button
            type="submit"
            className="min-h-[48px] shrink-0 border border-azul-texto bg-azul-texto px-5 font-sans text-base text-hueso transition-colors hover:bg-transparent hover:text-azul-texto"
          >
            Buscar
          </button>
        </div>
      </form>

      {!buscando && <Sugerencias />}
    </div>
  );
}
