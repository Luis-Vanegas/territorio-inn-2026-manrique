import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Fragment } from 'react';

import { PestanasEstado } from '@/components/admin/PestanasEstado';
import { exigirEquipo } from '@/lib/auth/firmamento';
import {
  listarParaModerar,
  contarPorEstado,
  listarCategorias,
  type EstadoPortafolio,
} from '@/lib/db/portafolios.repo';
import { listarTodosLosCampos } from '@/lib/db/camposPersonalizados.repo';
import { estadoDeFicha } from '@/lib/db/equipo.repo';
import { accesosDeNegocios, listarCuentas } from '@/lib/db/accesos.repo';
import { origenDe } from '@/lib/sitio';
import { AccesoNegocio, ListaCuentas } from './_components/AccesoNegocio';
import { FichaModeracion } from './_components/FichaModeracion';

export const metadata: Metadata = { title: 'Fichas de aliados' };

// La cola cambia con cada registro nuevo: no se cachea.
export const dynamic = 'force-dynamic';

const RUTA = '/firmamento/equipo/aliados';

const ESTADOS: { id: EstadoPortafolio; etiqueta: string }[] = [
  { id: 'pendiente', etiqueta: 'Pendientes' },
  { id: 'aprobado', etiqueta: 'Publicados' },
  { id: 'rechazado', etiqueta: 'Rechazados' },
  { id: 'archivado', etiqueta: 'Archivados' },
];

/**
 * Todas las fichas por estado. `?ficha=<id>` muestra solo esa (y, si está
 * publicada, con la edición abierta): es a donde llevan «Cambios recientes» y
 * las alertas de calidad de Moderación.
 */
export default async function AliadosEquipoPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; ficha?: string }>;
}) {
  await exigirEquipo();

  const { estado: solicitado, ficha } = await searchParams;
  // Con `?ficha=` y sin estado, se abre en la pestaña donde está la ficha hoy.
  const estadoActivo: EstadoPortafolio = ESTADOS.some((e) => e.id === solicitado)
    ? (solicitado as EstadoPortafolio)
    : ((ficha ? await estadoDeFicha(ficha) : null) ?? 'pendiente');

  const [todos, conteos, definicionesCampos, categorias] = await Promise.all([
    listarParaModerar(estadoActivo),
    contarPorEstado(),
    listarTodosLosCampos(),
    listarCategorias(),
  ]);
  const registros = ficha ? todos.filter((r) => r.id === ficha) : todos;

  // Cuenta y acceso de cada ficha (no de las archivadas: ya no se manejan).
  const conAcceso = registros.filter((r) => r.estado !== 'archivado');
  const [accesos, cuentas] = conAcceso.length
    ? await Promise.all([accesosDeNegocios(conAcceso.map((r) => r.id)), listarCuentas()])
    : [[], []];
  const accesoDe = new Map(accesos.map((a) => [a.id, a]));
  const origen = origenDe(await headers());

  return (
    <div>
      <p className="max-w-2xl font-sans text-base leading-relaxed text-tinta/70">
        Cada registro aprobado se publica en el mapa de Aliados de inmediato. Las
        fichas publicadas se pueden corregir con «Editar ficha».
      </p>

      <PestanasEstado ruta={RUTA} estados={ESTADOS} activo={estadoActivo} conteos={conteos} />

      {ficha && (
        <p className="mt-6 font-sans text-sm text-tinta/70">
          Viendo una sola ficha.{' '}
          <Link
            href={`${RUTA}?estado=${estadoActivo}`}
            className="inline-flex min-h-[44px] items-center text-azul-texto underline underline-offset-4"
          >
            Ver toda la lista
          </Link>
        </p>
      )}

      <section aria-label="Fichas" className="mt-8">
        {registros.length === 0 ? (
          <p className="border-t border-tinta/12 pt-8 font-sans text-tinta/70">
            {ficha
              ? 'Esa ficha no está en este estado: puede que ya la hayan movido.'
              : estadoActivo === 'pendiente'
                ? 'No hay nada esperando revisión.'
                : 'No hay registros en este estado.'}
          </p>
        ) : (
          registros.map((r) => {
            const acceso = accesoDe.get(r.id);
            return (
              <Fragment key={r.id}>
                <FichaModeracion
                  portafolio={r}
                  definicionesCampos={definicionesCampos}
                  categorias={categorias}
                  editarAlAbrir={r.id === ficha}
                />
                {acceso && (
                  <AccesoNegocio
                    portafolioId={r.id}
                    negocio={r.nombre}
                    dueno={
                      acceso.dueno_nombre && acceso.dueno_correo
                        ? { nombre: acceso.dueno_nombre, correo: acceso.dueno_correo }
                        : null
                    }
                    enlace={`${origen}/aliados/estado/${acceso.token_publico}`}
                    whatsapp={r.whatsapp}
                  />
                )}
              </Fragment>
            );
          })
        )}
      </section>
      {cuentas.length > 0 && <ListaCuentas cuentas={cuentas} />}
    </div>
  );
}
