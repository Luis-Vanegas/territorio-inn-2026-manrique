import type { Metadata } from 'next';
import Link from 'next/link';

import { ListaBitacora, textoCampos } from '@/components/firmamento/panel/Bitacora';
import { CLASE_BOTON_PANEL, SubPestanas, Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { listarBitacora } from '@/lib/db/bitacora.repo';
import { listarTodosLosCampos } from '@/lib/db/camposPersonalizados.repo';
import { cambiosDeDuenos, fichasParaCalidad } from '@/lib/db/equipo.repo';
import { listarCategorias, listarParaModerar } from '@/lib/db/portafolios.repo';
import { alertasDeCalidad, type TipoAlerta } from '@/lib/firmamento/calidad';
import { FichaModeracion } from '../aliados/_components/FichaModeracion';
import { SugerenciaOtros } from './_components/SugerenciaOtros';

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
      <span className="font-sans text-sm text-tenue">
        Página <span className="font-cifra">{pagina}</span>
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
 * - Historial: la bitácora completa, paginada.
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
        { href: `${RUTA}?vista=revisar`, texto: 'Por revisar', n: pendientes.length, activo: vista === 'revisar' },
        { href: `${RUTA}?vista=cambios`, texto: 'Cambios recientes', activo: vista === 'cambios' },
        { href: `${RUTA}?vista=alertas`, texto: 'Alertas de calidad', n: alertas.length, activo: vista === 'alertas' },
        { href: `${RUTA}?vista=historial`, texto: 'Historial', activo: vista === 'historial' },
      ]}
    />
  );

  if (vista === 'revisar') {
    const [definicionesCampos, categorias] = await Promise.all([listarTodosLosCampos(), listarCategorias()]);
    return (
      <div>
        {pestanas}
        <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-tenue">
          Registros nuevos que esperan una decisión. Al aprobar, la ficha sale en el
          mapa de Aliados de inmediato; al rechazar, el negocio lee tu motivo.
        </p>
        <section aria-label="Registros por revisar" className="mt-6">
          {pendientes.length === 0 ? (
            <p className="border-t border-tinta/12 pt-8 font-sans text-tenue">No hay nada esperando revisión.</p>
          ) : (
            pendientes.map((r) => (
              <FichaModeracion key={r.id} portafolio={r} definicionesCampos={definicionesCampos} categorias={categorias} />
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
        <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-tenue">
          Lo que los dueños cambiaron en su ficha. Se publica sin esperar: si algo
          quedó mal, corrígelo desde la ficha. La bitácora guarda qué campos
          cambiaron, nunca los valores anteriores.
        </p>
        <Tarjeta titulo="Ediciones de los dueños" id="titulo-cambios" className="mt-6">
          {filas.length === 0 ? (
            <p className="font-sans text-sm text-tenue">Ningún dueño ha editado su ficha todavía.</p>
          ) : (
            <ul className="flex flex-col">
              {filas.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-trazo py-3 first:border-t-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="font-sans text-base font-medium text-estrella">{f.portafolio_nombre}</p>
                    <p className="mt-0.5 font-sans text-sm text-tenue">
                      Cambió: {f.campos.length > 0 ? textoCampos(f.campos) : 'nada que se pueda nombrar'}
                    </p>
                    <p className="mt-0.5 font-cifra text-xs text-tenue">{f.creado_en}</p>
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
    return (
      <div>
        {pestanas}
        <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-tenue">
          Se calculan cada vez que abres esta página sobre las fichas publicadas y
          por revisar: un punto fuera de la Comuna 3, un barrio que no coincide con
          el del punto, la categoría «Otros» y fichas sin foto o sin WhatsApp. Al
          corregir la ficha, la alerta desaparece.
        </p>
        <Tarjeta titulo="Alertas de calidad" id="titulo-alertas" className="mt-6">
          {alertas.length === 0 ? (
            <p className="font-sans text-sm text-tenue">Ninguna ficha tiene alertas.</p>
          ) : (
            <ul className="flex flex-col">
              {alertas.map((a) => (
                <li
                  key={`${a.ficha.id}-${a.tipo}`}
                  className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-t border-trazo py-3 first:border-t-0 first:pt-0"
                >
                  <div className="min-w-0 flex-1 basis-72">
                    <p className="font-sans text-base font-medium text-estrella">
                      {a.ficha.nombre}{' '}
                      <span className="ml-1 inline-block border border-trazo-2 px-2 py-0.5 align-middle font-sans text-xs font-normal text-tenue">
                        {TITULO_ALERTA[a.tipo]}
                      </span>
                      {a.ficha.estado === 'pendiente' && (
                        <span className="ml-1 inline-block border border-trazo-2 px-2 py-0.5 align-middle font-sans text-xs font-normal text-tenue">
                          Por revisar
                        </span>
                      )}
                    </p>
                    <p className="mt-1 font-sans text-sm leading-relaxed text-tenue">{a.texto}</p>
                    {a.textoParaSugerir && <SugerenciaOtros texto={a.textoParaSugerir} />}
                  </div>
                  <Link href={enlaceFicha(a.ficha.id)} className={CLASE_BOTON_PANEL}>
                    {a.ficha.estado === 'aprobado' ? 'Corregir la ficha' : 'Ver la ficha'}
                    <span className="sr-only"> {a.ficha.nombre}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    );
  }

  const { filas, hayMas } = await listarBitacora({ pagina });
  return (
    <div>
      {pestanas}
      <Tarjeta titulo="Historial" id="titulo-historial" className="mt-6">
        {filas.length === 0 ? (
          <p className="font-sans text-sm text-tenue">Todavía no hay nada en la bitácora.</p>
        ) : (
          <ListaBitacora filas={filas} />
        )}
        <Paginacion vista="historial" pagina={pagina} hayMas={hayMas} />
      </Tarjeta>
    </div>
  );
}
