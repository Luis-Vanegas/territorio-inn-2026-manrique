import Link from 'next/link';

import { NumeroAnimado } from '@/components/NumeroAnimado';
import { CifraLimpia } from '../CifraLimpia';
import { Estrella } from './Estrella';

/**
 * Indicador con estrella (DESIGN.md › Firmamento › Reglas de cifras): la cifra,
 * qué cuenta y, si no va dentro de un `GrupoCifras`, su fuente y su fecha.
 *
 * Un solo componente para el día y la noche, por contexto: lee `hueso`/`tinta`
 * y, dentro de una `VentanaNoche` o de cualquier `.modo-noche`, las variantes
 * `[.modo-noche_&]` le dan el fondo `noche-2`, la cifra en `sodio` y la
 * estrella en `sodio`. De día la cifra es `tinta` y la estrella `morado`.
 *
 * DM Mono SOLO en la cifra; etiqueta, aclaración y fuente en DM Sans.
 *
 * `numero` anima el conteo con `NumeroAnimado` (respeta menos movimiento y el
 * HTML del servidor ya trae el valor final). Sin `numero` la cifra es texto,
 * como «<5» o «—». El texto accesible va en `sr-only`: el conteo es
 * `aria-hidden` para que un lector de pantalla no lea números intermedios.
 */
const TONO_DIA = { sodio: 'text-tinta', estrella: 'text-tinta', ladrillo: 'text-morado-texto' } as const;
const TONO_NOCHE = {
  sodio: '[.modo-noche_&]:text-sodio',
  estrella: '[.modo-noche_&]:text-estrella',
  ladrillo: '[.modo-noche_&]:text-ladrillo',
} as const;

export function Kpi({
  valor,
  numero,
  decimales = 0,
  sufijo = '',
  etiqueta,
  fuente,
  fecha,
  aclaracion,
  enlace,
  tono = 'sodio',
}: {
  valor: string;
  numero?: number;
  decimales?: number;
  sufijo?: string;
  etiqueta: string;
  /** Sin `fuente`, la pone el `GrupoCifras` que lo contiene (una línea para el grupo). */
  fuente?: string;
  fecha?: string;
  /** Texto, o un enlace corto (p. ej. «Ver y proponer») cuando la cifra lleva a otra pantalla. */
  aclaracion?: React.ReactNode;
  /** Acción propia de la cifra (p. ej. «Verlas»), de 44 px. */
  enlace?: { href: string; texto: string };
  /** Énfasis de la cifra: `ladrillo` para lo que pide atención. De día, `sodio` y `estrella` son `tinta`. */
  tono?: 'sodio' | 'estrella' | 'ladrillo';
}) {
  return (
    <div className="relative flex min-w-0 flex-col rounded-xl border border-tinta/12 bg-hueso p-4 pr-11 sm:p-5 sm:pr-12 [.modo-noche_&]:border-trazo [.modo-noche_&]:bg-noche-2">
      <Estrella
        tamano={20}
        color="currentColor"
        className="absolute right-4 top-4 text-morado [.modo-noche_&]:text-sodio"
      />
      <p
        className={`font-cifra text-4xl font-medium leading-none tabular-nums sm:text-5xl ${TONO_DIA[tono]} ${TONO_NOCHE[tono]}`}
      >
        <span className="sr-only">
          {valor}
          {sufijo}
        </span>
        {numero === undefined ? (
          <span aria-hidden="true">
            <CifraLimpia texto={`${valor}${sufijo}`} />
          </span>
        ) : (
          <NumeroAnimado numero={numero} decimales={decimales} sufijo={sufijo} />
        )}
      </p>
      <p className="mt-3 font-sans text-base font-medium leading-snug text-tinta">{etiqueta}</p>
      {aclaracion && (
        <div className="mt-1 font-sans text-sm leading-snug text-tinta/70 [.modo-noche_&]:text-tenue">{aclaracion}</div>
      )}
      {enlace && (
        <Link
          href={enlace.href}
          className="mt-2 inline-flex min-h-[44px] w-fit items-center font-sans text-sm text-azul-texto underline underline-offset-4 [.modo-noche_&]:text-sodio"
        >
          {enlace.texto}
        </Link>
      )}
      {fuente && (
        <p className="mt-auto break-words pt-3 font-sans text-xs leading-relaxed text-tinta/70 [.modo-noche_&]:text-tenue">
          Fuente: {fuente}
          {fecha ? ` · ${fecha}` : ''}
        </p>
      )}
    </div>
  );
}

const COLUMNAS = {
  2: 'min-[400px]:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'min-[400px]:grid-cols-2 lg:grid-cols-4',
} as const;

/**
 * Varias cifras con UNA línea de fuente debajo (DESIGN.md › Reglas de cifras):
 * si comparten fuente y fecha, repetirlas bajo cada una solo llena la pantalla
 * de letra chica. Los `Kpi` de adentro van sin `fuente`; uno que venga de otro
 * lado lleva la suya y la línea del grupo dice de dónde salen las demás.
 */
export function GrupoCifras({
  children,
  fuente,
  fecha,
  columnas = 4,
  etiqueta,
  className = '',
}: {
  children: React.ReactNode;
  /** Texto o nodo (puede llevar un enlace a la fuente). Va después de «Fuente:». */
  fuente: React.ReactNode;
  fecha?: string;
  columnas?: 2 | 3 | 4;
  /** Nombre del grupo para el lector de pantalla, si no lo da un título cercano. */
  etiqueta?: string;
  className?: string;
}) {
  return (
    <div role={etiqueta ? 'group' : undefined} aria-label={etiqueta} className={`min-w-0 ${className}`}>
      <div className={`grid grid-cols-1 gap-3 sm:gap-4 ${COLUMNAS[columnas]}`}>{children}</div>
      <p className="mt-3 break-words font-sans text-xs leading-relaxed text-tinta/70 [.modo-noche_&]:text-tenue">
        Fuente: {fuente}
        {fecha ? ` · ${fecha}` : ''}
      </p>
    </div>
  );
}
