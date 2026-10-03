import type { Metadata } from 'next';
import Link from 'next/link';

import { Estrella } from '@/components/firmamento/Estrella';
import { ListaBitacora } from '@/components/firmamento/panel/Bitacora';
import { CLASE_BOTON_PANEL, hoyBogota, LineaFuente, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { grupoDeCategoria } from '@/lib/categorias/grupos';
import { listarBitacora } from '@/lib/db/bitacora.repo';
import { aprendizajeSugeridor, conteosPanel, fichasParaCalidad } from '@/lib/db/equipo.repo';
import { contarPorEstado } from '@/lib/db/portafolios.repo';
import { alertasDeCalidad } from '@/lib/firmamento/calidad';
import { cobertura, OSM } from '@/lib/firmamento/territorio';

export const metadata: Metadata = { title: 'Resumen' };

export const dynamic = 'force-dynamic';

const FUENTE_BASE = 'base de datos de Constelaciones';
const numero = (n: number) => n.toLocaleString('es-CO');

/** Indicador del resumen: cifra, qué cuenta, fuente y fecha, y a dónde ir a actuar. */
function Indicador({
  valor,
  etiqueta,
  aclaracion,
  fuente,
  accion,
}: {
  valor: string;
  etiqueta: string;
  aclaracion?: React.ReactNode;
  fuente: string;
  accion?: { href: string; texto: string };
}) {
  return (
    <div className="relative flex min-w-0 flex-col rounded-xl border border-trazo bg-noche-2 p-5 pr-12">
      <Estrella tamano={18} className="absolute right-4 top-4" />
      <p className="font-sans text-sm text-tenue">{etiqueta}</p>
      <p className="mt-2 font-cifra text-4xl font-medium leading-none text-sodio">{valor}</p>
      {aclaracion && <p className="mt-2 font-sans text-sm leading-snug text-tenue">{aclaracion}</p>}
      <p className="mt-3 font-cifra text-xs leading-relaxed text-tenue">Fuente: {fuente}</p>
      {accion && (
        <Link
          href={accion.href}
          className="mt-auto inline-flex min-h-[44px] items-center pt-2 font-sans text-sm font-medium text-sodio underline underline-offset-4"
        >
          {accion.texto}
        </Link>
      )}
    </div>
  );
}

export default async function EquipoResumenPage() {
  await exigirEquipo();

  const [estados, conteos, fichas, actividad, sugeridor] = await Promise.all([
    contarPorEstado(),
    conteosPanel(),
    fichasParaCalidad(),
    listarBitacora({ pagina: 1 }),
    aprendizajeSugeridor(),
  ]);

  const hoy = hoyBogota();
  const aprobados = fichas.filter((f) => f.estado === 'aprobado');
  const cob = cobertura(aprobados);
  const alertas = alertasDeCalidad(fichas);
  const total = estados.pendiente + estados.aprobado + estados.rechazado + estados.archivado;

  const porCategoria = [
    ...aprobados
      .reduce((m, f) => m.set(f.categoria_id, { nombre: f.categoria_nombre, n: (m.get(f.categoria_id)?.n ?? 0) + 1 }), new Map<string, { nombre: string; n: number }>())
      .entries(),
  ]
    .map(([id, v]) => ({ id, ...v, grupo: grupoDeCategoria(id) }))
    .sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre, 'es'));
  const maximo = porCategoria[0]?.n ?? 1;
  const enOtros = porCategoria.find((c) => c.id === 'otros')?.n ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          etiqueta="Registros"
          valor={numero(total)}
          aclaracion={`${numero(estados.aprobado)} publicados · ${numero(estados.pendiente)} por revisar · ${numero(estados.rechazado + estados.archivado)} rechazados o archivados`}
          fuente={`${FUENTE_BASE} · ${hoy}`}
          accion={estados.pendiente > 0 ? { href: '/firmamento/equipo/moderacion', texto: 'Revisar registros' } : undefined}
        />
        <Indicador
          etiqueta="Cobertura del mapa abierto"
          valor={cob.porcentaje === null ? '—' : `${cob.porcentaje.toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`}
          aclaracion={`${numero(cob.dentro)} aliados publicados dentro de la comuna ÷ ${numero(cob.comercios)} comercios mapeados en OpenStreetMap`}
          fuente={`${FUENTE_BASE} y OpenStreetMap · ${hoy} y ${OSM.osm_base.slice(0, 10)}`}
          accion={{ href: '/firmamento/equipo/territorio', texto: 'Ver el territorio' }}
        />
        <Indicador
          etiqueta="Alertas de calidad"
          valor={numero(alertas.length)}
          aclaracion="Calculadas al vuelo sobre las fichas publicadas y por revisar"
          fuente={`${FUENTE_BASE} · ${hoy}`}
          accion={alertas.length > 0 ? { href: '/firmamento/equipo/moderacion?vista=alertas', texto: 'Resolver' } : undefined}
        />
        <Indicador
          etiqueta="Convocatorias por revisar"
          valor={numero(conteos.convocatorias)}
          aclaracion="Del vigía y de las entidades aliadas"
          fuente={`${FUENTE_BASE} · ${hoy}`}
          accion={conteos.convocatorias > 0 ? { href: '/firmamento/equipo/convocatorias', texto: 'Revisar' } : undefined}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Tarjeta titulo="Aliados publicados por categoría" id="titulo-categorias">
          {porCategoria.length === 0 ? (
            <p className="font-sans text-sm text-tenue">Todavía no hay aliados publicados.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {porCategoria.map((c) => (
                <li key={c.id} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_2.5rem] items-center gap-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_2.5rem]">
                  <span className="font-sans text-sm leading-snug text-estrella">{c.nombre}</span>
                  <span className="h-2 rounded-full bg-noche-3" aria-hidden="true">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${(c.n / maximo) * 100}%`, backgroundColor: c.grupo.color }}
                    />
                  </span>
                  <span className="text-right font-cifra text-sm text-estrella">{c.n}</span>
                </li>
              ))}
            </ul>
          )}
          {enOtros > 0 && (
            <p className="mt-4 font-sans text-sm text-tenue">
              «Otros» concentra <span className="font-cifra">{enOtros}</span>{' '}
              {enOtros === 1 ? 'ficha' : 'fichas'}: en las alertas de calidad el sugeridor propone una categoría.
            </p>
          )}
          <LineaFuente>Fuente: {FUENTE_BASE}, fichas publicadas · {hoy}</LineaFuente>
        </Tarjeta>

        <Tarjeta titulo="Aprendizaje del sugeridor" id="titulo-sugeridor">
          {sugeridor.total === 0 ? (
            <p className="font-sans text-sm leading-relaxed text-tenue">
              Todavía no hay sugerencias registradas. Cada registro donde la persona
              acepta o cambia la categoría propuesta queda aquí como ejemplo para
              reentrenar.
            </p>
          ) : (
            <dl className="grid grid-cols-2 gap-4">
              {[
                ['Aceptadas', sugeridor.aceptadas],
                ['Corregidas por la persona', sugeridor.corregidas],
                ['Con ficha enlazada', sugeridor.conFicha],
                ['Coinciden con la ficha hoy', sugeridor.coincidenConFicha],
              ].map(([t, n]) => (
                <div key={t}>
                  <dt className="font-sans text-sm text-tenue">{t}</dt>
                  <dd className="mt-1 font-cifra text-2xl text-estrella">{numero(n as number)}</dd>
                </div>
              ))}
            </dl>
          )}
          <LineaFuente>Fuente: sugerencias del registro (sin el texto escrito) · {hoy}</LineaFuente>
          <Link href="/firmamento/equipo/modelos" className={`${CLASE_BOTON_PANEL} mt-4`}>
            Ver los modelos
          </Link>
        </Tarjeta>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Tarjeta
          titulo="Alertas de calidad"
          id="titulo-alertas"
          accion={
            alertas.length > 5 ? (
              <Link href="/firmamento/equipo/moderacion?vista=alertas" className="inline-flex min-h-[44px] items-center font-sans text-sm text-sodio underline underline-offset-4">
                Ver las {alertas.length}
              </Link>
            ) : undefined
          }
        >
          {alertas.length === 0 ? (
            <p className="font-sans text-sm text-tenue">Ninguna ficha tiene alertas.</p>
          ) : (
            <ul className="flex flex-col">
              {alertas.slice(0, 5).map((a) => (
                <li key={`${a.ficha.id}-${a.tipo}`} className="border-t border-trazo py-3 first:border-t-0 first:pt-0">
                  <Link href={`/firmamento/equipo/aliados?ficha=${a.ficha.id}`} className="font-sans text-base font-medium text-estrella underline-offset-4 hover:underline">
                    {a.ficha.nombre}
                  </Link>
                  <p className="mt-0.5 font-sans text-sm leading-relaxed text-tenue">{a.texto}</p>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta
          titulo="Actividad reciente"
          id="titulo-actividad"
          accion={
            <Link href="/firmamento/equipo/moderacion?vista=historial" className="inline-flex min-h-[44px] items-center font-sans text-sm text-sodio underline underline-offset-4">
              Todo el historial
            </Link>
          }
        >
          {actividad.filas.length === 0 ? (
            <p className="font-sans text-sm text-tenue">Todavía no hay nada en la bitácora.</p>
          ) : (
            <ListaBitacora filas={actividad.filas.slice(0, 8)} />
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
