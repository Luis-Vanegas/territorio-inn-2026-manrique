import type { SemanaInteraccion } from '@/lib/db/cuenta.repo';
import { formatearNumero } from '@/lib/formato';

/**
 * «Semana a semana»: 8 semanas de vistas y toques de contacto de UNA ficha, en
 * SVG propio y sin librería. Barras HORIZONTALES, una fila por semana: con ocho
 * semanas y dos series, las verticales con la cifra encima se pisan a 320 px.
 * No depende del color: las vistas son barras lisas y los contactos, barras
 * rayadas, cada una con su cifra al lado, y el mismo dato está en una tabla para
 * lector de pantalla. Es estático a propósito: nada arranca en `opacity: 0` ni
 * hay movimiento que respetar.
 *
 * Colores del tema (`azul-texto`, `morado-texto`, `hueso`), no hex de noche: cambian
 * solos con el modo y pasan 3:1 sobre `hueso` en claro y en oscuro.
 *
 * `semanas` va de la más vieja a la más nueva; la última es «los últimos 7 días».
 * El SVG lleva `max-w` para que, en pantallas anchas, el texto no se agrande más
 * de la cuenta (la escala del viewBox es la del texto).
 */

const ANCHO = 300;
const COL_ETIQUETA = 52;
const LARGO_MAX = 190; // barra más larga; el resto del ancho es para la cifra
const ALTO_BARRA = 12;
const ALTO_FILA = 34;

export function GraficoSemanas({ semanas, nombre }: { semanas: readonly SemanaInteraccion[]; nombre: string }) {
  const maximo = Math.max(1, ...semanas.flatMap((s) => [s.vistas, s.contactos]));
  const largo = (v: number) => (v === 0 ? 0 : Math.max(3, Math.round((v / maximo) * LARGO_MAX)));
  const etiqueta = (i: number) => (i === semanas.length - 1 ? 'Hoy' : `-${semanas.length - 1 - i} sem`);
  const alto = semanas.length * ALTO_FILA;
  // De la más nueva arriba a la más vieja abajo: lo de hoy se lee primero.
  const filas = semanas.map((s, i) => ({ s, i })).reverse();

  return (
    <figure>
      <svg
        viewBox={`0 0 ${ANCHO} ${alto}`}
        role="img"
        aria-label={`Vistas y toques de contacto de ${nombre}, semana a semana. Los datos están en la tabla de abajo.`}
        className="h-auto w-full max-w-[460px]"
      >
        <defs>
          {/* Rayas: lo que distingue a los contactos sin depender del color. */}
          <pattern id="rayas-contacto" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" className="fill-hueso" />
            <rect width="2" height="5" className="fill-morado-texto" />
          </pattern>
        </defs>

        {filas.map(({ s, i }, fila) => {
          const y = fila * ALTO_FILA;
          const lV = largo(s.vistas);
          const lC = largo(s.contactos);
          return (
            <g key={i}>
              <text x="0" y={y + 21} fontSize="12" className="fill-tinta/70" fontFamily="var(--font-dm-sans), system-ui, sans-serif">
                {etiqueta(i)}
              </text>
              <rect x={COL_ETIQUETA} y={y + 4} width={lV} height={ALTO_BARRA} className="fill-azul-texto" rx="2" />
              <text x={COL_ETIQUETA + lV + 5} y={y + 14.5} fontSize="12" className="fill-tinta" fontFamily="var(--font-dm-sans), system-ui, sans-serif">
                {s.vistas}
              </text>
              <rect x={COL_ETIQUETA} y={y + 4 + ALTO_BARRA + 2} width={lC} height={ALTO_BARRA} fill="url(#rayas-contacto)" className="stroke-morado-texto" strokeWidth="1" rx="2" />
              <text x={COL_ETIQUETA + lC + 5} y={y + 28.5} fontSize="12" className="fill-tinta" fontFamily="var(--font-dm-sans), system-ui, sans-serif">
                {s.contactos}
              </text>
            </g>
          );
        })}
      </svg>

      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-sans text-sm text-tinta/70">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-azul-texto" />
          Vistas de tu ficha
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded-sm border border-morado-texto"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgb(var(--morado-texto-rgb)) 0 2px, transparent 2px 5px)' }}
          />
          Toques para contactarte
        </span>
      </figcaption>

      {/* display:table ignora el ancho de 1 px de sr-only y desborda en móvil: va envuelta. */}
      <div className="sr-only">
      <table>
        <caption>Vistas y contactos por semana de {nombre}</caption>
        <thead>
          <tr>
            <th scope="col">Semana</th>
            <th scope="col">Vistas</th>
            <th scope="col">Contactos</th>
          </tr>
        </thead>
        <tbody>
          {semanas.map((s, i) => {
            const atras = semanas.length - 1 - i;
            return (
              <tr key={i}>
                <th scope="row">
                  {atras === 0 ? 'Últimos 7 días' : `Hace ${atras} semana${atras === 1 ? '' : 's'}`}
                </th>
                <td>{formatearNumero(s.vistas)}</td>
                <td>{formatearNumero(s.contactos)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </figure>
  );
}
