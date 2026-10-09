import type { Metadata } from 'next';
import Link from 'next/link';

import { GrupoCifras, Kpi } from '@/components/firmamento/Kpi';
import { VentanaNoche } from '@/components/firmamento/VentanaNoche';
import { BarrasCategoria } from '@/components/firmamento/BarrasCategoria';
import { AprendizajeSugeridor } from '@/components/firmamento/panel/AprendizajeSugeridor';
import { ListaBitacora, textoCampos } from '@/components/firmamento/panel/Bitacora';
import { CLASE_BOTON_PANEL, hoyBogota, LineaFuente, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { grupoDeCategoria } from '@/lib/categorias/grupos';
import { listarBitacora } from '@/lib/db/bitacora.repo';
import { aprendizajeSugeridor, cambiosDeDuenos, conteosPanel, fichasParaCalidad } from '@/lib/db/equipo.repo';
import { listarInvitacionesPendientes } from '@/lib/db/invitaciones.repo';
import { contarPorEstado } from '@/lib/db/portafolios.repo';
import { alertasDeCalidad } from '@/lib/firmamento/calidad';

export const metadata: Metadata = { title: 'Resumen' };

export const dynamic = 'force-dynamic';

const FUENTE_BASE = 'base de datos de Constelaciones';
const numero = (n: number) => n.toLocaleString('es-CO');
const CLASE_ENLACE =
  'inline-flex min-h-[44px] items-center font-sans text-sm text-azul-texto underline underline-offset-4';

/**
 * Hoy: lo que espera una decisión del equipo (registros por revisar, alertas,
 * cambios de los dueños, convocatorias e invitaciones) y, plegado, cómo va la red.
 * Cada cifra y cada fila llevan a donde se resuelve.
 */
export default async function EquipoResumenPage() {
  await exigirEquipo();

  const [estados, conteos, fichas, actividad, sugeridor, cambios, invEntidad, invModerador] = await Promise.all([
    contarPorEstado(),
    conteosPanel(),
    fichasParaCalidad(),
    listarBitacora({ pagina: 1 }),
    aprendizajeSugeridor(),
    cambiosDeDuenos(1),
    listarInvitacionesPendientes('entidad'),
    listarInvitacionesPendientes('moderador'),
  ]);

  const hoy = hoyBogota();
  const aprobados = fichas.filter((f) => f.estado === 'aprobado');
  const alertas = alertasDeCalidad(fichas);
  const total = estados.pendiente + estados.aprobado + estados.rechazado + estados.archivado;
  const invitaciones = invEntidad.length + invModerador.length;

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
        <GrupoCifras fuente={FUENTE_BASE} fecha={hoy}>
          <Kpi
            etiqueta="Registros por revisar"
            valor={numero(estados.pendiente)}
            numero={estados.pendiente}
            tono={estados.pendiente > 0 ? 'ladrillo' : 'sodio'}
            aclaracion={`${numero(estados.aprobado)} publicados de ${numero(total)}`}
            enlace={estados.pendiente > 0 ? { href: '/firmamento/equipo/moderacion', texto: 'Revisar' } : undefined}
          />
          <Kpi
            etiqueta="Alertas de calidad"
            valor={numero(alertas.length)}
            numero={alertas.length}
            aclaracion="Fichas con algo por corregir"
            enlace={alertas.length > 0 ? { href: '/firmamento/equipo/moderacion?vista=alertas', texto: 'Resolver' } : undefined}
          />
          <Kpi
            etiqueta="Convocatorias por revisar"
            valor={numero(conteos.convocatorias)}
            numero={conteos.convocatorias}
            aclaracion="Del buscador automático de convocatorias (vigía) y de las entidades"
            enlace={conteos.convocatorias > 0 ? { href: '/firmamento/equipo/convocatorias', texto: 'Revisar' } : undefined}
          />
          <Kpi
            etiqueta="Invitaciones pendientes"
            valor={numero(invitaciones)}
            numero={invitaciones}
            aclaracion={`${numero(invEntidad.length)} de entidades · ${numero(invModerador.length)} de moderadores`}
            enlace={
              invitaciones > 0
                ? { href: invEntidad.length > 0 ? '/firmamento/equipo/entidades' : '/firmamento/equipo/moderadores', texto: 'Ver' }
                : undefined
            }
          />
        </GrupoCifras>
      </VentanaNoche>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Tarjeta titulo="Alertas de calidad" id="titulo-alertas" plegable abierta resumen={numero(alertas.length)}>
          {alertas.length === 0 ? (
            <p className="font-sans text-sm text-tinta/70">Ninguna ficha tiene alertas.</p>
          ) : (
            <>
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
              {alertas.length > 5 && (
                <Link href="/firmamento/equipo/moderacion?vista=alertas" className={CLASE_ENLACE}>
                  Ver las {alertas.length}
                </Link>
              )}
            </>
          )}
          {enOtros > 0 && (
            <p className="mt-3 font-sans text-sm text-tinta/70">
              «Otros» tiene <span className="tabular-nums">{enOtros}</span> {enOtros === 1 ? 'ficha' : 'fichas'}: ahí el sugeridor (un modelo que lee el nombre del negocio y propone una categoría) te ayuda a ubicarlas.
            </p>
          )}
        </Tarjeta>

        <Tarjeta
          titulo="Cambios de los dueños"
          id="titulo-cambios"
          plegable
          abierta
          resumen={cambios.filas.length > 0 ? `${cambios.hayMas ? 'más de ' : ''}${cambios.filas.length}` : undefined}
        >
          {cambios.filas.length === 0 ? (
            <p className="font-sans text-sm text-tinta/70">Ningún dueño ha editado su ficha todavía.</p>
          ) : (
            <>
              <ul className="flex flex-col">
                {cambios.filas.slice(0, 5).map((f) => (
                  <li key={f.id} className="border-t border-tinta/12 py-3 first:border-t-0 first:pt-0">
                    <Link href={`/firmamento/equipo/aliados?ficha=${f.portafolio_id}`} className="font-sans text-base font-medium text-tinta underline-offset-4 hover:underline">
                      {f.portafolio_nombre}
                    </Link>
                    <p className="mt-0.5 font-sans text-sm leading-relaxed text-tinta/70">
                      {f.campos.length > 0 ? textoCampos(f.campos) : 'Sin campos que nombrar'} · {f.creado_en}
                    </p>
                  </li>
                ))}
              </ul>
              <Link href="/firmamento/equipo/moderacion?vista=cambios" className={CLASE_ENLACE}>
                Ver todos los cambios
              </Link>
            </>
          )}
        </Tarjeta>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Tarjeta titulo="Aliados publicados por categoría" id="titulo-categorias" plegable resumen={numero(aprobados.length)}>
          <BarrasCategoria
            columna="Aliados publicados"
            descripcion="Aliados publicados por categoría"
            vacio="Todavía no hay aliados publicados."
            filas={porCategoria.map((c) => ({ id: c.id, nombre: c.nombre, valor: c.n, grupo: c.grupo }))}
          />
          <LineaFuente>Fuente: {FUENTE_BASE}, fichas publicadas · {hoy}</LineaFuente>
        </Tarjeta>

        <Tarjeta titulo="Aprendizaje del sugeridor" id="titulo-sugeridor" plegable>
          <p className="mb-4 font-sans text-sm leading-relaxed text-tinta/70">
            El sugeridor es un modelo que lee el nombre del negocio y propone una categoría. Aquí ves cuántas veces la
            gente y el equipo usaron su propuesta, la corrigieron o la dejaron como estaba: cada decisión le sirve para
            aprender.
          </p>
          <AprendizajeSugeridor datos={sugeridor} />
          <LineaFuente>Fuente: sugerencias del registro y de la moderación, sin el texto escrito · {hoy}</LineaFuente>
          <Link href="/firmamento/equipo/modelos" className={`${CLASE_BOTON_PANEL} mt-4`}>
            Ver los modelos
          </Link>
        </Tarjeta>
      </div>

      <Tarjeta
        titulo="Actividad reciente"
        id="titulo-actividad"
        plegable
        accion={
          <Link href="/firmamento/equipo/moderacion?vista=historial" className={CLASE_ENLACE}>
            Todo el historial
          </Link>
        }
      >
        {actividad.filas.length === 0 ? (
          <p className="font-sans text-sm text-tinta/70">Todavía no hay nada en el historial de cambios.</p>
        ) : (
          <ListaBitacora filas={actividad.filas.slice(0, 8)} />
        )}
      </Tarjeta>
    </div>
  );
}
