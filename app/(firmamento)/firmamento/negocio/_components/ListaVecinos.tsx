import { grupoDeCategoria } from '@/lib/categorias/grupos';
import { formatearDistancia } from '@/lib/geo/distancia';
import { nombreCategoriaOsm } from '@/lib/geo/comerciosOsm';
import { svgForma } from '@/components/mapa/formas';

/**
 * Un vecino de la constelación: un aliado de la plataforma o un comercio mapeado
 * en OpenStreetMap. Cada fila lleva la forma de su grupo (no solo el color), su
 * categoría y su distancia, y una etiqueta con TEXTO que dice si es aliado o no:
 * «OpenStreetMap · no es aliado» no se puede omitir (AGENTS.md › Constelación de
 * un aliado).
 */
export type Vecino = {
  clave: string;
  nombre: string;
  categoria: string | null;
  metros: number;
  esAliado: boolean;
  /** Dirección que trae la fuente, si la hay. */
  direccion?: string | null;
};

export function ListaVecinos({ vecinos, etiquetaVacia }: { vecinos: Vecino[]; etiquetaVacia: string }) {
  if (vecinos.length === 0) {
    return <p className="font-sans text-base leading-relaxed text-tinta/70">{etiquetaVacia}</p>;
  }
  return (
    <ul className="divide-y divide-tinta/12">
      {vecinos.map((v) => {
        const grupo = grupoDeCategoria(v.categoria);
        return (
          <li key={v.clave} className="flex items-start gap-3 py-3">
            <span
              aria-hidden="true"
              className="mt-1 inline-flex shrink-0"
              dangerouslySetInnerHTML={{ __html: svgForma(grupo, 18) }}
            />
            <span className="min-w-0 flex-1">
              <span className="block break-words font-sans text-base font-medium text-tinta">{v.nombre}</span>
              <span className="block font-sans text-sm text-tinta/70">
                {nombreCategoriaOsm(v.categoria)} · <span className="tabular-nums">{formatearDistancia(v.metros)}</span>
              </span>
              {v.direccion && <span className="block break-words font-sans text-sm text-tinta/70">{v.direccion}</span>}
              <span
                className={`mt-1 inline-block rounded border px-1.5 py-0.5 font-sans text-xs ${
                  v.esAliado ? 'border-azul text-azul-texto' : 'border-tinta/55 text-tinta/70'
                }`}
              >
                {v.esAliado ? 'Aliado de Constelaciones' : 'OpenStreetMap · no es aliado'}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
