import type { Metadata } from 'next';

import { FormularioInvitacion, InvitacionesPendientes } from '@/components/firmamento/Invitaciones';
import { Tarjeta } from '@/components/firmamento/panel/Tarjeta';
import { exigirEquipo } from '@/lib/auth/firmamento';
import { listarModeradores, type Moderador } from '@/lib/db/accesos.repo';
import { listarInvitacionesPendientes } from '@/lib/db/invitaciones.repo';
import { BotonDesactivar } from './_components/BotonDesactivar';

export const metadata: Metadata = { title: 'Moderadores' };

export const dynamic = 'force-dynamic';

/** Por dónde entra cada moderador, en palabras. */
function vias(m: Moderador): string {
  const v = [
    m.con_contrasena && 'contraseña',
    m.con_google && 'Google',
    m.en_entorno && 'también en ADMIN_GOOGLE_SUBS',
  ].filter(Boolean);
  return v.length ? v.join(' · ') : 'todavía no ha entrado';
}

/**
 * Quién tiene el panel del equipo (`admins`). Se invita con un enlace de un solo
 * uso que ata la cuenta de Google de la persona (`admins.google_sub`); se quita
 * con «Quitar acceso» (`activo = false`, vale de inmediato). ADMIN_GOOGLE_SUBS
 * sigue como respaldo del despliegue. Actions en lib/actions/gestionarModeradores.ts
 * y lib/actions/gestionarInvitaciones.ts.
 */
export default async function ModeradoresPage() {
  const { nombre: yo } = await exigirEquipo();

  const [moderadores, invitaciones] = await Promise.all([
    listarModeradores(),
    listarInvitacionesPendientes('moderador'),
  ]);
  const activos = moderadores.filter((m) => m.activo);
  const inactivos = moderadores.filter((m) => !m.activo);

  return (
    <div className="flex flex-col gap-6">
      <Tarjeta titulo="Invitar moderador" id="titulo-invitar">
        <FormularioInvitacion tipo="moderador" destino="el panel del equipo" />
        <InvitacionesPendientes invitaciones={invitaciones} />
      </Tarjeta>

      <Tarjeta titulo="Con acceso" id="titulo-activos" resumen={activos.length}>
        <ul aria-labelledby="titulo-activos" className="flex flex-col">
          {activos.map((m) => (
            <li
              key={m.email}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-tinta/12 py-2.5 first:border-t-0"
            >
              <div className="min-w-0">
                <p className="font-sans text-base text-tinta">
                  {m.nombre}
                  {m.email === yo && <span className="font-sans text-sm text-tinta/70"> (tú)</span>}
                </p>
                <p className="break-all font-sans text-sm text-tinta/70">{m.email}</p>
                <p className="font-sans text-xs text-tinta/70">Entra con: {vias(m)}</p>
              </div>
              {m.email !== yo && activos.length > 1 && <BotonDesactivar email={m.email} nombre={m.nombre} />}
            </li>
          ))}
        </ul>
      </Tarjeta>

      {inactivos.length > 0 && (
        <Tarjeta titulo="Sin acceso" id="titulo-inactivos" resumen={inactivos.length} plegable>
          <p className="font-sans text-sm text-tinta/70">
            Para devolverle el acceso a alguien, envíale una invitación de moderador.
          </p>
          <ul aria-labelledby="titulo-inactivos" className="mt-3 flex flex-col">
            {inactivos.map((m) => (
              <li key={m.email} className="border-t border-tinta/12 py-2.5 first:border-t-0">
                <p className="font-sans text-base text-tinta">{m.nombre}</p>
                <p className="break-all font-sans text-sm text-tinta/70">{m.email}</p>
                <p className="font-sans text-xs text-tinta/70">
                  {m.desactivado_en
                    ? `Sin acceso desde el ${m.desactivado_en}${m.desactivado_por ? ` · lo quitó ${m.desactivado_por}` : ''}`
                    : `Sin acceso · ${vias(m)}`}
                </p>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}
    </div>
  );
}
