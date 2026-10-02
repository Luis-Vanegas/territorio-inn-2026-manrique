import type { Metadata } from 'next';

import { ScrollReveal } from '@/components/ScrollReveal';
import { CieloConstelaciones } from '@/components/firmamento/CieloConstelaciones';
import { Horizonte } from '@/components/firmamento/Horizonte';
import { IndiceSecciones, type EntradaIndice } from '@/components/firmamento/IndiceSecciones';
import { Kpi } from '@/components/firmamento/Kpi';
import { MapaYTabla } from '@/components/firmamento/MapaYTabla';
import { Seccion } from '@/components/firmamento/Seccion';
import { Sugeridor } from '@/components/firmamento/Sugeridor';
import { fechaLarga } from '@/lib/geo/constelaciones';
import { CELDA_PEQUENA } from '@/lib/privacidad/kAnonimato';
import {
  CAMARA_EMPRESAS,
  INFORMALIDAD,
  TEJIDO_CAMARA,
  TERRITORIO,
  type CifraConFuente,
} from './cifras';
import { leerFirmamento } from './datos';

export const metadata: Metadata = {
  title: 'Firmamento · Constelaciones',
  description:
    'Los datos del territorio de la Comuna 3, Manrique: cada negocio es una estrella y cada cuadra comercial, una constelación. Datos abiertos con su fuente y su fecha.',
};

// Lee la base (aliados) y la sesión del layout: se renderiza por request, igual
// que el resto de rutas públicas. Las lecturas van cacheadas en sus repos.
export const dynamic = 'force-dynamic';

const INDICE: EntradaIndice[] = [
  { id: 'cielo', letra: 'α', nombre: 'El cielo de hoy' },
  { id: 'mapa', letra: 'β', nombre: 'Mapa estelar' },
  { id: 'constelaciones', letra: 'γ', nombre: 'Constelaciones' },
  { id: 'brecha', letra: 'δ', nombre: 'La brecha' },
  { id: 'sugeridor', letra: 'ε', nombre: 'Sugeridor' },
  { id: 'indicadores', letra: 'ζ', nombre: 'Indicadores' },
  { id: 'metodo', letra: 'η', nombre: 'Qué hay detrás' },
];

const fmt = (n: number, decimales = 0) =>
  n.toLocaleString('es-CO', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

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

function Panel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 border border-trazo bg-noche-2 p-5">
      <h3 className="font-sans text-lg font-medium text-estrella">{titulo}</h3>
      {children}
    </div>
  );
}

export default async function FirmamentoPage() {
  const d = await leerFirmamento();
  const { osm, red, modelo } = d;
  const datosRed = red.datos;

  const fechaOsm = fechaLarga(osm.osmBase);
  const fuenteOsm = 'OpenStreetMap, © colaboradores (ODbL)';
  const pctSueltos = (osm.sueltos / osm.totalComercios) * 100;

  // Aliados en la red: sale de los datos abiertos (regla k = 5), no se escribe a mano.
  const aliados = datosRed?.negocios_aprobados;
  const fuenteRed = 'Constelaciones · Manrique, aliados aprobados por moderación (datos abiertos, regla k = 5)';
  const kpiRed =
    datosRed && typeof aliados === 'number'
      ? {
          valor: fmt(aliados),
          numero: aliados,
          aclaracion: undefined,
          fecha: `consultado el ${fechaLarga(datosRed.generado_en)}`,
        }
      : datosRed
        ? {
            valor: CELDA_PEQUENA,
            numero: undefined,
            aclaracion: 'Con menos de 5 no publicamos la cifra exacta (mira la nota de la sección δ).',
            fecha: `consultado el ${fechaLarga(datosRed.generado_en)}`,
          }
        : {
            valor: '—',
            numero: undefined,
            aclaracion: 'No pudimos consultar este dato ahora. Vuelve a intentarlo en unos minutos.',
            fecha: 'sin consulta en este momento',
          };

  const categoriasRed = datosRed?.por_categoria ?? [];
  const categoriasOcultas = categoriasRed.filter((c) => c.negocios === CELDA_PEQUENA).length;

  const textoCielo = `Mapa esquemático de la Comuna 3: ${osm.totalComercios} comercios de OpenStreetMap como estrellas y ${osm.constelaciones} constelaciones unidas por líneas.`;

  return (
    <main className="modo-noche min-h-screen bg-noche font-sans text-estrella">
      <header className="margen-editorial pt-10 sm:pt-14">
        <p className="flex items-center gap-2.5 font-sans text-xs uppercase tracking-[0.12em] text-tenue">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rotate-45 bg-sodio" />
          Constelaciones · Manrique · Comuna 3
        </p>
        <h1 className="mt-5 font-italica text-[clamp(2.75rem,13vw,8rem)] font-light leading-[0.95] tracking-tight text-estrella">
          Firma
          <b className="font-display font-semibold not-italic text-sodio">mento</b>
        </h1>
        <p className="mt-5 max-w-3xl font-display text-xl leading-snug text-estrella sm:text-2xl">
          El tablero de datos de Constelaciones. Cada negocio es una estrella; cuando se juntan en una
          cuadra, forman una constelación. Aquí ves el cielo de la economía de Manrique con datos reales
          y abiertos.
        </p>
        <p className="mt-4 font-cifra text-sm leading-relaxed text-tenue">
          Datos de OpenStreetMap al {fechaOsm}
        </p>
        <p className="mt-6 max-w-3xl font-sans text-sm leading-relaxed text-tenue">
          Cada luz del horizonte es uno de los {osm.totalComercios} comercios mapeados en OpenStreetMap,
          de oeste a este.
        </p>
      </header>
      <div className="mt-3">
        <Horizonte posiciones={d.posicionesHorizonte} />
      </div>

      <IndiceSecciones entradas={INDICE} />

      {/* α · El cielo de hoy */}
      <Seccion
        id="cielo"
        letra="α"
        titulo="El cielo de hoy"
        descripcion="Lo que ya se puede medir del territorio sin pedirle un solo dato sensible a ningún negocio."
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
          <ScrollReveal>
            <div className="grid gap-4 sm:grid-cols-2">
              <Kpi
                valor={fmt(osm.totalComercios)}
                numero={osm.totalComercios}
                etiqueta="comercios mapeados en OpenStreetMap"
                aclaracion={`${fmt(osm.conNombre)} con nombre y ${fmt(osm.sinNombre)} sin nombre.`}
                fuente={fuenteOsm}
                fecha={`datos al ${fechaOsm}`}
              />
              <Kpi
                valor={fmt(osm.constelaciones)}
                numero={osm.constelaciones}
                tono="estrella"
                etiqueta="constelaciones de comercios"
                aclaracion={`Grupos de al menos ${osm.minCluster} comercios vecinos.`}
                fuente="HDBSCAN sobre los comercios de OpenStreetMap"
                fecha={`agrupados el ${fechaLarga(osm.fechaCorrida)}`}
              />
              <Kpi
                valor={fmt(osm.sueltos)}
                numero={osm.sueltos}
                tono="ladrillo"
                etiqueta="comercios sueltos, fuera de toda constelación"
                aclaracion={`${fmt(pctSueltos, 1)} % de los comercios mapeados.`}
                fuente="HDBSCAN sobre los comercios de OpenStreetMap"
                fecha={`agrupados el ${fechaLarga(osm.fechaCorrida)}`}
              />
              <Kpi
                valor={kpiRed.valor}
                numero={kpiRed.numero}
                etiqueta="aliados en la red de Constelaciones"
                aclaracion={kpiRed.aclaracion}
                fuente={fuenteRed}
                fecha={kpiRed.fecha}
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="border border-trazo bg-noche-2 p-4 sm:p-6">
              <CieloConstelaciones cielo={d.cielo} descripcion={textoCielo} />
              <p className="mt-4 font-sans text-sm leading-relaxed text-tenue">
                Cada estrella es un comercio y cada línea une a los de una misma constelación. Es el
                mapa de más abajo, sin las calles.
              </p>
              <p className="mt-2 font-cifra text-xs leading-relaxed text-tenue">
                Fuente: {fuenteOsm} · datos al {fechaOsm}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </Seccion>

      {/* β · Mapa estelar y γ · Constelaciones (comparten la constelación elegida) */}
      <MapaYTabla
        portafolios={red.portafolios}
        filas={d.filas}
        barras={d.barras}
        totalComercios={osm.totalComercios}
        osmBase={osm.osmBase}
        fechaCorrida={osm.fechaCorrida}
      />

      {/* δ · La brecha */}
      <Seccion
        id="brecha"
        letra="δ"
        titulo="La brecha de visibilidad"
        descripcion="Tres miradas al mismo territorio. La distancia entre ellas es nuestra línea base."
      >
        <ScrollReveal>
          <h3 className="sr-only">Las tres miradas</h3>
          <div className="grid gap-4 lg:grid-cols-3">
            <KpiDe c={CAMARA_EMPRESAS} />
            <Kpi
              valor={fmt(osm.totalComercios)}
              numero={osm.totalComercios}
              etiqueta="comercios mapeados en OpenStreetMap"
              fuente={fuenteOsm}
              fecha={`datos al ${fechaOsm}`}
            />
            <Kpi
              valor={kpiRed.valor}
              numero={kpiRed.numero}
              etiqueta="aliados en la red de Constelaciones"
              aclaracion={kpiRed.aclaracion}
              fuente={fuenteRed}
              fecha={kpiRed.fecha}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <p className="mt-6 max-w-3xl border-l-4 border-sodio pl-4 font-sans text-base leading-relaxed text-estrella">
            Estas tres cifras no son comparables como porcentaje. La Cámara de Comercio cuenta empresas
            con registro mercantil y deja por fuera buena parte de lo informal; OpenStreetMap cuenta los
            locales que algún voluntario mapeó; la red cuenta solo a quienes se registraron aquí. Por eso
            no dividimos una entre otra: las ponemos lado a lado para ver qué falta por mirar.
          </p>
        </ScrollReveal>

        {categoriasRed.length > 0 && (
          <ScrollReveal>
            <div className="mt-10">
              <h3 className="font-sans text-lg font-medium text-estrella">La red, por categoría</h3>
              <ul className="mt-3 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                {categoriasRed.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-baseline justify-between gap-4 border-b border-trazo py-2.5 font-sans text-base text-estrella"
                  >
                    <span className="min-w-0 break-words">{c.nombre}</span>
                    <span className="shrink-0 font-cifra tabular-nums text-sodio">{c.negocios}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 max-w-3xl font-sans text-sm leading-relaxed text-tenue">
                «{CELDA_PEQUENA}» quiere decir que hay menos de 5 negocios. No publicamos el número exacto
                porque con tan pocos podría reconocerse a una persona (Ley 1581 de 2012). Cuando se oculta
                una celda también se oculta la menor de las visibles, para que nadie pueda deducirla
                restando del total.
              </p>
              <p className="mt-2 font-cifra text-xs leading-relaxed text-tenue">
                Fuente: {fuenteRed} · consultado el {fechaLarga(datosRed!.generado_en)}
              </p>
            </div>
          </ScrollReveal>
        )}
      </Seccion>

      {/* ε · Sugeridor */}
      <Seccion
        id="sugeridor"
        letra="ε"
        titulo="Sugeridor de categoría"
        descripcion="Un modelo de aprendizaje automático entrenado con datos abiertos. Corre aquí mismo, en tu navegador."
      >
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <Sugeridor umbralPorcentaje={modelo.umbralPorcentaje} />

          <Panel titulo="¿Qué tan bien funciona?">
            <p className="mt-3 font-sans text-base leading-relaxed text-estrella">
              Se entrenó con {fmt(modelo.entrenadoCon)} comercios con nombre de OpenStreetMap en el Valle
              de Aburrá y se midió con comercios que no vio al entrenar.
            </p>
            <div className="mt-4 overflow-x-auto border border-trazo">
              <table className="w-full border-collapse text-left font-sans text-sm text-estrella">
                <caption className="sr-only">
                  Resultados del sugeridor de categoría sobre comercios que no vio al entrenar
                </caption>
                <thead className="bg-noche-3 text-tenue">
                  <tr>
                    <th scope="col" className="px-3 py-2.5 font-medium">
                      Medida
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { medida: `F1 macro del modelo (${fmt(modelo.nHoldout)} comercios)`, valor: modelo.f1Macro },
                    {
                      medida: 'F1 macro de una línea base que siempre dice la categoría más común',
                      valor: modelo.f1LineaBase,
                    },
                    { medida: 'Exactitud', valor: modelo.exactitud },
                    {
                      medida: `F1 macro solo en la Comuna 3 (${fmt(modelo.nComuna3)} comercios)`,
                      valor: modelo.f1Comuna3,
                    },
                  ].map(({ medida, valor }) => (
                    <tr key={medida} className="border-t border-trazo">
                      <th scope="row" className="px-3 py-2.5 font-normal">
                        {medida}
                      </th>
                      <td className="px-3 py-2.5 text-right font-cifra tabular-nums text-sodio">
                        {fmt(valor, 3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 font-sans text-sm leading-relaxed text-tenue">
              El F1 macro da el mismo peso a cada categoría, también a las poco frecuentes: por eso queda
              por debajo de la exactitud. Con menos de {modelo.umbralPorcentaje} % de confianza el
              modelo no sugiere una sola: muestra tres y la persona decide.
            </p>
            <p className="mt-2 font-cifra text-xs leading-relaxed text-tenue">
              Fuente: validación con comercios apartados, {fuenteOsm} · modelo entrenado el{' '}
              {fechaLarga(modelo.fecha)}
            </p>
          </Panel>
        </div>
      </Seccion>

      {/* ζ · Indicadores con fuente */}
      <Seccion
        id="indicadores"
        letra="ζ"
        titulo="Indicadores con fuente"
        descripcion="Cifras de otras entidades que ayudan a leer el territorio. Cada una dice de dónde sale y a qué año corresponde."
      >
        <div className="space-y-10">
          <ScrollReveal>
            <h3 className="font-sans text-lg font-medium text-estrella">El territorio</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TERRITORIO.map((c) => (
                <KpiDe key={c.etiqueta} c={c} />
              ))}
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <h3 className="font-sans text-lg font-medium text-estrella">La informalidad</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {INFORMALIDAD.map((c) => (
                <KpiDe key={c.etiqueta} c={c} />
              ))}
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <h3 className="font-sans text-lg font-medium text-estrella">
              Las empresas con registro en Manrique
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TEJIDO_CAMARA.map((c) => (
                <KpiDe key={c.etiqueta} c={c} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </Seccion>

      {/* η · Qué hay detrás */}
      <Seccion
        id="metodo"
        letra="η"
        titulo="Qué hay detrás"
        descripcion="Cómo se hizo este cielo y qué no alcanza a ver."
      >
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <ScrollReveal>
            <Panel titulo="Cómo se hizo">
              <dl className="mt-3 space-y-4 font-sans text-base leading-relaxed text-estrella">
                <div>
                  <dt className="font-medium text-sodio">Los puntos</dt>
                  <dd>
                    Comercios de OpenStreetMap dentro del polígono oficial de la Comuna 3, con y sin
                    nombre. La licencia de los datos es {osm.licencia}.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-sodio">Las constelaciones</dt>
                  <dd>
                    HDBSCAN (selección «{osm.seleccion}»): grupos de mínimo {osm.minCluster} comercios,
                    con {osm.minMuestras} muestras mínimas y distancias medidas en metros. Las líneas son
                    el árbol de expansión mínima de cada grupo; no se dibujan a mano.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-sodio">El sugeridor</dt>
                  <dd>
                    Regresión logística sobre fragmentos de letras del nombre. F1 macro de{' '}
                    {fmt(modelo.f1Macro, 3)} con comercios que no vio al entrenar.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-sodio">La privacidad</dt>
                  <dd>
                    De la red solo publicamos conteos de negocios aprobados. Toda celda con menos de 5
                    sale como «{CELDA_PEQUENA}» (regla k = 5, Ley 1581 de 2012).
                  </dd>
                </div>
              </dl>
              <p className="mt-4 font-cifra text-xs leading-relaxed text-tenue">
                Fuente: {fuenteOsm} · datos al {fechaOsm} · agrupados el {fechaLarga(osm.fechaCorrida)}
              </p>
            </Panel>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <Panel titulo="Lo que este cielo no ve">
              <ul className="mt-3 list-disc space-y-3 pl-5 font-sans text-base leading-relaxed text-estrella marker:text-sodio">
                <li>
                  OpenStreetMap es un mapa voluntario: ve más lo formal y lo que está sobre las vías
                  principales. El comercio en casa o sin letrero puede faltar.
                </li>
                <li>
                  {fmt(osm.sinNombre)} de los {fmt(osm.totalComercios)} comercios no tienen nombre en
                  OpenStreetMap: salen en el mapa y en los conteos, pero no en las listas ni en el
                  buscador.
                </li>
                <li>
                  Las constelaciones son una hipótesis de trabajo, no un hecho: con otros parámetros el
                  algoritmo daría otros grupos. El trabajo en campo las confirma o las corrige.
                </li>
                {osm.sinCalle !== null && osm.sinCalle > 0 && (
                  <li>
                    {fmt(osm.sinCalle)} constelaciones no tienen calle registrada en OpenStreetMap; por eso
                    su nombre dice «Sin calle registrada».
                  </li>
                )}
                {categoriasOcultas > 0 && (
                  <li>
                    Con pocos aliados registrados, {fmt(categoriasOcultas)} de las{' '}
                    {fmt(categoriasRed.length)} categorías de la red salen como «{CELDA_PEQUENA}».
                  </li>
                )}
              </ul>
              <p className="mt-4 font-cifra text-xs leading-relaxed text-tenue">
                Fuente: {fuenteOsm} · datos al {fechaOsm}
              </p>
            </Panel>
          </ScrollReveal>
        </div>
      </Seccion>
    </main>
  );
}
