import type { Metadata } from 'next';
import Link from 'next/link';

import { ListaBitacora, textoCampos } from '@/components/firmamento/panel/Bitacora';
import { CLASE_BOTON_PANEL, SubPestanas, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { listarBitacora } from '@/lib/db/bitacora.repo';
import { listarTodosLosCampos } from '@/lib/db/camposPersonalizados.repo';
import { cambiosDeDuenos, fichasParaCalidad } from '@/lib/db/equipo.repo';
import { listarCategorias, listarParaModerar } from '@/lib/db/portafolios.repo';
import { fichasConCategoriaRevisada } from '@/lib/db/sugerencias.repo';
import { alertasDeCalidad, type TipoAlerta } from '@/lib/firmamento/calidad';
import { FichaModeracion } from '../aliados/_components/FichaModeracion';
import { SugeridorModeracion } from './_components/SugeridorModeracion';

export const metadata: Metadata = { title: 'Moderación' };

export const dynamic = 'force-dynamic';

const RUTA = '/firmamento/equipo/moderacion';

const VISTAS = ['revisar', 'cambios', 'alertas', 'historial'] as const;
type Vista = (typeof VISTAS)[number];

const TITULO_ALERTA: Record<TipoAlerta, string> = {
  fuera: 'Fuera de la comuna',
  barrio: 'Barrio',
  otros: 'Categoría «Otros»',
  incompleta: 'Ficha incompleta',
};

const enlaceFicha = (id: string) => `/firmamento/equipo/aliados?ficha=${id}`;

function Paginacion({ vista, pagina, hayMas }: { vista: Vista; pagina: number; hayMas: boolean }) {
  if (pagina === 1 && !hayMas) return null;
  return (
    <nav aria-label="Páginas" className="mt-6 flex flex-wrap items-center gap-3">
      {pagina > 1 && (
        <Link href={`${RUTA}?vista=${vista}&pagina=${pagina - 1}`} className={CLASE_BOTON_PANEL}>
          ← Más recientes
        </Link>
      )}
      <span className="font-sans text-sm text-tinta/70">
        Página <span className="font-sans tabular-nums">{pagina}</span>
      </span>
      {hayMas && (
        <Link href={`${RUTA}?vista=${vista}&pagina=${pagina + 1}`} className={CLASE_BOTON_PANEL}>
          Más antiguos →
        </Link>
      )}
    </nav>
  );
}

/**
 * Moderación en cuatro vistas por URL (`?vista=`):
 * - Por revisar: registros pendientes, con las acciones de siempre
 *   (`moderarPortafolio`; el rechazo pide un motivo de 10 caracteres o más).
 * - Cambios recientes: lo que editaron los dueños. Su edición se publica
 *   directo (docs/firmamento-modulos.md, decisión 2); el equipo corrige después.
 * - Alertas de calidad: calculadas al vuelo, sin tabla (lib/firmamento/calidad.ts).
 * - Historial: la bitácora completa, paginada (en pantalla, «historial de cambios»).
 */
export default async function ModeracionPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; pagina?: string }>;
}) {
  await exigirEquipo();

  const params = await searchParams;
  const vista: Vista = VISTAS.find((v) => v === params.vista) ?? 'revisar';
  const pagina = Math.max(1, Number.parseInt(params.pagina ?? '1', 10) || 1);

  // Los conteos de las pestañas salen de las mismas lecturas que pintan cada vista.
  const [pendientes, fichas] = await Promise.all([listarParaModerar('pendiente'), fichasParaCalidad()]);
  const alertas = alertasDeCalidad(fichas);

  const pestanas = (
    <SubPestanas
      etiqueta="Vistas de moderación"
      items={[
        { href: `${RUTA}?vista=revisar`, texto: 'Por revisar', corta: 'Revisar', n: pendientes.length, activo: vista === 'revisar' },
        { href: `${RUTA}?vista=cambios`, texto: 'Cambios recientes', corta: 'Cambios', activo: vista === 'cambios' },
        { href: `${RUTA}?vista=alertas`, texto: 'Alertas de calidad', corta: 'Alertas', n: alertas.length, activo: vista === 'alertas' },
        { href: `${RUTA}?vista=historial`, texto: 'Historial', corta: 'Historial', activo: vista === 'historial' },
      ]}
    />
  );

  if (vista === 'revisar') {
    const [definicionesCampos, categorias, revisadas] = await Promise.all([
      listarTodosLosCampos(),
      listarCategorias(),
      fichasConCategoriaRevisada(pendientes.map((r) => r.id)),
    ]);
    return (
      <div>
        {pestanas}
        <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-tinta/70">
          Registros nuevos que esperan una decisión. Al aprobar, la ficha sale en el
          mapa de Aliados de inmediato; al rechazar, el negocio lee tu motivo.
        </p>
        <section aria-label="Registros por revisar" className="mt-6">
          {pendientes.length === 0 ? (
            <p className="border-t border-tinta/12 pt-8 font-sans text-tinta/70">No hay nada esperando revisión.</p>
          ) : (
            pendientes.map((r) => (
              <FichaModeracion
                key={r.id}
                portafolio={r}
                definicionesCampos={definicionesCampos}
                categorias={categorias}
                categoriaRevisada={revisadas.has(r.id)}
              />
            ))
          )}
        </section>
      </div>
    );
  }

  if (vista === 'cambios') {
    const { filas, hayMas } = await cambiosDeDuenos(pagina);
    return (
      <div>
        {pestanas}
        <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-tinta/70">
          Lo que los dueños cambiaron en su ficha. Se publica sin esperar: si algo
          quedó mal, corrígelo desde la ficha. El historial de cambios guarda qué campos
          cambiaron, nunca los valores anteriores.
        </p>
        <Tarjeta titulo="Ediciones de los dueños" id="titulo-cambios" className="mt-6">
          {filas.length === 0 ? (
            <p className="font-sans text-sm text-tinta/70">Ningún dueño ha editado su ficha todavía.</p>
          ) : (
            <ul className="flex flex-col">
              {filas.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-tinta/12 py-3 first:border-t-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="font-sans text-base font-medium text-tinta">{f.portafolio_nombre}</p>
                    <p className="mt-0.5 font-sans text-sm text-tinta/70">
                      Cambió: {f.campos.length > 0 ? textoCampos(f.campos) : 'nada que se pueda nombrar'}
                    </p>
                    <p className="mt-0.5 font-sans tabular-nums text-xs text-tinta/70">{f.creado_en}</p>
                  </div>
                  <Link href={enlaceFicha(f.portafolio_id)} className={CLASE_BOTON_PANEL}>
                    {f.estado === 'aprobado' ? 'Revisar y corregir' : 'Ver la ficha'}
                    <span className="sr-only"> {f.portafolio_nombre}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Paginacion vista="cambios" pagina={pagina} hayMas={hayMas} />
        </Tarjeta>
      </div>
    );
  }

  if (vista === 'alertas') {
    const [categorias, revisadas] = await Promise.all([
      listarCategorias(),
      fichasConCategoriaRevisada(alertas.filter((a) => a.tipo === 'otros').map((a) => a.ficha.id)),
    ]);
    const otros = { id: 'otros', nombre: categorias.find((c) => c.id === 'otros')?.nombre ?? 'Otros' };
    return (
      <div>
        {pestanas}
        <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-tinta/70">
          Se calculan cada vez que abres esta página sobre las fichas publicadas y
          por revisar: un punto fuera de la Comuna 3, un barrio que no coincide con
          el del punto, la categoría «Otros» y fichas sin foto o sin WhatsApp. Al
          corregir la ficha, la alerta desaparece.
        </p>
        {alertas.length === 0 ? (
          <Tarjeta titulo="Alertas de calidad" id="titulo-alertas" className="mt-6">
            <p className="font-sans text-sm text-tinta/70">Ninguna ficha tiene alertas.</p>
          </Tarjeta>
        ) : (
          <section aria-label="Lista de alertas de calidad" className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
            {alertas.map((a) => (
              <Tarjeta key={`${a.ficha.id}-${a.tipo}`} titulo={a.ficha.nombre} id={`alerta-${a.ficha.id}-${a.tipo}`}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-tinta/15 bg-tinta/5 px-2.5 py-0.5 font-sans text-xs font-medium text-tinta/80">
                      {TITULO_ALERTA[a.tipo]}
                    </span>
                    {a.ficha.barrio && (
                      <span className="rounded-full bg-tinta/5 px-2.5 py-0.5 font-sans text-xs text-tinta/70">
                        {a.ficha.barrio}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-sans text-xs font-medium ${
                        a.ficha.estado === 'pendiente' ? 'bg-amarillo text-noche' : 'bg-tinta/5 text-tinta/70'
                      }`}
                    >
                      {a.ficha.estado === 'pendiente' ? 'Por revisar' : 'Publicado'}
                    </span>
                  </div>

                  <p className="mt-3 font-sans text-sm leading-relaxed text-tinta/75">
                    {a.texto}
                  </p>

                  {a.textoParaSugerir && (
                    <SugeridorModeracion
                      portafolioId={a.ficha.id}
                      texto={a.textoParaSugerir}
                      actual={otros}
                      categorias={categorias}
                      revisada={revisadas.has(a.ficha.id)}
                    />
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-tinta/10 pt-4">
                  <span className="font-sans text-xs text-tinta/60">
                    {a.ficha.estado === 'aprobado' ? 'Ficha activa en el mapa' : 'En espera de aprobación'}
                  </span>
                  <Link href={enlaceFicha(a.ficha.id)} className={CLASE_BOTON_PANEL}>
                    {a.ficha.estado === 'aprobado' ? 'Corregir la ficha' : 'Ver la ficha'} →
                    <span className="sr-only"> {a.ficha.nombre}</span>
                  </Link>
                </div>
              </Tarjeta>
            ))}
          </section>
        )}
      </div>
    );
  }

  const { filas, hayMas } = await listarBitacora({ pagina });
  return (
    <div>
      {pestanas}
      <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-tinta/70">
        Todo lo que pasó con los negocios y las convocatorias, del más reciente al más antiguo: quién registró,
        editó, aprobó o rechazó, y cuándo. Guarda qué campos cambiaron, nunca los datos que había antes.
      </p>
      <Tarjeta titulo="Historial de cambios" id="titulo-historial" className="mt-6">
        {filas.length === 0 ? (
          <p className="font-sans text-sm text-tinta/70">Todavía no hay nada en el historial de cambios.</p>
        ) : (
          <ListaBitacora filas={filas} />
        )}
        <Paginacion vista="historial" pagina={pagina} hayMas={hayMas} />
      </Tarjeta>
    </div>
  );
}
