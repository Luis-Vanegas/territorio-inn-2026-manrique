'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useFormState, useFormStatus } from 'react-dom';

import {
  moderarPortafolio,
  type EstadoModeracion,
} from '@/lib/actions/moderarPortafolio';
import type { PortafolioAdmin } from '@/lib/db/portafolios.repo';
import type { DefinicionCampo } from '@/lib/db/camposPersonalizados.repo';
import { formatearCamposExtra } from '@/lib/camposExtra';

const ESTADO_INICIAL: EstadoModeracion = { estado: 'inicial' };

function Boton({
  accion,
  etiqueta,
  variante,
}: {
  accion: string;
  etiqueta: string;
  variante: 'primaria' | 'secundaria';
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name="accion"
      value={accion}
      disabled={pending}
      className={[
        'border px-4 py-2 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        variante === 'primaria'
          ? 'border-terracota bg-terracota text-hueso hover:bg-transparent hover:text-terracota'
          : 'border-tinta/20 text-tinta/65 hover:border-terracota hover:text-terracota',
      ].join(' ')}
    >
      {etiqueta}
    </button>
  );
}

const ETIQUETA_HORARIO: Record<string, string> = {
  mananas: 'Mañanas',
  tardes: 'Tardes',
  noches: 'Noches',
  fines_semana: 'Fines de semana',
  bajo_pedido: 'Bajo pedido o cita',
};
const ETIQUETA_MEDIO_PAGO: Record<string, string> = {
  efectivo: 'Efectivo',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  transferencia: 'Transferencia',
  datafono: 'Datáfono',
};

/** Solo los campos con valor: una lista con cinco "—" no informa nada. */
function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-wide text-tinta/40">
        {etiqueta}
      </dt>
      <dd className="font-sans text-sm text-tinta/75">{valor}</dd>
    </div>
  );
}

export function FichaModeracion({
  portafolio,
  definicionesCampos,
}: {
  portafolio: PortafolioAdmin;
  definicionesCampos: DefinicionCampo[];
}) {
  const [estado, accion] = useFormState(moderarPortafolio, ESTADO_INICIAL);
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const camposExtra = formatearCamposExtra(portafolio.campos_extra, definicionesCampos);

  // Aprobado o rechazado, la ficha desaparece de la lista al revalidar.
  // Este mensaje cubre el instante entre la respuesta y el refresco.
  if (estado.estado === 'ok') {
    return (
      <article className="border-t border-tinta/12 py-6">
        <p className="font-mono text-xs text-terracota">
          {portafolio.nombre} — {estado.mensaje}
        </p>
      </article>
    );
  }

  return (
    <article className="border-t border-tinta/12 py-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <span className="font-mono text-[11px] uppercase tracking-wider text-terracota">
            {portafolio.categoria_nombre}
          </span>

          <h3 className="mt-2 font-display text-2xl font-medium leading-tight text-tinta">
            {portafolio.nombre}
          </h3>

          {portafolio.descripcion && (
            <p className="mt-3 max-w-prose font-sans text-sm leading-relaxed text-tinta/70">
              {portafolio.descripcion}
            </p>
          )}

          <dl className="mt-5 flex flex-col gap-1.5">
            <Dato etiqueta="Dirección" valor={portafolio.direccion} />
            <Dato etiqueta="Barrio" valor={portafolio.barrio} />
            <Dato etiqueta="Referencia" valor={portafolio.punto_referencia} />
            <Dato
              etiqueta="Coords"
              valor={`${portafolio.latitud.toFixed(6)}, ${portafolio.longitud.toFixed(6)}`}
            />
            <Dato etiqueta="Otra categoría" valor={portafolio.categoria_otra} />
            <Dato etiqueta="WhatsApp" valor={portafolio.whatsapp} />
            <Dato etiqueta="Teléfono" valor={portafolio.telefono} />
            <Dato etiqueta="Correo" valor={portafolio.correo} />
            <Dato etiqueta="Instagram" valor={portafolio.instagram} />
            <Dato etiqueta="Facebook" valor={portafolio.facebook} />
            <Dato
              etiqueta="Horario"
              valor={
                portafolio.horario.length > 0
                  ? portafolio.horario.map((h) => ETIQUETA_HORARIO[h] ?? h).join(', ')
                  : null
              }
            />
            <Dato
              etiqueta="Pagos"
              valor={
                portafolio.medios_pago.length > 0
                  ? portafolio.medios_pago.map((m) => ETIQUETA_MEDIO_PAGO[m] ?? m).join(', ')
                  : null
              }
            />
            <Dato
              etiqueta="Recibido"
              valor={new Date(portafolio.creado_en).toLocaleString('es-CO', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            />
            {camposExtra.map((c) => (
              <Dato key={c.etiqueta} etiqueta={c.etiqueta} valor={c.valor} />
            ))}
          </dl>
        </div>

        {portafolio.foto_url && (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-tinta/5 sm:w-56">
            <Image
              src={portafolio.foto_url}
              alt={`Foto enviada por ${portafolio.nombre}`}
              fill
              sizes="224px"
              className="object-cover"
            />
          </div>
        )}
      </div>

      <form action={accion} className="mt-6">
        <input type="hidden" name="id" value={portafolio.id} />

        {mostrarRechazo && (
          <div className="mb-4 max-w-xl">
            <label
              htmlFor={`motivo-${portafolio.id}`}
              className="block font-sans text-sm font-medium text-tinta"
            >
              Motivo del rechazo
            </label>
            <p className="mt-1 font-sans text-xs text-tinta/50">
              Lo va a leer el emprendedor. Explicá qué corregir.
            </p>
            <textarea
              id={`motivo-${portafolio.id}`}
              name="motivo_rechazo"
              rows={3}
              minLength={10}
              className="mt-2 w-full border border-tinta/20 bg-transparent p-3 font-sans text-sm text-tinta focus:border-terracota focus:outline-none"
            />
          </div>
        )}

        {estado.estado === 'error' && (
          <p role="alert" className="mb-3 font-mono text-xs text-terracota">
            {estado.mensaje}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {!mostrarRechazo ? (
            <>
              <Boton accion="aprobar" etiqueta="Aprobar y publicar" variante="primaria" />
              <button
                type="button"
                onClick={() => setMostrarRechazo(true)}
                className="border border-tinta/20 px-4 py-2 font-mono text-xs text-tinta/65 transition-colors hover:border-terracota hover:text-terracota"
              >
                Rechazar…
              </button>
            </>
          ) : (
            <>
              <Boton accion="rechazar" etiqueta="Confirmar rechazo" variante="primaria" />
              <button
                type="button"
                onClick={() => setMostrarRechazo(false)}
                className="border border-tinta/20 px-4 py-2 font-mono text-xs text-tinta/65 transition-colors hover:border-terracota hover:text-terracota"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </form>
    </article>
  );
}
