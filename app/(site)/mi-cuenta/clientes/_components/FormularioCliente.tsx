'use client';

import { useActionState, useId } from 'react';
import { useFormStatus } from 'react-dom';

import { CampoFormulario } from '@/components/CampoFormulario';
import { borrarClienteAction, guardarCliente } from '@/lib/actions/clientesNegocio';
import type { ClienteNegocio } from '@/lib/db/clientes.repo';
import { ETAPAS, ETIQUETA_ETAPA, type EstadoCliente } from '@/lib/validation/cliente.schema';

const ESTADO_INICIAL: EstadoCliente = { estado: 'inicial' };

const claseInput =
  'w-full border border-tinta/20 bg-transparent px-3 py-2.5 font-sans text-base text-tinta ' +
  'placeholder:text-tinta/35 focus:border-azul focus:outline-none aria-[invalid=true]:border-azul';

function BotonGuardar({ nuevo }: { nuevo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[44px] border border-azul-texto bg-azul-texto px-6 font-sans text-sm text-hueso transition-colors hover:bg-transparent hover:text-azul-texto disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Guardando…' : nuevo ? 'Agregar cliente' : 'Guardar cambios'}
    </button>
  );
}

/**
 * Alta y edición con el mismo formulario: sin `cliente` es uno nuevo. Al
 * guardar bien, React vacía el formulario y la página se vuelve a pintar con
 * los datos nuevos (la action llama revalidatePath).
 */
export function FormularioCliente({ portafolioId, cliente }: { portafolioId: string; cliente?: ClienteNegocio }) {
  const [estado, accion] = useActionState(guardarCliente, ESTADO_INICIAL);
  // Hay un formulario por cliente en la misma página: ids fijos chocarían.
  const id = useId();
  const errores = estado.estado === 'error' ? (estado.errores ?? {}) : {};

  return (
    <form action={accion} className="flex flex-col gap-5">
      <input type="hidden" name="portafolio_id" value={portafolioId} />
      {cliente && <input type="hidden" name="id" value={cliente.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoFormulario id={`${id}-nombre`} etiqueta="Nombre" requerido errores={errores.nombre}>
          {(p) => (
            <input {...p} name="nombre" required maxLength={80} defaultValue={cliente?.nombre} placeholder="Doña Marta" className={claseInput} />
          )}
        </CampoFormulario>

        <CampoFormulario id={`${id}-telefono`} etiqueta="Celular o WhatsApp" errores={errores.telefono}>
          {(p) => (
            <input {...p} name="telefono" type="tel" inputMode="tel" maxLength={20} defaultValue={cliente?.telefono ?? ''} placeholder="300 123 4567" className={claseInput} />
          )}
        </CampoFormulario>

        <CampoFormulario id={`${id}-etapa`} etiqueta="¿En qué va?" requerido errores={errores.etapa}>
          {(p) => (
            <select {...p} name="etapa" defaultValue={cliente?.etapa ?? 'interesado'} className={claseInput}>
              {ETAPAS.map((e) => (
                <option key={e} value={e}>
                  {ETIQUETA_ETAPA[e]}
                </option>
              ))}
            </select>
          )}
        </CampoFormulario>

        <CampoFormulario
          id={`${id}-proximo`}
          etiqueta="Volver a escribirle el"
          errores={errores.proximo_contacto}
        >
          {(p) => (
            <input {...p} name="proximo_contacto" type="date" defaultValue={cliente?.proximo_contacto ?? ''} className={claseInput} />
          )}
        </CampoFormulario>
      </div>

      <CampoFormulario
        id={`${id}-nota`}
        etiqueta="Nota"
        ayuda="Qué te pidió o qué quedó pendiente. No anotes cédulas ni datos bancarios."
        errores={errores.nota}
      >
        {(p) => (
          <textarea {...p} name="nota" rows={2} maxLength={500} defaultValue={cliente?.nota ?? ''} className={claseInput} />
        )}
      </CampoFormulario>

      <div className="flex flex-wrap items-center gap-4">
        <BotonGuardar nuevo={!cliente} />
        {estado.estado === 'ok' && (
          <p role="status" className="font-sans text-sm text-tinta/70">
            {estado.mensaje}
          </p>
        )}
        {estado.estado === 'error' && estado.mensaje && (
          <p role="alert" className="font-sans text-sm text-azul-texto">
            {estado.mensaje}
          </p>
        )}
      </div>
    </form>
  );
}

export function BotonBorrarCliente({ id, nombre }: { id: string; nombre: string }) {
  return (
    <form
      action={borrarClienteAction}
      onSubmit={(e) => {
        if (!confirm(`¿Borrar a ${nombre} de tu lista? No se puede deshacer.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="min-h-[44px] font-sans text-sm text-tinta/60 underline decoration-tinta/30 underline-offset-4 hover:text-azul-texto"
      >
        Borrar
      </button>
    </form>
  );
}
