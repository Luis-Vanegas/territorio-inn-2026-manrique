import { respondio } from '@/lib/db/vigia.repo';
import { fechaHoraBogota } from '@/lib/formato';
import type { FilaFuenteVigia } from '@/lib/firmamento/vigia';

/**
 * Tabla de las fuentes que vigila el vigía de convocatorias, con el estado de su
 * última corrida (panel del equipo › Convocatorias).
 *
 * Lee `hueso`/`tinta`: de día es de día y dentro de una `VentanaNoche` toma sola
 * la paleta de noche.
 *
 * El estado se dice con TEXTO, no solo con color: el chip de una fuente que falló
 * va invertido (fondo `tinta`, letra `hueso`) y el de un cambio lleva borde pleno,
 * pero lo que lo distingue para un lector de pantalla o en blanco y negro es la
 * palabra.
 */

type Tono = 'ok' | 'cambio' | 'falla' | 'pendiente';

function describir(f: FilaFuenteVigia): { texto: string; tono: Tono } {
  switch (f.estado) {
    case 'responde':
      return { texto: 'Responde · primera lectura', tono: 'ok' };
    case 'sin_cambio':
      return { texto: 'Responde · sin cambios', tono: 'ok' };
    case 'cambio':
      return { texto: 'Responde · cambió', tono: 'cambio' };
    case 'error_http':
      return { texto: f.httpStatus ? `Falló · HTTP ${f.httpStatus}` : 'Falló · sin respuesta HTTP', tono: 'falla' };
    case 'timeout':
      return { texto: 'Falló · tiempo agotado', tono: 'falla' };
    case 'bloqueada_robots':
      return { texto: 'Bloqueada · robots.txt', tono: 'falla' };
    default:
      return { texto: 'Sin informe aún', tono: 'pendiente' };
  }
}

const CLASE_TONO: Record<Tono, string> = {
  ok: 'border-tinta/55 text-tinta',
  cambio: 'border-tinta font-medium text-tinta',
  falla: 'border-tinta bg-tinta font-medium text-hueso',
  pendiente: 'border-dashed border-tinta/55 text-tinta/70',
};

export function ChipEstadoVigia({ fila }: { fila: FilaFuenteVigia }) {
  const { texto, tono } = describir(fila);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-sans text-xs ${CLASE_TONO[tono]}`}
    >
      {texto}
    </span>
  );
}

export function TablaFuentesVigia({
  filas,
  descripcion,
  conError = false,
}: {
  filas: FilaFuenteVigia[];
  /** Para el lector de pantalla. */
  descripcion: string;
  /** Muestra el texto del error bajo el chip (viene de terceros, se imprime como texto). */
  conError?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-tinta/12 [.modo-noche_&]:border-trazo">
      <table className="w-full min-w-[34rem] border-collapse text-left font-sans text-sm text-tinta">
        <caption className="sr-only">{descripcion}</caption>
        <thead className="text-tinta/70 [.modo-noche_&]:bg-noche-3 [.modo-noche_&]:text-tenue">
          <tr>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Fuente
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Estado
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">
              Nuevas
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Última respuesta
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id} className="border-t border-tinta/12 align-top [.modo-noche_&]:border-trazo">
              <th scope="row" className="px-3 py-3 font-normal">
                <a
                  href={f.url}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="break-words text-azul-texto underline underline-offset-4 [.modo-noche_&]:text-sodio"
                >
                  {f.nombre}
                </a>
                <span className="mt-0.5 block text-xs text-tinta/70 [.modo-noche_&]:text-tenue">{f.entidad}</span>
              </th>
              <td className="px-3 py-3">
                <ChipEstadoVigia fila={f} />
                {conError && f.error && (
                  <span className="mt-1.5 block max-w-xs break-words text-xs text-tinta/70">{f.error}</span>
                )}
              </td>
              <td className="px-3 py-3 text-right tabular-nums">
                {f.estado && respondio(f.estado) ? f.nuevas : '—'}
              </td>
              <td className="px-3 py-3 text-tinta/70 [.modo-noche_&]:text-tenue">
                {f.ultimaRespuesta ? fechaHoraBogota(f.ultimaRespuesta) : 'Nunca'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
