import type { Metadata } from 'next';

import { exigirEntidad } from '@/lib/auth/firmamento';
import { obtenerDatosAbiertos, type DatosAbiertos } from '@/lib/db/datos.repo';
import {
  filasPlanas,
  NOMBRE_DIMENSION,
  type DimensionDatos,
} from '@/lib/firmamento/datosAbiertos';
import { fechaLarga } from '@/lib/geo/constelaciones';
import { K_MINIMO } from '@/lib/privacidad/kAnonimato';
import { urlSitio } from '@/lib/sitio';
import { EncabezadoEntidad } from '../_components/EncabezadoEntidad';
import { CopiarEnlace } from './_components/CopiarEnlace';

export const metadata: Metadata = { title: 'Datos abiertos' };

// La sesión y la base se leen en cada carga.
export const dynamic = 'force-dynamic';

const PUBLICA: { dimension: string; texto: string }[] = [
  { dimension: 'Negocios aprobados', texto: 'Cuántos negocios hay en la red.' },
  { dimension: 'Por categoría', texto: 'Cuántos hay en cada categoría (comida, belleza, tiendas…).' },
  { dimension: 'Por barrio oficial', texto: 'Cuántos hay en cada uno de los 15 barrios de la comuna.' },
  { dimension: 'Por formalidad declarada', texto: 'Cuántos dicen tener RUT o Cámara de Comercio, estar en trámite o no tenerlos.' },
  { dimension: 'Por mayor dificultad', texto: 'Qué dificultad eligieron los negocios (cada uno puede elegir hasta dos).' },
];

const NUNCA: string[] = [
  'Nombres de negocios ni de las personas que los atienden.',
  'WhatsApp, teléfonos, correos ni redes sociales.',
  'Direcciones ni coordenadas.',
  'Fotos, menús ni descripciones.',
  'Lo que respondió cada negocio en la investigación: solo se cuentan las opciones.',
  'Negocios que aún no ha aprobado el equipo.',
  'Cuentas de Google, direcciones IP ni identificadores de nadie.',
];

const DIMENSIONES_TABLA: DimensionDatos[] = ['categoria', 'barrio', 'formalidad', 'dificultad'];

function Tabla({ datos, dimension }: { datos: DatosAbiertos; dimension: DimensionDatos }) {
  const filas = filasPlanas(datos).filter((f) => f.dimension === dimension);
  return (
    <div className="min-w-0 border border-tinta/12 bg-hueso">
      <table className="w-full border-collapse text-left font-sans text-sm text-tinta">
        <caption className="px-4 pb-1 pt-4 text-left font-sans text-base font-medium text-tinta">
          {NOMBRE_DIMENSION[dimension]}
        </caption>
        <thead>
          <tr className="text-tinta/70">
            <th scope="col" className="px-4 py-2 font-medium">
              Opción
            </th>
            <th scope="col" className="px-4 py-2 text-right font-medium">
              Negocios
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id} className="border-t border-tinta/12">
              <th scope="row" className="min-w-0 break-words px-4 py-2.5 font-normal">
                {f.nombre}
              </th>
              <td className="px-4 py-2.5 text-right font-sans tabular-nums text-azul-texto">
                {f.negocios}
                {f.negocios === '<5' && <span className="sr-only"> (menos de 5 negocios)</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {dimension === 'dificultad' && (
        <p className="px-4 pb-4 pt-2 font-sans text-sm leading-relaxed text-tinta/70">
          Cada negocio puede elegir hasta dos: las cifras no suman el total.
        </p>
      )}
    </div>
  );
}

/**
 * Datos abiertos para la entidad: qué publica `/api/datos`, una vista previa de lo
 * que hay hoy (la misma salida, con la regla k = 5), las descargas y cómo
 * conectarlo. El JSON es el endpoint público; el CSV sale de `datos/csv/route.ts`.
 */
export default async function EntidadDatosPage() {
  const contexto = await exigirEntidad();

  const datos: DatosAbiertos | null = await obtenerDatosAbiertos().catch((e) => {
    console.error('[entidad] datos abiertos no disponibles', e);
    return null;
  });
  const enlace = `${urlSitio()}/api/datos`;

  return (
    <div className="mx-auto max-w-[1280px]">
      <EncabezadoEntidad entidad={contexto.nombre}>
        Los mismos datos que cualquier persona puede consultar, listos para tu informe o tu tablero. Son
        conteos de negocios: nunca un negocio por su nombre.
      </EncabezadoEntidad>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section aria-labelledby="publica-titulo" className="border border-tinta/12 bg-hueso p-5 sm:p-6">
          <h2 id="publica-titulo" className="font-display text-2xl font-medium text-tinta">
            Qué publica
          </h2>
          <dl className="mt-4">
            {PUBLICA.map((p) => (
              <div key={p.dimension} className="border-b border-tinta/12 py-3 first:pt-0 last:border-b-0">
                <dt className="font-sans text-base font-medium text-tinta">{p.dimension}</dt>
                <dd className="mt-0.5 font-sans text-sm leading-relaxed text-tinta/70">{p.texto}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 font-sans text-sm leading-relaxed text-tinta/70">
            Toda cifra menor a {K_MINIMO} sale como «&lt;{K_MINIMO}», y a veces también se esconde la
            siguiente más pequeña para que nadie pueda deducir la escondida restando del total. Se
            actualiza cada hora.
          </p>
        </section>

        <section aria-labelledby="nunca-titulo" className="border border-tinta/12 bg-hueso p-5 sm:p-6">
          <h2 id="nunca-titulo" className="font-display text-2xl font-medium text-tinta">
            Qué nunca sale
          </h2>
          <ul className="mt-4 list-disc space-y-2.5 pl-5 font-sans text-base leading-relaxed text-tinta marker:text-morado">
            {NUNCA.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="mt-4 font-sans text-sm leading-relaxed text-tinta/70">
            Es la regla de la Ley 1581 de 2012: el consentimiento de los negocios cubre estadísticas
            agregadas y anónimas, no esto.
          </p>
        </section>
      </div>

      <section aria-labelledby="conectar-titulo" className="mt-6 border border-tinta/12 bg-hueso p-5 sm:p-6">
        <h2 id="conectar-titulo" className="font-display text-2xl font-medium text-tinta">
          Descárgalos o conéctalos
        </h2>

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="/api/datos"
            download="constelaciones-datos-abiertos.json"
            className="inline-flex min-h-[48px] items-center rounded-lg bg-azul-texto px-5 font-sans text-base font-medium text-hueso"
          >
            Descargar JSON
          </a>
          <a
            href="/firmamento/entidad/datos/csv"
            download
            className="inline-flex min-h-[48px] items-center rounded-lg border border-tinta/55 px-5 font-sans text-base text-tinta hover:border-azul hover:text-azul-texto"
          >
            Descargar CSV (Excel)
          </a>
        </div>

        <h3 className="mt-8 font-sans text-lg font-medium text-tinta">El enlace de los datos</h3>
        <p className="mt-1 max-w-2xl font-sans text-sm leading-relaxed text-tinta/70">
          Es público: no pide clave. Pégalo donde necesites los datos al día.
        </p>
        <div className="mt-3 max-w-3xl">
          <CopiarEnlace url={enlace} />
        </div>

        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          <li className="rounded-lg border border-tinta/12 p-4">
            <p className="font-sans text-base font-medium text-tinta">Power BI</p>
            <p className="mt-1 font-sans text-sm leading-relaxed text-tinta/70">
              Obtener datos, Web, pega el enlace y acepta. Power BI lee el JSON; expande la lista que
              quieras (por ejemplo, por categoría).
            </p>
          </li>
          <li className="rounded-lg border border-tinta/12 p-4">
            <p className="font-sans text-base font-medium text-tinta">Excel</p>
            <p className="mt-1 font-sans text-sm leading-relaxed text-tinta/70">
              Descarga el CSV y ábrelo: trae una fila por cada cifra, con su dimensión, su nombre y los
              negocios. Sirve para una tabla dinámica.
            </p>
          </li>
          <li className="rounded-lg border border-tinta/12 p-4">
            <p className="font-sans text-base font-medium text-tinta">Colab o Python</p>
            <p className="mt-1 font-sans text-sm leading-relaxed text-tinta/70">
              Pide el enlace con la librería requests y convierte la lista por_categoria con el
              json_normalize de pandas.
            </p>
          </li>
        </ul>
        <p className="mt-5 font-sans text-sm leading-relaxed text-tinta/70">
          Si publicas estos datos, cita la fuente: Constelaciones · Manrique.
        </p>
      </section>

      <section aria-labelledby="vista-titulo" className="mt-10">
        <h2 id="vista-titulo" className="font-display text-2xl font-medium text-tinta sm:text-3xl">
          Vista previa: lo que hay hoy
        </h2>

        {datos ? (
          <>
            <p className="mt-2 max-w-3xl font-sans text-base leading-relaxed text-tinta/70">
              Negocios aprobados en la red:{' '}
              <span className="font-sans tabular-nums text-azul-texto">
                {datos.negocios_aprobados}
                {datos.negocios_aprobados === '<5' && (
                  <span className="sr-only"> (menos de 5 negocios)</span>
                )}
              </span>
              .
            </p>
            <div className="mt-5 grid gap-6 lg:grid-cols-2 lg:items-start">
              {DIMENSIONES_TABLA.map((dimension) => (
                <Tabla key={dimension} datos={datos} dimension={dimension} />
              ))}
            </div>
            <p className="mt-4 font-sans text-xs leading-relaxed text-tinta/70 tabular-nums">
              Fuente: Constelaciones · Manrique, aliados aprobados por moderación (datos abiertos, regla k
              = 5) · consultado el {fechaLarga(datos.generado_en)}
            </p>
          </>
        ) : (
          <p role="status" className="mt-3 font-sans text-base leading-relaxed text-tinta/70">
            No pudimos consultar los datos en este momento. Vuelve a intentarlo en unos minutos.
          </p>
        )}
      </section>
    </div>
  );
}
