'use client';

import { useActionState, useState } from 'react';
import Image from 'next/image';

import type { ServicioPendiente } from '@/lib/db/servicios.repo';
import type { DatoReservado } from '@/lib/db/serviciosPrivado.repo';
import {
  moderarServicioAction,
  type EstadoModeracionServicio,
} from '@/lib/actions/moderarServicio';

const INICIAL: EstadoModeracionServicio = { estado: 'inicial' };

export function FichaServicio({
  servicio,
  reservado,
}: {
  servicio: ServicioPendiente;
  /** Foto y nombre completo, de `servicios_privado` — ver page.tsx. */
  reservado: DatoReservado | null;
}) {
  const [estadoMod, accionMod] = useActionState(moderarServicioAction, INICIAL);
  const [rechazando, setRechazando] = useState(false);

  return (
    <article className="border-t border-tinta/12 py-8">
      <div className="flex gap-5">
        <div>
          {reservado?.foto_url ? (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-tinta/5">
              <Image src={reservado.foto_url} alt="" fill sizes="96px" className="object-cover" />
            </div>
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-tinta/5 font-mono text-xs text-tinta/40">
              sin foto
            </div>
          )}
          {/* Recordatorio en el propio panel: esto no es una vitrina, es dato
              reservado — que se vea acá no significa que se pueda compartir. */}
          <p className="mt-1 w-24 text-center font-mono text-[9px] uppercase tracking-wider text-tinta/35">
            privada
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-2xl font-medium text-tinta">{servicio.nombre}</h3>

          {/* Nombre completo: solo acá, nunca en la vitrina pública. Es lo
              que permite identificar a la persona si hay un reporte. */}
          {reservado && (
            <p className="mt-0.5 font-mono text-xs text-tinta/45">
              {reservado.nombres} {reservado.apellidos}{' '}
              <span className="text-tinta/30">· nombre completo, privado</span>
            </p>
          )}

          <p className="mt-1 font-mono text-xs text-terracota">
            {servicio.categoria_id === 'otros' && servicio.categoria_otra
              ? servicio.categoria_otra
              : servicio.categoria_nombre}
            <span className="text-tinta/45">
              {' · '}
              {servicio.anos_experiencia} años · registrado {servicio.creado_en}
            </span>
          </p>

          <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-tinta/75">
            {servicio.descripcion}
          </p>

          <p className="mt-3 font-mono text-xs text-tinta/60">
            Tel: {servicio.telefono}
          </p>

          <p className="mt-2 font-mono text-[11px] text-tinta/50">
            Atiende en: {servicio.cobertura.join(' · ')}
          </p>

          {/* Moderación */}
          <form action={accionMod} className="mt-6 flex flex-col gap-3">
            <input type="hidden" name="id" value={servicio.id} />

            {rechazando && (
              <textarea
                name="motivo_rechazo"
                rows={2}
                placeholder="Por qué se rechaza — la persona lo va a leer"
                className="w-full max-w-xl border border-tinta/20 bg-transparent px-3 py-2 font-sans text-sm text-tinta focus:border-terracota focus:outline-none"
              />
            )}

            <div className="flex flex-wrap items-center gap-3">
              {!rechazando ? (
                <>
                  <button
                    type="submit"
                    name="accion"
                    value="aprobar"
                    className="min-h-11 border border-terracota bg-terracota px-5 py-2 font-mono text-xs text-hueso transition-opacity hover:opacity-90"
                  >
                    Publicar
                  </button>
                  <button
                    type="button"
                    onClick={() => setRechazando(true)}
                    className="min-h-11 border border-tinta/25 px-5 py-2 font-mono text-xs text-tinta/70 transition-colors hover:border-terracota hover:text-terracota"
                  >
                    Rechazar
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="submit"
                    name="accion"
                    value="rechazar"
                    className="min-h-11 border border-terracota px-5 py-2 font-mono text-xs text-terracota transition-colors hover:bg-terracota hover:text-hueso"
                  >
                    Confirmar rechazo
                  </button>
                  <button
                    type="button"
                    onClick={() => setRechazando(false)}
                    className="min-h-11 font-mono text-xs text-tinta/55 hover:text-tinta"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>

            {estadoMod.estado !== 'inicial' && (
              <p
                role="status"
                className={`font-mono text-xs ${estadoMod.estado === 'ok' ? 'text-tinta/60' : 'text-terracota'}`}
              >
                {estadoMod.mensaje}
              </p>
            )}
          </form>
        </div>
      </div>
    </article>
  );
}
