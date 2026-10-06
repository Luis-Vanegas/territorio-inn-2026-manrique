import Link from 'next/link';

import { MapaAliados } from '@/components/MapaAliados';
import { CLASE_BOTON_PANEL, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import type { EntornoNegocio } from '@/lib/firmamento/entorno';
import { formatearNumero } from '@/lib/formato';
import { etiquetaConstelacion } from '@/lib/geo/comerciosOsm';
import { formatearDistancia } from '@/lib/geo/distancia';

/**
 * «Dónde estás» del inicio: el mismo mapa de siempre, acercado al punto del
 * negocio, y en texto lo mismo que dice «Mi constelación» (las cuentas salen de
 * `entornoDeNegocio`). El texto es la alternativa del mapa: quien no lo ve sabe
 * igual en qué grupo está y cuántos negocios tiene cerca.
 */
export function DondeEstas({
  entorno,
  portafolioId,
}: {
  entorno: EntornoNegocio;
  portafolioId: string;
}) {
  const { constelacion, aliadosCerca, comerciosCerca, cercanas, enElMapa } = entorno;
  const masCercana = constelacion ? null : cercanas[0] ?? null;
  const aliados = aliadosCerca.length;
  const comercios = comerciosCerca.length;

  return (
    <Tarjeta
      titulo="Dónde estás"
      id="donde-estas"
      resumen={constelacion ? 'en una constelación' : 'estrella suelta'}
    >
      <p className="font-sans text-base leading-relaxed text-tinta">
        {constelacion ? (
          <>Eres parte de {etiquetaConstelacion(constelacion)}.</>
        ) : (
          <>
            Por ahora eres una estrella suelta
            {masCercana && (
              <>
                : la constelación más cercana, {masCercana.constelacion.codigo ?? 'otra'}, está a{' '}
                <span className="tabular-nums">{formatearDistancia(masCercana.metros)}</span>
              </>
            )}
            .
          </>
        )}
      </p>
      <p className="mt-1 font-sans text-sm leading-relaxed text-tinta/70">
        <span className="tabular-nums">{formatearNumero(aliados)}</span>{' '}
        {aliados === 1 ? 'aliado' : 'aliados'} a menos de 1,5 km
        {constelacion && (
          <>
            {' '}y <span className="tabular-nums">{formatearNumero(comercios)}</span>{' '}
            {comercios === 1 ? 'comercio' : 'comercios'} de OpenStreetMap en tu constelación
          </>
        )}
        .
      </p>

      <div className="mt-4">
        <MapaAliados
          portafolios={enElMapa}
          seleccionado={portafolioId}
          alto="h-[280px] sm:h-[340px]"
          hrefLista="/firmamento/negocio/constelacion#lista-aliados-cerca"
        />
      </div>

      <Link href="/firmamento/negocio/constelacion" className={`${CLASE_BOTON_PANEL} mt-4`}>
        Mi constelación
      </Link>
    </Tarjeta>
  );
}
