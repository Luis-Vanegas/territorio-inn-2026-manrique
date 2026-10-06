import type { Metadata } from 'next';

import { ConfusionDelModelo, F1PorCategoria } from '@/components/firmamento/EvaluacionModelo';
import { GrupoCifras, Kpi } from '@/components/firmamento/Kpi';
import { VentanaNoche } from '@/components/firmamento/VentanaNoche';
import { AprendizajeSugeridor } from '@/components/firmamento/panel/AprendizajeSugeridor';
import { hoyBogota, LineaFuente, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import modeloJson from '@/public/modelo_categoria.json';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { aprendizajeSugeridor } from '@/lib/db/equipo.repo';
import { EVALUACION } from '@/lib/firmamento/evaluacionModelo';
import { OSM } from '@/lib/firmamento/territorio';
import { PruebaSugeridor } from './_components/PruebaSugeridor';

export const metadata: Metadata = { title: 'Modelos' };

export const dynamic = 'force-dynamic';

/**
 * Fichas de los dos modelos del sitio, solo con cifras que existen en archivos
 * o en la base: el clasificador (`public/modelo_categoria.json`; F1 por categoría
 * y matriz de confusión salen de `public/firmamento/modelo_evaluacion.json`,
 * exportado del reporte `pipeline/reporte_modelo.md`), las constelaciones
 * (`public/firmamento/constelaciones.json`) y lo que el sugeridor va
 * aprendiendo del registro (`sugerencias_categoria`). La cifra que se cita es
 * el F1 macro del holdout agrupado por nombre, nunca la del split ingenuo.
 */
const modelo = modeloJson as unknown as {
  tipo: string;
  version: string;
  clases: string[];
  nombres: string[];
  umbral_confianza: number;
  hiperparametros: Record<string, string | number>;
  entrenado_con: number;
  fuente: string;
  fecha_corrida: string;
  semilla: number;
  metricas: {
    f1_macro_holdout: number;
    accuracy_holdout: number;
    f1_macro_linea_base_mayoritaria: number;
    f1_macro_holdout_geografico_comuna3: number;
    n_holdout: number;
    n_holdout_geografico: number;
  };
};

const dec = (n: number, d = 3) => n.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });
const numero = (n: number) => n.toLocaleString('es-CO');

function Datos({ filas }: { filas: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {filas.map(([t, v]) => (
        <div key={t} className="min-w-0">
          <dt className="font-sans text-sm text-tinta/70">{t}</dt>
          <dd className="mt-0.5 break-words font-sans text-base tabular-nums text-tinta">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function ModelosPage() {
  await exigirEquipo();

  const aprendizaje = await aprendizajeSugeridor();
  const m = modelo.metricas;
  const nombreDe = Object.fromEntries(modelo.clases.map((c, i) => [c, modelo.nombres[i] ?? c]));
  const hoy = hoyBogota();
  const fuenteModelo = `${modelo.fuente}; validación en ${numero(m.n_holdout)} locales apartados, agrupados por nombre`;

  return (
    <div className="flex flex-col gap-6">
      <VentanaNoche
        titulo="Sugeridor de categoría"
        id="titulo-clasificador"
        descripcion={`Propone la categoría desde el nombre del negocio, en el navegador de quien se registra: lo que escribe no sale de su pantalla. Con confianza de ${Math.round(modelo.umbral_confianza * 100)} % o más sugiere una; si no, las tres más probables.`}
      >
        <GrupoCifras fuente={fuenteModelo} fecha={`corrida ${modelo.fecha_corrida.slice(0, 10)}`}>
          <Kpi etiqueta="F1 macro" valor={dec(m.f1_macro_holdout)} aclaracion="Holdout agrupado por nombre" />
          <Kpi etiqueta="Exactitud" valor={dec(m.accuracy_holdout)} aclaracion="En esos mismos locales" />
          <Kpi etiqueta="Línea base" valor={dec(m.f1_macro_linea_base_mayoritaria)} aclaracion="Decir siempre la clase mayoritaria" />
          <Kpi etiqueta="Entrenado con" valor={numero(modelo.entrenado_con)} aclaracion="Locales de OpenStreetMap" />
        </GrupoCifras>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
          <Tarjeta titulo="Qué tan bien acierta cada categoría" id="titulo-f1" plegable abierta>
            <F1PorCategoria evaluacion={EVALUACION} />
          </Tarjeta>
          <Tarjeta titulo="Dónde se equivoca" id="titulo-confusion" plegable>
            <ConfusionDelModelo evaluacion={EVALUACION} />
          </Tarjeta>
        </div>
      </VentanaNoche>

      <Tarjeta titulo="Pruébalo" id="titulo-prueba">
        <p className="mb-4 max-w-prose font-sans text-sm leading-relaxed text-tinta/70">
          Escribe el nombre de un negocio y mira qué categoría propone. Corre en tu navegador: lo que escribes aquí no
          se envía ni se guarda.
        </p>
        <PruebaSugeridor />
      </Tarjeta>

      <Tarjeta titulo="Lo que aprende del registro y de la moderación" id="titulo-aprendizaje" plegable abierta>
        <AprendizajeSugeridor datos={aprendizaje} />
        {aprendizaje.total > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse">
              <caption className="sr-only">Sugerencias por categoría propuesta</caption>
              <thead>
                <tr>
                  <th scope="col" className="py-2 pr-3 text-left font-sans text-xs font-medium text-tinta/70">Categoría propuesta</th>
                  <th scope="col" className="py-2 pr-3 text-right font-sans text-xs font-medium text-tinta/70">Veces</th>
                  <th scope="col" className="py-2 text-right font-sans text-xs font-medium text-tinta/70">Aceptadas</th>
                </tr>
              </thead>
              <tbody>
                {aprendizaje.porCategoria.map((c) => (
                  <tr key={c.categoria}>
                    <th scope="row" className="border-t border-tinta/12 py-2 pr-3 text-left font-sans text-sm font-normal text-tinta">
                      {nombreDe[c.categoria] ?? c.categoria}
                    </th>
                    <td className="border-t border-tinta/12 py-2 pr-3 text-right font-sans text-sm tabular-nums text-tinta">{c.total}</td>
                    <td className="border-t border-tinta/12 py-2 text-right font-sans text-sm tabular-nums text-tinta">{c.aceptadas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 font-sans text-sm leading-relaxed text-tinta/70">
          {numero(aprendizaje.conFicha)} sugerencias traen su ficha y sirven para reentrenar;{' '}
          {numero(aprendizaje.coincidenConFicha)} coinciden con la categoría que la ficha tiene hoy.
        </p>
        <LineaFuente>Fuente: sugerencias del registro y de la moderación en la base de Constelaciones, sin el texto escrito · {hoy}</LineaFuente>
      </Tarjeta>

      <Tarjeta titulo="Detalles del sugeridor" id="titulo-detalles" plegable>
        <Datos
          filas={[
            ['F1 macro entrenado sin la Comuna 3, probado en ella', dec(m.f1_macro_holdout_geografico_comuna3)],
            ['Locales de la Comuna 3 en esa prueba', numero(m.n_holdout_geografico)],
            ['Locales en el holdout', numero(m.n_holdout)],
            ['Modelo', modelo.tipo],
            ['Hiperparámetros', Object.entries(modelo.hiperparametros).map(([k, v]) => `${k} = ${v}`).join(' · ')],
            ['Semilla', String(modelo.semilla)],
          ]}
        />
        <h3 className="mt-6 font-sans text-base font-medium text-tinta">Las {modelo.clases.length} categorías que conoce</h3>
        <p className="mt-2 font-sans text-sm leading-relaxed text-tinta/70">{modelo.nombres.join(' · ')}</p>
        <LineaFuente>
          Fuente: {modelo.fuente} · corrida {modelo.fecha_corrida.slice(0, 10)}
        </LineaFuente>
      </Tarjeta>

      <Tarjeta titulo="Constelaciones" id="titulo-constelaciones" plegable resumen={`${numero(OSM.resumen.constelaciones)} grupos`}>
        <p className="max-w-prose font-sans text-base leading-relaxed text-tinta/70">
          Agrupa los comercios de OpenStreetMap por cercanía. Las líneas del mapa son el árbol de expansión mínima
          real de cada grupo, no un dibujo.
        </p>
        <div className="mt-5">
          <Datos
            filas={[
              ['Algoritmo', OSM.metodo.algoritmo],
              ['Tamaño mínimo de constelación', String(OSM.metodo.min_cluster_size)],
              ['Muestras mínimas', String(OSM.metodo.min_samples)],
              ['Selección', OSM.metodo.cluster_selection_method],
              ['Distancias en', OSM.metodo.crs_distancias],
              ['Comercios', numero(OSM.resumen.total_comercios)],
              ['Constelaciones', numero(OSM.resumen.constelaciones)],
              ['Sueltos', numero(OSM.resumen.puntos_sueltos)],
            ]}
          />
        </div>
        <h3 className="mt-6 font-sans text-base font-medium text-tinta">Qué pasa si cambia el tamaño mínimo</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[22rem] border-collapse">
            <caption className="sr-only">Sensibilidad al tamaño mínimo de constelación</caption>
            <thead>
              <tr>
                {['Selección', 'Tamaño mínimo', 'Constelaciones', 'Sueltos', 'La mayor'].map((t) => (
                  <th key={t} scope="col" className="py-2 pr-3 text-left font-sans text-xs font-medium text-tinta/70">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OSM.sensibilidad_min_cluster_size.map((s) => {
                const usada =
                  s.seleccion === OSM.metodo.cluster_selection_method && s.min_cluster_size === OSM.metodo.min_cluster_size;
                return (
                  <tr key={`${s.seleccion}-${s.min_cluster_size}`} className={usada ? 'bg-tinta/5' : undefined}>
                    <td className="border-t border-tinta/12 py-2 pr-3 font-sans text-sm text-tinta">
                      {s.seleccion}
                      {usada && <span className="font-medium text-morado-texto"> · la usada</span>}
                    </td>
                    <td className="border-t border-tinta/12 py-2 pr-3 font-sans text-sm tabular-nums text-tinta">{s.min_cluster_size}</td>
                    <td className="border-t border-tinta/12 py-2 pr-3 font-sans text-sm tabular-nums text-tinta">{s.constelaciones}</td>
                    <td className="border-t border-tinta/12 py-2 pr-3 font-sans text-sm tabular-nums text-tinta">{s.puntos_sueltos}</td>
                    <td className="border-t border-tinta/12 py-2 pr-3 font-sans text-sm tabular-nums text-tinta">{s.cumulo_mayor}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <LineaFuente>
          Fuente: {OSM.fuente} · base OSM {OSM.osm_base.slice(0, 10)} · corrida {OSM.fecha_corrida.slice(0, 10)}
        </LineaFuente>
      </Tarjeta>
    </div>
  );
}
