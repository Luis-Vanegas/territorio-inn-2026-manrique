import type { EstrellaOsm } from '@/lib/geo/constelaciones';
import {
  cocinaLegible,
  horarioLegible,
  nombreCategoriaOsm,
  nombreVisible,
  webLegible,
} from '@/lib/geo/comerciosOsm';
import { grupoDeCategoria } from '@/lib/categorias/grupos';
import { formatearDistancia } from '@/lib/geo/distancia';
import { svgForma } from './formas';

/**
 * Lo que OSM sabe de un comercio, en texto para vecinos. La usan el popup de
 * la estrella y la lista «Otros comercios del barrio», así que dicen lo mismo.
 *
 * OSM no trae fotos: en su lugar va la forma del grupo de la categoría
 * (DESIGN.md › Categorías). Solo se muestra lo que el JSON trae; lo que falta
 * no se rellena. Nada acá es un enlace ni un botón: la dirección es la forma
 * de saber dónde queda.
 */
export function FichaComercioOsm({
  comercio,
  distancia,
  como = 'strong',
  conAclaracion = false,
}: {
  comercio: EstrellaOsm;
  /** Metros hasta la persona, solo si dio permiso de ubicación. */
  distancia?: number | null;
  /** `h3` en la lista (para que el lector de pantalla navegue por títulos). */
  como?: 'strong' | 'h3';
  /** La aclaración «no es aliado»: en el popup no hay un subtítulo de sección que la diga. */
  conAclaracion?: boolean;
}) {
  const grupo = grupoDeCategoria(comercio.categoria);
  const { direccion, horario, cocina, web } = comercio.detalle ?? {};
  const cocinaTexto = cocina ? cocinaLegible(cocina) : '';
  const Titulo = como;

  return (
    <div className="font-sans text-xs text-tinta/75">
      <span className="flex items-center gap-1.5 uppercase tracking-wide text-morado-texto">
        <span
          aria-hidden="true"
          className="inline-flex shrink-0"
          dangerouslySetInnerHTML={{ __html: svgForma(grupo, 16) }}
        />
        {nombreCategoriaOsm(comercio.categoria)}
      </span>

      <Titulo className="mt-1 block font-display text-base font-medium leading-snug text-tinta">
        {nombreVisible(comercio)}
      </Titulo>

      {typeof distancia === 'number' && (
        <p className="mt-1">
          <span className="font-sans">{formatearDistancia(distancia)}</span> de donde estás
        </p>
      )}
      {comercio.barrio && (
        <p className="mt-1.5">
          <span className="text-tinta/70">Barrio: </span>
          {comercio.barrio}
        </p>
      )}
      {direccion && (
        <p className="mt-1">
          <span className="text-tinta/70">Dirección: </span>
          {direccion}
        </p>
      )}
      {horario && (
        <p className="mt-1">
          <span className="text-tinta/70">Horario: </span>
          {horarioLegible(horario)}
        </p>
      )}
      {cocinaTexto && (
        <p className="mt-1">
          <span className="text-tinta/70">Cocina: </span>
          {cocinaTexto}
        </p>
      )}
      {web && (
        <p className="mt-1 break-all">
          <span className="text-tinta/70">Web: </span>
          {webLegible(web)}
        </p>
      )}

      {conAclaracion && (
        <p className="mt-2 border-t border-tinta/12 pt-2 text-tinta/70">
          Comercio mapeado en OpenStreetMap · no es aliado de Constelaciones
        </p>
      )}
    </div>
  );
}
