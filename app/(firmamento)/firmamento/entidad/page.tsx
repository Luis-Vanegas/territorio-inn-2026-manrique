import type { Metadata } from 'next';

import { leerFirmamento } from '@/app/(site)/firmamento/datos';
import { GrupoCifras, Kpi } from '@/components/firmamento/Kpi';
import { MapaBarrios } from '@/components/firmamento/MapaBarrios';
import { Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { VentanaNoche } from '@/components/firmamento/VentanaNoche';
import { exigirEntidad } from '@/lib/auth/firmamento';
import { listarConvocatoriasVigentes } from '@/lib/db/convocatorias.repo';
import { CAMARA_EMPRESAS, INFORMALIDAD, TERRITORIO, type CifraConFuente } from '@/lib/cifras';
import { fechaHoyBogota, formatearNumero as fmt } from '@/lib/formato';
import { fechaLarga } from '@/lib/geo/constelaciones';
import { CELDA_PEQUENA } from '@/lib/privacidad/kAnonimato';
import { ComposicionRed } from './_components/ComposicionRed';
import { ObservatorioCielo } from './_components/ObservatorioCielo';

export const metadata: Metadata = { title: 'Observatorio' };

// La sesión y la base se leen en cada carga.
export const dynamic = 'force-dynamic';

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
  await exigirEntidad();

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
  const fechaCorrida = fechaLarga(osm.fechaCorrida);

  // Aliados: la cifra sale de los datos abiertos; con menos de 5 es «<5», no un cero.
  const aliados = datosRed?.negocios_aprobados;
  const kpiRed =
    datosRed && typeof aliados === 'number'
      ? { valor: fmt(aliados), numero: aliados as number | undefined, nota: undefined as string | undefined }
      : datosRed
        ? { valor: CELDA_PEQUENA, numero: undefined, nota: 'Con menos de 5 no publicamos la cifra exacta.' }
        : { valor: '—', numero: undefined, nota: 'No pudimos consultar este dato ahora. Vuelve a intentarlo en unos minutos.' };

  // Una sola línea de fuente para la banda: cada cifra viene de un lado y la línea dice de dónde.
  const fuenteBanda = (
    <>
      aliados, datos abiertos de Constelaciones con la regla k = 5
      {datosRed ? ` (consultado el ${fechaLarga(datosRed.generado_en)})` : ' (sin consulta en este momento)'}; locales
      y constelaciones, OpenStreetMap © colaboradores (ODbL), datos al {fechaOsm} y agrupados con HDBSCAN el{' '}
      {fechaCorrida}; convocatorias, aprobadas por el equipo.
    </>
  );

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
      <p className="max-w-3xl font-sans text-base leading-relaxed text-tinta/70">
        Aquí ves la red como la ve Constelaciones: solo conteos, nunca un negocio por su nombre. Toda cifra con menos
        de 5 negocios sale como «{CELDA_PEQUENA}».
      </p>

      <VentanaNoche titulo="La red y el territorio hoy" id="cifras-principales">
        <GrupoCifras fuente={fuenteBanda} fecha={fechaHoyBogota()}>
          <Kpi
            valor={kpiRed.valor}
            numero={kpiRed.numero}
            etiqueta="aliados en la red"
            aclaracion={kpiRed.nota}
          />
          <Kpi
            valor={fmt(osm.totalComercios)}
            numero={osm.totalComercios}
            tono="estrella"
            etiqueta="locales en el mapa abierto"
            aclaracion={`${fmt(osm.conNombre)} con nombre y ${fmt(osm.sinNombre)} sin nombre.`}
          />
          <Kpi
            valor={fmt(osm.constelaciones)}
            numero={osm.constelaciones}
            tono="ladrillo"
            etiqueta="constelaciones comerciales"
            aclaracion={`${fmt(osm.sueltos)} locales sueltos, fuera de toda constelación.`}
          />
          <Kpi
            valor={vigentes ? fmt(vigentes.length) : '—'}
            numero={vigentes ? vigentes.length : undefined}
            etiqueta="convocatorias abiertas ahora"
            aclaracion={vigentes ? undefined : 'No pudimos consultarlas ahora. Vuelve a intentarlo en unos minutos.'}
            enlace={vigentes ? { href: '/firmamento/entidad/convocatorias', texto: 'Ver y proponer' } : undefined}
          />
        </GrupoCifras>
      </VentanaNoche>

      <ObservatorioCielo filas={d.filas} osmBase={osm.osmBase} fechaCorrida={osm.fechaCorrida} />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <ComposicionRed datos={datosRed} />

        <Tarjeta titulo="El territorio, con su fuente" id="contexto-titulo" plegable resumen="Cámara, DANE y más">
          <p className="max-w-3xl font-sans text-sm leading-relaxed text-tinta/70">
            Cifras de otras entidades para leer la red en contexto. No se comparan como porcentaje: la Cámara de
            Comercio cuenta empresas con registro, OpenStreetMap los locales que alguien mapeó y la red solo a quienes
            se registraron aquí.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <KpiDe c={CAMARA_EMPRESAS} />
            {TERRITORIO.map((c) => (
              <KpiDe key={c.etiqueta} c={c} />
            ))}
            {INFORMALIDAD.map((c) => (
              <KpiDe key={c.etiqueta} c={c} />
            ))}
          </div>
        </Tarjeta>
      </div>

      {/* Comercios de OSM por barrio (públicos): la cobertura de aliados por barrio respeta k = 5 y no se pinta aquí. */}
      <Tarjeta titulo="Los 15 barrios" id="barrios" plegable resumen="comercios mapeados por barrio">
        <VentanaNoche>
          <MapaBarrios
            marco={false}
            filas={d.barrios}
            cifra="comercios"
            descripcion="Comercios mapeados en OpenStreetMap por barrio oficial de la Comuna 3, de más a menos"
            fuente={`Fuente: OpenStreetMap, © colaboradores (ODbL) · datos al ${fechaOsm} · barrios: Alcaldía de Medellín`}
          />
        </VentanaNoche>
      </Tarjeta>
    </div>
  );
}
