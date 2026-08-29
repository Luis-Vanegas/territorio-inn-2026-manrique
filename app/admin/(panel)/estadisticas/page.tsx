import Link from 'next/link';

import {
  resumenGeneral,
  porCategoria,
  porBarrio,
  registrosPorDia,
  porModerador,
} from '@/lib/db/estadisticas.repo';
import {
  rankingInteracciones,
  totalesInteracciones,
  interaccionesPorDia,
} from '@/lib/db/interacciones.repo';
import { totalVisitas } from '@/lib/db/visitas.repo';

export const dynamic = 'force-dynamic';

function Metrica({
  valor,
  etiqueta,
  nota,
}: {
  valor: string | number;
  etiqueta: string;
  nota?: string;
}) {
  return (
    <div className="border-t border-tinta/12 pt-4">
      <p className="font-mono text-3xl text-tinta">{valor}</p>
      <p className="mt-1 font-mono text-xs uppercase tracking-wider text-tinta/50">
        {etiqueta}
      </p>
      {nota && <p className="mt-1 font-sans text-xs text-tinta/40">{nota}</p>}
    </div>
  );
}

/** Barras en CSS puro: una librería de gráficos para esto sería desproporcionado. */
function Barras({
  filas,
  vacio,
  sufijoSecundario = 'publicados',
}: {
  filas: { etiqueta: string; valor: number; secundario?: number }[];
  vacio: string;
  sufijoSecundario?: string;
}) {
  if (filas.length === 0) {
    return <p className="font-sans text-sm text-tinta/50">{vacio}</p>;
  }

  const max = Math.max(...filas.map((f) => f.valor), 1);

  return (
    <ul className="flex flex-col gap-3">
      {filas.map((f) => (
        <li key={f.etiqueta}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-sans text-sm text-tinta/75">{f.etiqueta}</span>
            <span className="font-mono text-xs text-tinta/50">
              {f.valor}
              {f.secundario !== undefined && f.secundario !== f.valor && (
                <span className="text-tinta/35">
                  {' '}
                  · {f.secundario} {sufijoSecundario}
                </span>
              )}
            </span>
          </div>
          <div className="mt-1.5 h-1 w-full bg-tinta/8">
            <div
              className="h-full bg-terracota"
              style={{ width: `${(f.valor / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Serie diaria en barras. Si las filas traen `secundario`, la barra se apila:
 * el bloque oscuro abajo es el subconjunto (contactos dentro de vistas).
 *
 * Apilado y no dos gráficos separados porque la pregunta es la proporción —
 * "de los que miraron, cuántos escribieron" — y esa relación se lee de un
 * vistazo cuando comparten la misma barra.
 */
function SerieDiaria({
  filas,
  etiqueta,
  unidad = 'registros',
  etiquetaSecundaria,
}: {
  filas: { dia: string; total: number; secundario?: number }[];
  etiqueta: string;
  unidad?: string;
  etiquetaSecundaria?: string;
}) {
  const max = Math.max(...filas.map((f) => f.total), 1);
  const hayDatos = filas.some((f) => f.total > 0);

  return (
    <div>
      <div className="flex h-24 items-end gap-[3px]" role="img" aria-label={etiqueta}>
        {filas.map((f) => (
          <div
            key={f.dia}
            className="flex flex-1 flex-col justify-end"
            style={{
              // 2px de piso para que los días en cero sigan siendo una marca
              // visible: un hueco en la serie también dice algo.
              height: f.total === 0 ? '2px' : `${Math.max((f.total / max) * 100, 8)}%`,
              opacity: f.total === 0 ? 0.18 : 1,
            }}
            title={
              f.secundario === undefined
                ? `${f.dia}: ${f.total}`
                : `${f.dia}: ${f.total} ${unidad}, ${f.secundario} ${etiquetaSecundaria ?? ''}`
            }
          >
            <div className="w-full flex-1 bg-terracota/85" />
            {f.secundario !== undefined && f.secundario > 0 && (
              <div
                className="w-full bg-tinta/70"
                style={{ height: `${Math.min((f.secundario / f.total) * 100, 100)}%` }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-between font-mono text-[10px] text-tinta/35">
        <span>{filas[0]?.dia.slice(5)}</span>
        <span>{hayDatos ? `máx ${max}/día` : `sin ${unidad} aún`}</span>
        <span>{filas[filas.length - 1]?.dia.slice(5)}</span>
      </div>
    </div>
  );
}

export default async function EstadisticasPage() {
  const [
    resumen,
    categorias,
    barrios,
    serie,
    moderadores,
    interes,
    totalesInteres,
    serieInteres,
    visitas,
  ] = await Promise.all([
    resumenGeneral(),
    porCategoria(),
    porBarrio(),
    registrosPorDia(30),
    porModerador(),
    rankingInteracciones(30),
    totalesInteracciones(30),
    interaccionesPorDia(30),
    totalVisitas(30),
  ]);

  const tasaAprobacion =
    resumen.aprobados + resumen.rechazados > 0
      ? Math.round((resumen.aprobados / (resumen.aprobados + resumen.rechazados)) * 100)
      : null;

  return (
    <main className="margen-editorial py-16">
      <h1 className="font-display text-4xl font-medium leading-tight text-tinta">
        Estadísticas
      </h1>

      <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-tinta/60">
        Datos de los registros del módulo. El tráfico del sitio —visitantes,
        páginas vistas, de dónde llegan— se mide aparte y de forma anónima.
      </p>

      {/* Los CSV traen el DETALLE, no este resumen. Un panel responde las
          preguntas que alguien previó; una tabla dinámica sobre el detalle
          responde las que van a aparecer después. */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href="/api/admin/exportar?conjunto=aliados"
          download
          className="border border-tinta/20 px-4 py-2 font-mono text-xs text-tinta/70 transition-colors hover:border-terracota-texto hover:text-terracota-texto"
        >
          ↓ Aliados en CSV
        </a>
        <a
          href="/api/admin/exportar?conjunto=interacciones"
          download
          className="border border-tinta/20 px-4 py-2 font-mono text-xs text-tinta/70 transition-colors hover:border-terracota-texto hover:text-terracota-texto"
        >
          ↓ Interacciones por día en CSV
        </a>
        <span className="font-mono text-xs text-tinta/40">
          Se abren en Excel · sin teléfonos ni correos
        </span>
      </div>

      <section className="mt-12">
        <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
          01 · Resumen
        </h2>

        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          <Metrica valor={resumen.total} etiqueta="Registros totales" />
          <Metrica
            valor={resumen.pendientes}
            etiqueta="En espera"
            nota={resumen.pendientes > 0 ? 'requieren revisión' : 'cola al día'}
          />
          <Metrica valor={resumen.aprobados} etiqueta="Publicados" />
          <Metrica valor={resumen.ultimos7dias} etiqueta="Últimos 7 días" />
          <Metrica
            valor={tasaAprobacion === null ? '—' : `${tasaAprobacion}%`}
            etiqueta="Tasa de aprobación"
            nota={tasaAprobacion === null ? 'sin decisiones aún' : undefined}
          />
          <Metrica
            valor={
              resumen.total > 0
                ? `${Math.round((resumen.conFoto / resumen.total) * 100)}%`
                : '—'
            }
            etiqueta="Con fotografía"
          />
          <Metrica
            valor={
              resumen.horasPromedioModeracion === null
                ? '—'
                : resumen.horasPromedioModeracion < 24
                  ? `${Math.round(resumen.horasPromedioModeracion)} h`
                  : `${Math.round(resumen.horasPromedioModeracion / 24)} d`
            }
            etiqueta="Demora en moderar"
            nota="promedio desde el registro"
          />
          <Metrica valor={resumen.rechazados} etiqueta="Rechazados" />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
          02 · Registros por día
        </h2>
        <div className="mt-6 max-w-3xl">
          <SerieDiaria filas={serie} etiqueta="Registros por día en los últimos 30 días" />
        </div>
      </section>

      {/* Esto es lo que le sirve al aliado, no al equipo: es el número que
          convierte "registrate en el mapa" de un favor en un argumento. */}
      <section className="mt-16">
        <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
          03 · Interés por negocio · últimos 30 días
        </h2>

        <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-tinta/60">
          Cuánta gente abrió la ficha de cada negocio y cuánta tocó un contacto.
          Se cuenta de forma agregada por día: no hay cookie, ni IP, ni forma de
          saber si dos vistas son de la misma persona.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
          <Metrica valor={totalesInteres.vistas} etiqueta="Fichas abiertas" />
          <Metrica
            valor={totalesInteres.contactos}
            etiqueta="Contactos tocados"
            nota="WhatsApp, teléfono, correo o redes"
          />
          <Metrica
            valor={
              totalesInteres.vistas > 0
                ? `${Math.round((totalesInteres.contactos / totalesInteres.vistas) * 100)}%`
                : '—'
            }
            etiqueta="Pasan a contactar"
            nota={totalesInteres.vistas === 0 ? 'sin datos aún' : 'de los que miran'}
          />
          <Metrica
            valor={interes.filter((f) => f.vistas === 0).length}
            etiqueta="Sin una sola vista"
            nota="publicados que nadie abrió"
          />
        </div>

        <div className="mt-8 max-w-3xl">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-tinta/45">
            Evolución diaria
            <span className="ml-3 inline-flex items-center gap-1.5 normal-case tracking-normal text-tinta/40">
              <span className="inline-block h-2 w-2 bg-terracota/85" aria-hidden="true" />
              fichas abiertas
              <span className="ml-2 inline-block h-2 w-2 bg-tinta/70" aria-hidden="true" />
              de esas, las que contactaron
            </span>
          </p>
          <SerieDiaria
            filas={serieInteres.map((f) => ({
              dia: f.dia,
              total: f.vistas,
              secundario: f.contactos,
            }))}
            etiqueta="Interacciones por día en los últimos 30 días"
            unidad="vistas"
            etiquetaSecundaria="contactos"
          />
        </div>

        <div className="mt-8 max-w-2xl">
          <Barras
            vacio="Todavía nadie abrió una ficha. Los números aparecen apenas haya visitas."
            sufijoSecundario="contactos"
            filas={interes.map((f) => ({
              etiqueta: f.nombre,
              valor: f.vistas,
              secundario: f.contactos,
            }))}
          />
        </div>
      </section>

      <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <section>
          <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
            04 · Por categoría
          </h2>
          <div className="mt-6">
            <Barras
              vacio="Todavía no hay registros."
              filas={categorias.map((c) => ({
                etiqueta: c.nombre,
                valor: c.total,
                secundario: c.aprobados,
              }))}
            />
          </div>
        </section>

        <section>
          <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
            05 · Por barrio
          </h2>
          <div className="mt-6">
            <Barras
              vacio="Todavía no hay emprendimientos publicados."
              filas={barrios.map((b) => ({ etiqueta: b.barrio, valor: b.total }))}
            />
          </div>
        </section>
      </div>

      {moderadores.length > 0 && (
        <section className="mt-16">
          <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
            06 · Moderación por persona
          </h2>
          <div className="mt-6 max-w-lg">
            <Barras
              vacio="Sin moderaciones aún."
              filas={moderadores.map((m) => ({
                etiqueta: m.moderado_por,
                valor: m.total,
              }))}
            />
          </div>
        </section>
      )}

      <section className="mt-16 max-w-2xl border-t border-tinta/12 pt-8">
        <h2 className="font-mono text-xs uppercase tracking-wider text-tinta/50">
          07 · Tráfico del sitio
        </h2>

        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3">
          <Metrica
            valor={visitas}
            etiqueta="Páginas abiertas · 30 días"
            nota="Contador propio, anónimo. Es el número que se muestra en el home."
          />
        </div>

        <p className="mt-6 font-sans text-sm leading-relaxed text-tinta/70">
          Ese contador dice cuántas páginas se abrieron, no cuántas personas
          distintas entraron: no hay cookie ni identificador que persista entre
          visitas, así que dos cargas de la misma persona son dos. La precisión
          que falta es el precio de no pedir consentimiento, y está asumida.
        </p>

        <p className="mt-4 font-sans text-sm leading-relaxed text-tinta/70">
          Para visitantes únicos, de dónde llega la gente y qué tan rápido carga
          el sitio está Vercel Analytics, que tampoco usa cookies ni identifica
          personas. Se consulta en el dashboard de Vercel, pestañas{' '}
          <span className="font-mono text-xs">Analytics</span> y{' '}
          <span className="font-mono text-xs">Speed Insights</span> del proyecto.
        </p>

        <div className="mt-5 flex flex-wrap gap-4">
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-tinta/20 px-4 py-2 font-mono text-xs text-tinta/70 transition-colors hover:border-terracota-texto hover:text-terracota-texto"
          >
            Abrir Vercel Analytics ↗
          </a>

          <Link
            href="/admin/aliados"
            className="border border-tinta/20 px-4 py-2 font-mono text-xs text-tinta/70 transition-colors hover:border-terracota-texto hover:text-terracota-texto"
          >
            ← Volver a la cola
          </Link>
        </div>
      </section>
    </main>
  );
}
