import type { Metadata } from 'next';

import { ConfusionDelModelo, F1PorCategoria } from '@/components/firmamento/EvaluacionModelo';
import { hoyBogota, LineaFuente, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import modeloJson from '@/public/modelo_categoria.json';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { aprendizajeSugeridor } from '@/lib/db/equipo.repo';
import { EVALUACION } from '@/lib/firmamento/evaluacionModelo';
import { OSM } from '@/lib/firmamento/territorio';

export const metadata: Metadata = { title: 'Modelos' };

export const dynamic = 'force-dynamic';

/**
 * Fichas de los dos modelos del sitio, solo con cifras que existen en archivos
 * o en la base: el clasificador (`public/modelo_categoria.json`; F1 por categoría
 * y matriz de confusión salen de `public/firmamento/modelo_evaluacion.json`,
 * exportado del reporte `pipeline/reporte_modelo.md`), las constelaciones
 * (`public/firmamento/constelaciones.json`) y lo que el sugeridor va
 * aprendiendo del registro (`sugerencias_categoria`).
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
          <dt className="font-sans text-sm text-tenue">{t}</dt>
          <dd className="mt-0.5 break-words font-cifra text-base text-estrella">{v}</dd>
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

  return (
    <div className="flex flex-col gap-6">
      <Tarjeta titulo="Sugeridor de categoría" id="titulo-clasificador">
        <p className="max-w-prose font-sans text-base leading-relaxed text-tenue">
          Propone la categoría a partir del nombre del negocio, en el navegador de
          quien se registra: lo que escribe no sale de su pantalla. Con confianza de{' '}
          <span className="font-cifra text-estrella">{Math.round(modelo.umbral_confianza * 100)} %</span> o más
          sugiere una; si no, muestra las tres más probables.
        </p>
        <div className="mt-5">
          <Datos
            filas={[
              ['F1 macro (holdout agrupado por nombre)', dec(m.f1_macro_holdout)],
              ['Línea base: clase mayoritaria', dec(m.f1_macro_linea_base_mayoritaria)],
              ['Exactitud (holdout)', dec(m.accuracy_holdout)],
              ['Locales en el holdout', numero(m.n_holdout)],
              ['F1 macro entrenado sin la Comuna 3, probado en ella', dec(m.f1_macro_holdout_geografico_comuna3)],
              ['Locales de la Comuna 3 en esa prueba', numero(m.n_holdout_geografico)],
              ['Entrenado con', `${numero(modelo.entrenado_con)} locales`],
              ['Modelo', modelo.tipo],
              ['Hiperparámetros', Object.entries(modelo.hiperparametros).map(([k, v]) => `${k} = ${v}`).join(' · ')],
              ['Semilla', String(modelo.semilla)],
            ]}
          />
        </div>
        <h3 className="mt-6 font-sans text-base font-medium text-estrella">
          Las {modelo.clases.length} categorías que conoce
        </h3>
        <p className="mt-2 font-sans text-sm leading-relaxed text-tenue">{modelo.nombres.join(' · ')}</p>
        <LineaFuente>
          Fuente: {modelo.fuente} · corrida {modelo.fecha_corrida.slice(0, 10)}
        </LineaFuente>
      </Tarjeta>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Tarjeta titulo="Qué tan bien acierta cada categoría" id="titulo-f1">
          <F1PorCategoria evaluacion={EVALUACION} />
        </Tarjeta>
        <Tarjeta titulo="Dónde se equivoca" id="titulo-confusion">
          <ConfusionDelModelo evaluacion={EVALUACION} />
        </Tarjeta>
      </div>

      <Tarjeta titulo="Lo que aprende del registro" id="titulo-aprendizaje">
        {aprendizaje.total === 0 ? (
          <p className="font-sans text-sm leading-relaxed text-tenue">
            Todavía no hay sugerencias registradas. Cada registro guarda qué propuso
            el modelo, con qué confianza y si la persona la aceptó; nunca el texto
            que escribió.
          </p>
        ) : (
          <>
            <Datos
              filas={[
                ['Sugerencias', numero(aprendizaje.total)],
                ['Aceptadas', numero(aprendizaje.aceptadas)],
                ['La persona eligió otra', numero(aprendizaje.corregidas)],
                ['Sin dato de si la aceptó', numero(aprendizaje.sinDato)],
                ['Con ficha enlazada (sirven para reentrenar)', numero(aprendizaje.conFicha)],
                ['Coinciden con la categoría que la ficha tiene hoy', numero(aprendizaje.coincidenConFicha)],
              ]}
            />
            <table className="mt-6 w-full border-collapse">
              <caption className="sr-only">Sugerencias por categoría propuesta</caption>
              <thead>
                <tr>
                  <th scope="col" className="py-2 pr-3 text-left font-sans text-xs font-medium text-tenue">Categoría propuesta</th>
                  <th scope="col" className="py-2 pr-3 text-right font-sans text-xs font-medium text-tenue">Veces</th>
                  <th scope="col" className="py-2 text-right font-sans text-xs font-medium text-tenue">Aceptadas</th>
                </tr>
              </thead>
              <tbody>
                {aprendizaje.porCategoria.map((c) => (
                  <tr key={c.categoria}>
                    <th scope="row" className="border-t border-trazo py-2 pr-3 text-left font-sans text-sm font-normal text-estrella">
                      {nombreDe[c.categoria] ?? c.categoria}
                    </th>
                    <td className="border-t border-trazo py-2 pr-3 text-right font-cifra text-sm text-estrella">{c.total}</td>
                    <td className="border-t border-trazo py-2 text-right font-cifra text-sm text-estrella">{c.aceptadas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <LineaFuente>Fuente: sugerencias del registro en la base de Constelaciones · {hoy}</LineaFuente>
      </Tarjeta>

      <Tarjeta titulo="Constelaciones" id="titulo-constelaciones">
        <p className="max-w-prose font-sans text-base leading-relaxed text-tenue">
          Agrupa los comercios de OpenStreetMap por cercanía. Las líneas del mapa son
          el árbol de expansión mínima real de cada grupo, no un dibujo.
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
        <h3 className="mt-6 font-sans text-base font-medium text-estrella">Qué pasa si cambia el tamaño mínimo</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[22rem] border-collapse">
            <caption className="sr-only">Sensibilidad al tamaño mínimo de constelación</caption>
            <thead>
              <tr>
                {['Selección', 'Tamaño mínimo', 'Constelaciones', 'Sueltos', 'La mayor'].map((t) => (
                  <th key={t} scope="col" className="py-2 pr-3 text-left font-sans text-xs font-medium text-tenue">
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
                  <tr key={`${s.seleccion}-${s.min_cluster_size}`} className={usada ? 'bg-noche-activa' : undefined}>
                    <td className="border-t border-trazo py-2 pr-3 font-sans text-sm text-estrella">
                      {s.seleccion}
                      {usada && <span className="font-medium text-sodio"> · la usada</span>}
                    </td>
                    <td className="border-t border-trazo py-2 pr-3 font-cifra text-sm text-estrella">{s.min_cluster_size}</td>
                    <td className="border-t border-trazo py-2 pr-3 font-cifra text-sm text-estrella">{s.constelaciones}</td>
                    <td className="border-t border-trazo py-2 pr-3 font-cifra text-sm text-estrella">{s.puntos_sueltos}</td>
                    <td className="border-t border-trazo py-2 pr-3 font-cifra text-sm text-estrella">{s.cumulo_mayor}</td>
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
