import type { Metadata } from 'next';

import { Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { FormularioInvitacion, InvitacionesPendientes } from '@/components/firmamento/Invitaciones';
import { listarEntidades, listarMiembros } from '@/lib/db/entidades.repo';
import { listarInvitacionesPendientes } from '@/lib/db/invitaciones.repo';
import { BotonQuitarMiembro, FormularioMiembro, FormularioNuevaEntidad } from './_components/FormulariosEntidad';

export const metadata: Metadata = { title: 'Entidades' };

export const dynamic = 'force-dynamic';

const TIPO = { territorial: 'Territorial', oferente: 'Oferente' } as const;

/**
 * Entidades y quién entra por cada una. Tener una fila en `miembros_entidad`
 * es lo que abre el panel de entidad (solo agregados k = 5 y convocatorias);
 * el tipo no da acceso. Las Server Actions están en lib/actions/gestionarEntidades.ts.
 */
export default async function EntidadesPage() {
  await exigirEquipo();

  const entidades = await listarEntidades();
  // ponytail: una consulta de miembros por entidad; son decenas, no miles.
  // Si crecen, una sola consulta agrupada en entidades.repo.ts.
  const [miembros, invitaciones] = await Promise.all([
    Promise.all(entidades.map((e) => listarMiembros(e.id))),
    listarInvitacionesPendientes('entidad'),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl font-sans text-base leading-relaxed text-tinta/70">
        Las territoriales (JAL, CEDEZO…) miran el observatorio; las oferentes
        publican convocatorias. Para darle acceso a una persona, agrégala como
        miembro con el correo de su cuenta de Google: antes tiene que haber entrado
        una vez en Constelaciones con ese correo. Una entidad solo ve datos
        agregados, nunca fichas de negocios.
      </p>

      <Tarjeta titulo="Nueva entidad" id="titulo-nueva">
        <FormularioNuevaEntidad />
      </Tarjeta>

      {entidades.map((e, i) => (
        <Tarjeta
          key={e.id}
          titulo={e.nombre}
          id={`entidad-${e.id}`}
          accion={
            <span className="font-sans text-sm text-tinta/70">
              {TIPO[e.tipo]}
              {!e.activa && ' · inactiva'}
            </span>
          }
        >
          {e.sitio && (
            <a
              href={e.sitio}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center break-all font-sans text-sm text-azul-texto underline underline-offset-4"
            >
              {e.sitio.replace(/^https?:\/\//, '')} (se abre en otra pestaña)
            </a>
          )}
          {miembros[i]!.length === 0 ? (
            <p className="font-sans text-sm text-tinta/70">Nadie entra todavía por esta entidad.</p>
          ) : (
            <ul aria-label={`Miembros de ${e.nombre}`} className="flex flex-col">
              {miembros[i]!.map((m) => (
                <li
                  key={m.usuario_id}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-tinta/12 py-2.5 first:border-t-0"
                >
                  <div className="min-w-0">
                    <p className="font-sans text-base text-tinta">{m.nombre}</p>
                    <p className="break-all font-sans text-sm text-tinta/70">{m.correo}</p>
                    <p className="font-sans text-xs text-tinta/70 tabular-nums">
                      desde {m.creado_en}
                      {m.agregado_por && ` · lo agregó ${m.agregado_por}`}
                    </p>
                  </div>
                  <BotonQuitarMiembro entidadId={e.id} usuarioId={m.usuario_id} nombre={m.nombre} />
                </li>
              ))}
            </ul>
          )}
          <FormularioMiembro entidadId={e.id} entidadNombre={e.nombre} />
          {e.activa && (
            <div className="mt-6 border-t border-tinta/12 pt-4">
              <h3 className="font-sans text-sm font-medium text-tinta">Invitar a alguien de esta entidad</h3>
              <p className="mt-1 font-sans text-sm text-tinta/70">
                Para quien todavía no ha entrado a Constelaciones: le llega un enlace y entra con Google.
              </p>
              <div className="mt-3">
                <FormularioInvitacion tipo="entidad" entidadId={e.id} destino={`el panel de ${e.nombre}`} />
              </div>
              <InvitacionesPendientes invitaciones={invitaciones.filter((inv) => inv.entidad_id === e.id)} />
            </div>
          )}
        </Tarjeta>
      ))}
    </div>
  );
}
