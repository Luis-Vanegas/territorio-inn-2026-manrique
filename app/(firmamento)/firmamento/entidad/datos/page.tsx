import type { Metadata } from 'next';

import { CLASE_BOTON_PANEL, CLASE_BOTON_PRIMARIO, LineaFuente, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
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

const CONECTAR: { herramienta: string; texto: string }[] = [
  {
    herramienta: 'Power BI',
    texto:
      'Obtener datos, Web, pega el enlace y acepta. Power BI lee el JSON; expande la lista que quieras (por ejemplo, por categoría).',
  },
  {
    herramienta: 'Excel',
    texto:
      'Descarga el CSV y ábrelo: trae una fila por cada cifra, con su dimensión, su nombre y los negocios. Sirve para una tabla dinámica.',
  },
  {
    herramienta: 'Colab o Python',
    texto: 'Pide el enlace con la librería requests y convierte la lista por_categoria con el json_normalize de pandas.',
  },
];

function Tabla({ datos, dimension }: { datos: DatosAbiertos; dimension: DimensionDatos }) {
  const filas = filasPlanas(datos).filter((f) => f.dimension === dimension);
  return (
    <div className="min-w-0">
      <table className="w-full border-collapse text-left font-sans text-sm text-tinta">
        <caption className="pb-1 text-left font-sans text-base font-medium text-tinta">
          {NOMBRE_DIMENSION[dimension]}
        </caption>
        <thead>
          <tr className="text-tinta/70">
            <th scope="col" className="py-2 pr-3 font-medium">
              Opción
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Negocios
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id} className="border-t border-tinta/12">
              <th scope="row" className="min-w-0 break-words py-2.5 pr-3 font-normal">
                {f.nombre}
              </th>
              <td className="py-2.5 text-right font-sans tabular-nums text-azul-texto">
                {f.negocios}
                {f.negocios === '<5' && <span className="sr-only"> (menos de 5 negocios)</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {dimension === 'dificultad' && (
        <p className="pt-2 font-sans text-sm leading-relaxed text-tinta/70">
          Cada negocio puede elegir hasta dos: las cifras no suman el total.
        </p>
      )}
    </div>
  );
}

/**
 * Datos abiertos para la entidad: las descargas y cómo conectarlas arriba, lo
 * que hay hoy como tablas (la misma salida de `/api/datos`, con la regla k = 5)
 * y, plegado, qué publica y qué nunca sale. El JSON es el endpoint público; el
 * CSV sale de `datos/csv/route.ts`.
 */
export default async function EntidadDatosPage() {
  await exigirEntidad();

  const datos: DatosAbiertos | null = await obtenerDatosAbiertos().catch((e) => {
    console.error('[entidad] datos abiertos no disponibles', e);
    return null;
  });
  const enlace = `${urlSitio()}/api/datos`;

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
      <p className="max-w-3xl font-sans text-base leading-relaxed text-tinta/70">
        Los mismos datos que cualquier persona puede consultar, listos para tu informe o tu tablero. Son conteos de
        negocios: nunca un negocio por su nombre.
      </p>

      <Tarjeta titulo="Descárgalos o conéctalos" id="conectar-titulo">
        <div className="flex flex-wrap gap-3">
          <a href="/api/datos" download="constelaciones-datos-abiertos.json" className={CLASE_BOTON_PRIMARIO}>
            Descargar JSON
          </a>
          <a href="/firmamento/entidad/datos/csv" download className={CLASE_BOTON_PANEL}>
            Descargar CSV (Excel)
          </a>
        </div>

        <h3 className="mt-6 font-sans text-base font-medium text-tinta">El enlace de los datos</h3>
        <p className="mt-1 max-w-2xl font-sans text-sm leading-relaxed text-tinta/70">
          Es público: no pide clave. Pégalo donde necesites los datos al día. Se actualiza cada hora.
        </p>
        <div className="mt-3 max-w-3xl">
          <CopiarEnlace url={enlace} />
        </div>

        <dl className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-3">
          {CONECTAR.map((c) => (
            <div key={c.herramienta} className="border-t border-tinta/12 pt-3">
              <dt className="font-sans text-base font-medium text-tinta">{c.herramienta}</dt>
              <dd className="mt-1 font-sans text-sm leading-relaxed text-tinta/70">{c.texto}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 font-sans text-sm leading-relaxed text-tinta/70">
          Si publicas estos datos, cita la fuente: Constelaciones · Manrique.
        </p>
      </Tarjeta>

      <Tarjeta
        titulo="Vista previa: lo que hay hoy"
        id="vista-titulo"
        plegable
        resumen={
          datos ? (
            <>
              <span className="tabular-nums">{datos.negocios_aprobados}</span>
              {datos.negocios_aprobados === '<5' && <span className="sr-only"> (menos de 5 negocios)</span>} negocios
              aprobados
            </>
          ) : undefined
        }
      >
        {datos ? (
          <>
            <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2 lg:items-start">
              {DIMENSIONES_TABLA.map((dimension) => (
                <Tabla key={dimension} datos={datos} dimension={dimension} />
              ))}
            </div>
            <LineaFuente>
              Fuente: Constelaciones · Manrique, aliados aprobados por moderación (datos abiertos, regla k = 5) ·
              consultado el {fechaLarga(datos.generado_en)}
            </LineaFuente>
          </>
        ) : (
          <p role="status" className="font-sans text-base leading-relaxed text-tinta/70">
            No pudimos consultar los datos en este momento. Vuelve a intentarlo en unos minutos.
          </p>
        )}
      </Tarjeta>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <Tarjeta titulo="Qué publica" id="publica-titulo" plegable resumen={`${PUBLICA.length} conjuntos`}>
          <dl>
            {PUBLICA.map((p) => (
              <div key={p.dimension} className="border-b border-tinta/12 py-3 first:pt-0 last:border-b-0">
                <dt className="font-sans text-base font-medium text-tinta">{p.dimension}</dt>
                <dd className="mt-0.5 font-sans text-sm leading-relaxed text-tinta/70">{p.texto}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 font-sans text-sm leading-relaxed text-tinta/70">
            Toda cifra menor a {K_MINIMO} sale como «&lt;{K_MINIMO}», y a veces también se esconde la siguiente más
            pequeña para que nadie pueda deducir la escondida restando del total.
          </p>
        </Tarjeta>

        <Tarjeta titulo="Qué nunca sale" id="nunca-titulo" plegable resumen={`${NUNCA.length} reglas`}>
          <ul className="list-disc space-y-2.5 pl-5 font-sans text-base leading-relaxed text-tinta marker:text-morado">
            {NUNCA.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="mt-4 font-sans text-sm leading-relaxed text-tinta/70">
            Es la regla de la Ley 1581 de 2012: el consentimiento de los negocios cubre estadísticas agregadas y
            anónimas, no esto.
          </p>
        </Tarjeta>
      </div>
    </div>
  );
}
