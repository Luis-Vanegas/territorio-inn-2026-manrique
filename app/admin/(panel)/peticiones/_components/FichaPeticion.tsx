'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { atenderPeticion, type EstadoAtencion } from '@/lib/actions/atenderPeticion';
import type { Peticion } from '@/lib/db/peticiones.repo';

const ESTADO_INICIAL: EstadoAtencion = { estado: 'inicial' };

function BotonAtender() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-terracota-texto bg-terracota-texto px-4 py-2 font-mono text-xs text-hueso transition-colors hover:bg-transparent hover:text-terracota-texto disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? 'Guardando…' : 'Marcar como atendida'}
    </button>
  );
}

export function FichaPeticion({ peticion }: { peticion: Peticion }) {
  const [estado, accion] = useActionState(atenderPeticion, ESTADO_INICIAL);

  // Atendida: desaparece de la lista al revalidar. Esto cubre el instante
  // entre la respuesta y el refresco, mismo criterio que FichaModeracion.
  if (estado.estado === 'ok') {
    return (
      <article className="border-t border-tinta/12 py-6">
        <p className="font-mono text-xs text-terracota-texto">{peticion.nombre} — atendida.</p>
      </article>
    );
  }

  return (
    <article className="border-t border-tinta/12 py-8">
      <h3 className="font-display text-2xl font-medium leading-tight text-tinta">
        {peticion.nombre}
      </h3>

      <dl className="mt-4 flex flex-col gap-1.5">
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 font-mono text-xs uppercase tracking-wide text-tinta/40">
            Contacto
          </dt>
          <dd className="font-sans text-sm text-tinta/75">{peticion.contacto}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 font-mono text-xs uppercase tracking-wide text-tinta/40">
            Recibido
          </dt>
          <dd className="font-sans text-sm text-tinta/75">
            {new Date(peticion.creado_en).toLocaleString('es-CO', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </dd>
        </div>
      </dl>

      <p className="mt-4 max-w-prose whitespace-pre-wrap font-sans text-sm leading-relaxed text-tinta/80">
        {peticion.mensaje}
      </p>

      <form action={accion} className="mt-6">
        <input type="hidden" name="id" value={peticion.id} />
        {estado.estado === 'error' && (
          <p role="alert" className="mb-3 font-mono text-xs text-terracota-texto">
            {estado.mensaje}
          </p>
        )}
        <BotonAtender />
      </form>
    </article>
  );
}
