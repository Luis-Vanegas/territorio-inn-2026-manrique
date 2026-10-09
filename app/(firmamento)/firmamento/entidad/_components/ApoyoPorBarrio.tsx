import { BarrasCategoria } from '@/components/firmamento/BarrasCategoria';
import { LineaFuente, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import type { FilaConstelacion } from '@/app/(site)/firmamento/datos';
import type { FilaBarrio } from '@/lib/db/datos.repo';
import { formatearNumero as fmt } from '@/lib/formato';
import { CELDA_PEQUENA } from '@/lib/privacidad/kAnonimato';

/**
 * «Dónde apoyar primero» por barrio: los barrios con más locales mapeados en
 * OpenStreetMap (públicos), con cuántas constelaciones tienen y cuántos aliados
 * ya hay en la red. Los aliados salen SOLO de `por_barrio` de los datos abiertos,
 * que ya pasó por `suprimir()`: una celda «<5» se escribe «menos de 5», nunca se
 * resta ni se estima. Complementa la lista por constelación de `ObservatorioCielo`.
 */

const MOSTRAR = 5;

function textoAliados(celda: FilaBarrio['negocios'] | undefined): string | null {
  if (celda === undefined) return null;
  if (celda === CELDA_PEQUENA) return 'menos de 5 aliados';
  return celda === 1 ? '1 aliado' : `${fmt(celda)} aliados`;
}

export function ApoyoPorBarrio({
  barrios,
  constelaciones,
  aliadosPorBarrio,
  fechaOsm,
}: {
  barrios: { barrio: string; valor: number }[];
  constelaciones: FilaConstelacion[];
  /** `por_barrio` de los datos abiertos (k = 5), o null si no se pudo consultar. */
  aliadosPorBarrio: FilaBarrio[] | null;
  fechaOsm: string;
}) {
  const primeros = [...barrios]
    .filter((b) => b.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, MOSTRAR);

  const filas = primeros.map((b) => {
    const enBarrio = constelaciones.filter((c) => c.barrio === b.barrio).length;
    const aliados = textoAliados(aliadosPorBarrio?.find((f) => f.nombre === b.barrio)?.negocios);
    const nota = [enBarrio === 1 ? '1 constelación' : `${enBarrio} constelaciones`, aliados].filter(Boolean).join(' · ');
    return { id: b.barrio, nombre: b.barrio, valor: b.valor, nota };
  });

  return (
    <Tarjeta titulo="Dónde apoyar primero, por barrio" id="apoyar-barrio">
      <p className="max-w-3xl font-sans text-sm leading-relaxed text-tinta/70">
        Los {MOSTRAR} barrios con más locales mapeados: ahí una jornada de campo o un taller llega a más negocios. Al
        lado, cuántas constelaciones tiene cada uno y cuántos aliados hay ya en la red.
      </p>
      <BarrasCategoria
        className="mt-4 max-w-3xl"
        filas={filas}
        encabezado="Barrio"
        columna="Locales mapeados"
        descripcion={`Los ${MOSTRAR} barrios de la Comuna 3 con más locales en OpenStreetMap, con sus constelaciones y aliados en la red`}
        vacio="No hay locales mapeados por barrio en este momento."
      />
      {!aliadosPorBarrio && (
        <p className="mt-3 font-sans text-sm text-tinta/70">
          No pudimos consultar los aliados por barrio ahora. Vuelve a intentarlo en unos minutos.
        </p>
      )}
      <LineaFuente>
        Fuente: locales y constelaciones, OpenStreetMap © colaboradores (ODbL), datos al {fechaOsm}; aliados, datos
        abiertos de Constelaciones (las cifras menores que 5 no se publican, para que nadie pueda identificar un negocio); barrios: Alcaldía de Medellín
      </LineaFuente>
    </Tarjeta>
  );
}
