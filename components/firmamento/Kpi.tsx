import { NumeroAnimado } from '@/components/NumeroAnimado';
import { Estrella } from './Estrella';

/**
 * Indicador con estrella (DESIGN.md › Firmamento › Reglas de cifras): la cifra,
 * qué cuenta, y debajo SIEMPRE su fuente y su fecha en `font-cifra`. Sin
 * excepción: si una cifra no tiene fuente y fecha, no entra aquí.
 *
 * `numero` anima el conteo con `NumeroAnimado` (respeta menos movimiento y el
 * HTML del servidor ya trae el valor final). Sin `numero` la cifra es texto,
 * como «<5» o «—». El texto accesible va en `sr-only`: el conteo es
 * `aria-hidden` para que un lector de pantalla no lea números intermedios.
 */
export function Kpi({
  valor,
  numero,
  decimales = 0,
  sufijo = '',
  etiqueta,
  fuente,
  fecha,
  aclaracion,
  tono = 'sodio',
}: {
  valor: string;
  numero?: number;
  decimales?: number;
  sufijo?: string;
  etiqueta: string;
  fuente: string;
  fecha: string;
  aclaracion?: string;
  tono?: 'sodio' | 'estrella' | 'ladrillo';
}) {
  const color =
    tono === 'ladrillo' ? 'text-ladrillo' : tono === 'estrella' ? 'text-estrella' : 'text-sodio';
  return (
    <div className="relative min-w-0 border border-trazo bg-noche-2 p-5 pr-12">
      <Estrella tamano={22} className="absolute right-4 top-4" />
      <p className={`font-cifra text-4xl font-medium leading-none tabular-nums sm:text-5xl ${color}`}>
        <span className="sr-only">
          {valor}
          {sufijo}
        </span>
        {numero === undefined ? (
          <span aria-hidden="true">
            {valor}
            {sufijo}
          </span>
        ) : (
          <NumeroAnimado numero={numero} decimales={decimales} sufijo={sufijo} />
        )}
      </p>
      <p className="mt-3 font-sans text-base font-medium leading-snug text-estrella">{etiqueta}</p>
      {aclaracion && <p className="mt-1 font-sans text-sm leading-snug text-tenue">{aclaracion}</p>}
      <p className="mt-3 break-words font-cifra text-xs leading-relaxed text-tenue">
        Fuente: {fuente} · {fecha}
      </p>
    </div>
  );
}
