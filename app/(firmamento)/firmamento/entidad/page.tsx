import type { Metadata } from 'next';
import Link from 'next/link';

import { leerFirmamento } from '@/app/(site)/firmamento/datos';
import { Kpi } from '@/components/firmamento/Kpi';
import { ScrollReveal } from '@/components/ScrollReveal';
import { VentanaNoche } from '@/components/firmamento/VentanaNoche';
import { exigirEntidad } from '@/lib/auth/firmamento';
import { listarConvocatoriasVigentes } from '@/lib/db/convocatorias.repo';
import { CAMARA_EMPRESAS, INFORMALIDAD, TERRITORIO, type CifraConFuente } from '@/lib/cifras';
import { fechaHoyBogota, formatearNumero as fmt } from '@/lib/formato';
import { fechaLarga } from '@/lib/geo/constelaciones';
import { CELDA_PEQUENA } from '@/lib/privacidad/kAnonimato';
import { ComposicionRed } from './_components/ComposicionRed';
import { EncabezadoEntidad } from './_components/EncabezadoEntidad';
import { ObservatorioCielo } from './_components/ObservatorioCielo';

export const metadata: Metadata = { title: 'Observatorio' };

// La sesión y la base se leen en cada carga.
export const dynamic = 'force-dynamic';

const FUENTE_OSM = 'OpenStreetMap, © colaboradores (ODbL)';
const FUENTE_RED = 'Constelaciones · Manrique, aliados aprobados por moderación (datos abiertos, regla k = 5)';

function KpiDe({ c }: { c: CifraConFuente }) {
  return (
    <Kpi
      valor={c.valor}
      numero={c.numero}
      decimales={c.decimales}
      sufijo={c.sufijo}
      etiqueta={c.etiqueta}
      aclaracion={c.aclaracion}
      fuente={c.fuente}
      fecha={c.fecha}
    />
  );
}

/**
 * Observatorio de la entidad: SOLO agregados con k = 5. Todo sale de
 * `leerFirmamento` (el mismo que alimenta /firmamento: `obtenerDatosAbiertos`
 * para la red y el JSON de OpenStreetMap para el territorio) y de las
 * convocatorias aprobadas. Esta página no importa ningún repo de negocios, y
 * `scripts/verificar-entidades.mjs` lo comprueba.
 */
export default async function EntidadObservatorioPage() {
  const contexto = await exigirEntidad();

  const [d, vigentes] = await Promise.all([
    leerFirmamento(),
    listarConvocatoriasVigentes().catch((e) => {
      console.error('[entidad] no se pudieron leer las convocatorias vigentes', e);
      return null;
    }),
  ]);
  const { osm, red } = d;
  const datosRed = red.datos;

  const fechaOsm = fechaLarga(osm.osmBase);
  const agrupado = `agrupados el ${fechaLarga(osm.fechaCorrida)}`;

  // Aliados: la cifra sale de los datos abiertos; con menos de 5 es «<5», no un cero.
  const aliados = datosRed?.negocios_aprobados;
  const kpiRed =
    datosRed && typeof aliados === 'number'
      ? { valor: fmt(aliados), numero: aliados as number | undefined, nota: undefined as string | undefined }
      : datosRed
        ? { valor: CELDA_PEQUENA, numero: undefined, nota: 'Con menos de 5 no publicamos la cifra exacta.' }
        : { valor: '—', numero: undefined, nota: 'No pudimos consultar este dato ahora. Vuelve a intentarlo en unos minutos.' };
  const fechaRed = datosRed ? `consultado el ${fechaLarga(datosRed.generado_en)}` : 'sin consulta en este momento';

  return (
    <div className="mx-auto max-w-[1280px]">
      <EncabezadoEntidad entidad={contexto.nombre}>
        Aquí ves la red como la ve Constelaciones: solo conteos, nunca un negocio por su nombre. Toda cifra
        con menos de 5 negocios sale como «{CELDA_PEQUENA}».
      </EncabezadoEntidad>

      {/* Cifras de fuentes distintas: cada una lleva la suya (no hay GrupoCifras). */}
      <VentanaNoche titulo="La red y el territorio hoy" id="cifras-principales">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            valor={kpiRed.valor}
            numero={kpiRed.numero}
            etiqueta="aliados en la red"
            aclaracion={kpiRed.nota}
            fuente={FUENTE_RED}
            fecha={fechaRed}
          />
          <Kpi
            valor={fmt(osm.totalComercios)}
            numero={osm.totalComercios}
            tono="estrella"
            etiqueta="locales en el mapa abierto"
            aclaracion={`${fmt(osm.conNombre)} con nombre y ${fmt(osm.sinNombre)} sin nombre.`}
            fuente={FUENTE_OSM}
            fecha={`datos al ${fechaOsm}`}
          />
          <Kpi
            valor={fmt(osm.constelaciones)}
            numero={osm.constelaciones}
            tono="ladrillo"
            etiqueta="constelaciones comerciales"
            aclaracion={`${fmt(osm.sueltos)} locales sueltos, fuera de toda constelación.`}
            fuente="HDBSCAN sobre los comercios de OpenStreetMap"
            fecha={agrupado}
          />
          <Kpi
            valor={vigentes ? fmt(vigentes.length) : '—'}
            numero={vigentes ? vigentes.length : undefined}
            etiqueta="convocatorias abiertas ahora"
            aclaracion={
              vigentes ? (
                <Link
                  href="/firmamento/entidad/convocatorias"
                  className="inline-flex min-h-[44px] items-center text-sodio underline underline-offset-4"
                >
                  Ver y proponer
                </Link>
              ) : (
                'No pudimos consultarlas ahora. Vuelve a intentarlo en unos minutos.'
              )
            }
            fuente="Constelaciones · Manrique, convocatorias aprobadas por el equipo"
            fecha={`consultado el ${fechaHoyBogota()}`}
          />
        </div>
      </VentanaNoche>

      <div className="mt-8">
        <ObservatorioCielo
          filas={d.filas}
          osmBase={osm.osmBase}
          fechaCorrida={osm.fechaCorrida}
          composicion={<ComposicionRed datos={datosRed} />}
        />
      </div>

      <section aria-labelledby="contexto-titulo" className="mt-12">
        <ScrollReveal>
          <h2 id="contexto-titulo" className="font-display text-2xl font-medium text-tinta sm:text-3xl">
            El territorio, con su fuente
          </h2>
          <p className="mt-2 max-w-3xl font-sans text-base leading-relaxed text-tinta/70">
            Cifras de otras entidades para leer la red en contexto. No se comparan como porcentaje: la
            Cámara de Comercio cuenta empresas con registro, OpenStreetMap los locales que alguien mapeó y
            la red solo a quienes se registraron aquí.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiDe c={CAMARA_EMPRESAS} />
            {TERRITORIO.map((c) => (
              <KpiDe key={c.etiqueta} c={c} />
            ))}
            {INFORMALIDAD.map((c) => (
              <KpiDe key={c.etiqueta} c={c} />
            ))}
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
