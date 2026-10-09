import { GrupoCifras, Kpi } from '@/components/firmamento/Kpi';
import { Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { TablaFuentesVigia } from '@/components/firmamento/TablaFuentesVigia';
import { fechaHoraBogota, formatearNumero } from '@/lib/formato';
import type { VigiaVista } from '@/lib/firmamento/vigia';

/**
 * «Fuentes del vigía» (panel del equipo › Convocatorias): si cada fuente
 * respondió, cambió o falló en la última corrida, cuántas candidatas trajo y las
 * últimas corridas. Sin datos personales: son páginas públicas de entidades.
 *
 * `vigia` null = la base no respondió (o la migración 036 no está aplicada): se
 * dice, y la cola de convocatorias de abajo sigue funcionando.
 */

const ORIGEN = { actions: 'GitHub Actions', manual: 'a mano' } as const;

export function FuentesVigia({ vigia }: { vigia: VigiaVista | null }) {
  if (!vigia) {
    return (
      <Tarjeta titulo="Fuentes del vigía" id="vigia-titulo" className="mt-8">
        <p className="font-sans text-base text-tinta/70">
          No pudimos consultar el estado del vigía ahora. La cola de convocatorias de abajo no se ve afectada;
          vuelve a intentarlo en unos minutos.
        </p>
      </Tarjeta>
    );
  }

  const { corrida, filas, respondieron, historial } = vigia;
  const fallaron = filas.filter((f) => f.estado && !['responde', 'cambio', 'sin_cambio'].includes(f.estado)).length;

  if (!corrida) {
    return (
      <Tarjeta titulo="Fuentes del vigía" id="vigia-titulo" resumen="aún no ha corrido" className="mt-8">
        <p className="max-w-2xl font-sans text-base leading-relaxed text-tinta/70">
          El vigía revisa cada mañana, a las 6:00 a. m. (hora de Bogotá), las páginas de entidades que publican
          convocatorias. Todavía no ha corrido; cuando lo haga, aquí ves qué encontró en cada fuente.
        </p>
        <TablaFuentesVigia
          filas={filas}
          descripcion="Fuentes que vigila el vigía de convocatorias; todavía sin corrida"
        />
      </Tarjeta>
    );
  }

  return (
    <Tarjeta
      titulo="Fuentes del vigía"
      id="vigia-titulo"
      plegable
      abierta={fallaron > 0}
      resumen={`${respondieron} de ${filas.length} respondieron · ${fechaHoraBogota(corrida.iniciadaEn)}`}
      className="mt-8"
    >
      <GrupoCifras
        columnas={3}
        etiqueta="Resumen de la última corrida del vigía"
        fuente={`vigía de convocatorias (${ORIGEN[corrida.origen]})`}
        fecha={`corrida del ${fechaHoraBogota(corrida.iniciadaEn)}`}
      >
        <Kpi
          valor={`${respondieron}`}
          numero={respondieron}
          etiqueta={`fuentes respondieron, de ${formatearNumero(filas.length)}`}
          aclaracion={fallaron > 0 ? `${fallaron} con fallo: míralas en la tabla.` : 'Ninguna falló.'}
          tono={fallaron > 0 ? 'ladrillo' : 'sodio'}
        />
        <Kpi
          valor={`${corrida.totalNuevas}`}
          numero={corrida.totalNuevas}
          etiqueta="candidatas nuevas por revisar"
          aclaracion="Entraron a «Por revisar»; nada se publica sin tu decisión."
        />
        <Kpi
          valor={`${historial.length}`}
          numero={historial.length}
          etiqueta={historial.length === 1 ? 'corrida guardada' : 'corridas guardadas'}
          aclaracion="Se muestran las últimas 10."
        />
      </GrupoCifras>

      <div className="mt-6">
        <TablaFuentesVigia
          filas={filas}
          conError
          descripcion="Estado de cada fuente del vigía en su última corrida"
        />
      </div>

      {historial.length > 1 && (
        <div className="mt-6">
          <h3 className="font-sans text-base font-medium text-tinta">Últimas corridas</h3>
          <ul className="mt-2 divide-y divide-tinta/12 font-sans text-sm text-tinta/70">
            {historial.map((h) => (
              <li key={h.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2">
                <span>{fechaHoraBogota(h.iniciadaEn)}</span>
                <span>
                  {ORIGEN[h.origen]} · {h.respondieron} de {h.totalFuentes} respondieron · {h.totalNuevas}{' '}
                  {h.totalNuevas === 1 ? 'nueva' : 'nuevas'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Tarjeta>
  );
}
