'use client';

import { useActionState, useId } from 'react';
import { useFormStatus } from 'react-dom';

import { CompartirEnlace } from '@/components/firmamento/CompartirEnlace';
import { CLASE_BOTON_PANEL } from '@/components/firmamento/panel/Tarjeta';
import {
  crearInvitacionAction,
  revocarInvitacionAction,
  type EstadoInvitacion,
  type EstadoRevocar,
} from '@/lib/actions/gestionarInvitaciones';
import type { InvitacionPendiente } from '@/lib/db/invitaciones.repo';

function Enviar({ texto, pendiente }: { texto: string; pendiente: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={CLASE_BOTON_PANEL}>
      {pending ? pendiente : texto}
    </button>
  );
}

/**
 * Crea una invitación (entidad o moderador) y muestra el enlace UNA vez, listo
 * para WhatsApp o para copiar. La base solo guarda su hash: si se pierde, se
 * revoca y se crea otra. Lo usan Entidades y Moderadores del panel del equipo.
 */
export function FormularioInvitacion({
  tipo,
  entidadId,
  destino,
}: {
  tipo: 'entidad' | 'moderador';
  entidadId?: string;
  /** Para el mensaje: «el panel de la JAL Comuna 3», «el panel del equipo». */
  destino: string;
}) {
  const [estado, accion] = useActionState<EstadoInvitacion, FormData>(crearInvitacionAction, { estado: 'inicial' });
  const id = useId();

  return (
    <div>
      <form action={accion}>
        <input type="hidden" name="tipo" value={tipo} />
        {entidadId && <input type="hidden" name="entidad_id" value={entidadId} />}
        <label htmlFor={`${id}-nota`} className="block font-sans text-sm font-medium text-tinta">
          Para quién es <span className="font-normal text-tinta/70">(opcional, solo lo ve el equipo)</span>
        </label>
        <div className="mt-1 flex flex-wrap gap-2">
          <input
            id={`${id}-nota`}
            name="nota"
            maxLength={80}
            autoComplete="off"
            placeholder="Ej.: María, secretaria"
            className="block min-h-[44px] min-w-0 flex-1 basis-56 rounded-lg border border-tinta/55 bg-tinta/[0.03] px-3 font-sans text-base text-tinta placeholder:text-tinta/65"
          />
          <Enviar texto="Crear enlace" pendiente="Creando…" />
        </div>
        <p className="mt-1 font-sans text-sm text-tinta/70">
          Sirve una sola vez y vence en 7 días. Quien lo abra entra con su cuenta de Google.
        </p>
      </form>

      {estado.estado === 'error' && (
        <p role="alert" className="mt-2 font-sans text-sm text-morado-texto">
          {estado.mensaje}
        </p>
      )}
      {estado.estado === 'ok' && (
        <div className="mt-4" role="status">
          <p className="mb-2 font-sans text-sm font-medium text-tinta">
            Enlace creado. Cópialo o envíalo ahora: por seguridad no se vuelve a mostrar.
          </p>
          <CompartirEnlace
            mensaje={`Hola. Te invitamos a ${destino} en Firmamento (Constelaciones). Abre este enlace y entra con tu cuenta de Google: ${estado.enlace} — Sirve una sola vez y vence en 7 días. No lo reenvíes.`}
          />
        </div>
      )}
    </div>
  );
}

function BotonRevocar({ id, nota }: { id: string; nota: string | null }) {
  const [estado, accion] = useActionState<EstadoRevocar, FormData>(revocarInvitacionAction, { estado: 'inicial' });
  return (
    <form
      action={accion}
      onSubmit={(e) => {
        if (!window.confirm('¿Revocar esta invitación? El enlace deja de servir.')) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label={`Revocar invitación${nota ? ` para ${nota}` : ''}`}
        className={CLASE_BOTON_PANEL}
      >
        Revocar
      </button>
      {estado.estado === 'error' && (
        <p role="alert" className="mt-1 font-sans text-sm text-morado-texto">
          {estado.mensaje}
        </p>
      )}
    </form>
  );
}

/** Invitaciones que todavía sirven, con su botón de revocar. */
export function InvitacionesPendientes({ invitaciones }: { invitaciones: readonly InvitacionPendiente[] }) {
  if (invitaciones.length === 0) return null;
  return (
    <ul aria-label="Invitaciones pendientes" className="mt-4 flex flex-col">
      {invitaciones.map((inv) => (
        <li
          key={inv.id}
          className="flex flex-wrap items-center justify-between gap-3 border-t border-tinta/12 py-2.5 first:border-t-0"
        >
          <div className="min-w-0">
            <p className="font-sans text-sm text-tinta">{inv.nota ?? 'Invitación sin nota'}</p>
            <p className="font-sans text-xs text-tinta/70">
              Creada el {inv.creada_en} por {inv.creada_por} · vence el {inv.expira_en}
            </p>
          </div>
          <BotonRevocar id={inv.id} nota={inv.nota} />
        </li>
      ))}
    </ul>
  );
}
