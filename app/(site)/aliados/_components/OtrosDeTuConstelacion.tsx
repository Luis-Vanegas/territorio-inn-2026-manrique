import type { DatosConstelaciones } from '@/lib/geo/constelaciones';
import { nombreCategoriaOsm, vecinosDeConstelacion } from '@/lib/geo/comerciosOsm';

/**
 * «Otros negocios de tu constelación» en la ficha de un aliado. La constelación se
 * calcula al vuelo con la ubicación del aliado (`vecinosDeConstelacion`, sin
 * escribir nada en la base). Los comercios salen de OpenStreetMap: no son aliados
 * y la etiqueta lo dice en cada uno. Si el negocio no cae dentro de ninguna
 * constelación, o los datos aún no cargaron, no se muestra nada.
 */
export function OtrosDeTuConstelacion({
  latitud,
  longitud,
  datos,
}: {
  latitud: number;
  longitud: number;
  datos: Pick<DatosConstelaciones, 'constelaciones'> | null;
}) {
  if (!datos) return null;
  const vecinos = vecinosDeConstelacion({ lat: latitud, lon: longitud }, datos);
  if (!vecinos || vecinos.comercios.length === 0) return null;

  const { constelacion, comercios, total } = vecinos;
  const nombreConstelacion = [constelacion.codigo, constelacion.nombre].filter(Boolean).join(' · ');

  return (
    <details className="mt-5 max-w-prose border-t border-tinta/12 pt-3">
      <summary className="cursor-pointer font-sans text-xs text-tinta/70 hover:text-azul-texto">
        Otros negocios de tu constelación
        {nombreConstelacion && <span className="text-tinta/60"> · {nombreConstelacion}</span>}
      </summary>

      <ul className="mt-3 flex flex-col gap-3">
        {comercios.map(({ comercio }) => (
          <li key={comercio.osm} className="font-sans text-sm text-tinta/75">
            <p className="font-medium text-tinta">{comercio.nombre}</p>
            <p className="text-xs text-tinta/65">
              {nombreCategoriaOsm(comercio.categoria)}
              {comercio.detalle?.direccion && <> · {comercio.detalle.direccion}</>}
            </p>
            <p className="mt-0.5 inline-block border border-tinta/20 px-1.5 py-0.5 font-sans text-[11px] uppercase tracking-wide text-tinta/60">
              OpenStreetMap · no es aliado
            </p>
          </li>
        ))}
      </ul>

      {total > comercios.length && (
        <p className="mt-3 font-sans text-xs text-tinta/60">
          Y {total - comercios.length} más con nombre en esta constelación.
        </p>
      )}
    </details>
  );
}
