import type { Metadata } from 'next';
import Link from 'next/link';

import { GrupoCifras, Kpi } from '@/components/firmamento/Kpi';
import { VentanaNoche } from '@/components/firmamento/VentanaNoche';
import { BarrasCategoria } from '@/components/firmamento/BarrasCategoria';
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
  const enOtros = porCategoria.find((c) => c.id === 'otros')?.n ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <VentanaNoche>
        <GrupoCifras
          fuente={`${FUENTE_BASE}; la cobertura cruza con OpenStreetMap (datos al ${OSM.osm_base.slice(0, 10)})`}
          fecha={hoy}
        >
          <Kpi
            etiqueta="Registros"
            valor={numero(total)}
            aclaracion={`${numero(estados.aprobado)} publicados · ${numero(estados.pendiente)} por revisar · ${numero(estados.rechazado + estados.archivado)} rechazados o archivados`}
            enlace={estados.pendiente > 0 ? { href: '/firmamento/equipo/moderacion', texto: 'Revisar registros' } : undefined}
          />
          <Kpi
            etiqueta="Cobertura del mapa abierto"
            valor={cob.porcentaje === null ? '—' : `${cob.porcentaje.toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`}
            aclaracion={`${numero(cob.dentro)} aliados publicados dentro de la comuna ÷ ${numero(cob.comercios)} comercios mapeados en OpenStreetMap`}
            enlace={{ href: '/firmamento/equipo/territorio', texto: 'Ver el territorio' }}
          />
          <Kpi
            etiqueta="Alertas de calidad"
            valor={numero(alertas.length)}
            aclaracion="Calculadas al vuelo sobre las fichas publicadas y por revisar"
            enlace={alertas.length > 0 ? { href: '/firmamento/equipo/moderacion?vista=alertas', texto: 'Resolver' } : undefined}
          />
          <Kpi
            etiqueta="Convocatorias por revisar"
            valor={numero(conteos.convocatorias)}
            aclaracion="Del vigía y de las entidades aliadas"
            enlace={conteos.convocatorias > 0 ? { href: '/firmamento/equipo/convocatorias', texto: 'Revisar' } : undefined}
          />
        </GrupoCifras>
      </VentanaNoche>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Tarjeta titulo="Aliados publicados por categoría" id="titulo-categorias">
          <BarrasCategoria
            columna="Aliados publicados"
            descripcion="Aliados publicados por categoría"
            vacio="Todavía no hay aliados publicados."
            filas={porCategoria.map((c) => ({ id: c.id, nombre: c.nombre, valor: c.n, grupo: c.grupo }))}
          />
          {enOtros > 0 && (
            <p className="mt-4 font-sans text-sm text-tinta/70">
              «Otros» concentra <span className="tabular-nums">{enOtros}</span>{' '}
              {enOtros === 1 ? 'ficha' : 'fichas'}: en las alertas de calidad el sugeridor propone una categoría.
            </p>
          )}
          <LineaFuente>Fuente: {FUENTE_BASE}, fichas publicadas · {hoy}</LineaFuente>
        </Tarjeta>

        <Tarjeta titulo="Aprendizaje del sugeridor" id="titulo-sugeridor">
          {sugeridor.total === 0 ? (
            <p className="font-sans text-sm leading-relaxed text-tinta/70">
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
                  <dt className="font-sans text-sm text-tinta/70">{t}</dt>
                  <dd className="mt-1 font-cifra text-2xl text-tinta">{numero(n as number)}</dd>
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
              <Link href="/firmamento/equipo/moderacion?vista=alertas" className="inline-flex min-h-[44px] items-center font-sans text-sm text-azul-texto underline underline-offset-4">
                Ver las {alertas.length}
              </Link>
            ) : undefined
          }
        >
          {alertas.length === 0 ? (
            <p className="font-sans text-sm text-tinta/70">Ninguna ficha tiene alertas.</p>
          ) : (
            <ul className="flex flex-col">
              {alertas.slice(0, 5).map((a) => (
                <li key={`${a.ficha.id}-${a.tipo}`} className="border-t border-tinta/12 py-3 first:border-t-0 first:pt-0">
                  <Link href={`/firmamento/equipo/aliados?ficha=${a.ficha.id}`} className="font-sans text-base font-medium text-tinta underline-offset-4 hover:underline">
                    {a.ficha.nombre}
                  </Link>
                  <p className="mt-0.5 font-sans text-sm leading-relaxed text-tinta/70">{a.texto}</p>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta
          titulo="Actividad reciente"
          id="titulo-actividad"
          accion={
            <Link href="/firmamento/equipo/moderacion?vista=historial" className="inline-flex min-h-[44px] items-center font-sans text-sm text-azul-texto underline underline-offset-4">
              Todo el historial
            </Link>
          }
        >
          {actividad.filas.length === 0 ? (
            <p className="font-sans text-sm text-tinta/70">Todavía no hay nada en la bitácora.</p>
          ) : (
            <ListaBitacora filas={actividad.filas.slice(0, 8)} />
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
