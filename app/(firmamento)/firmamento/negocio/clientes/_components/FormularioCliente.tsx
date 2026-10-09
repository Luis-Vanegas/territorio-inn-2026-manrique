'use client';

import { useActionState, useId } from 'react';
import { useFormStatus } from 'react-dom';

import { CampoFormulario } from '@/components/CampoFormulario';
import { CLASE_BOTON_PRIMARIO } from '@/components/firmamento/panel/Tarjeta';
import { borrarClienteAction, guardarCliente } from '@/lib/actions/clientesNegocio';
import type { ClienteNegocio } from '@/lib/db/clientes.repo';
import {
  ETAPAS,
  ETIQUETA_ETAPA,
  type EstadoBorrarCliente,
  type EstadoCliente,
} from '@/lib/validation/cliente.schema';

const ESTADO_INICIAL: EstadoCliente = { estado: 'inicial' };
const ESTADO_BORRAR_INICIAL: EstadoBorrarCliente = { estado: 'inicial' };

const claseInput =
  'w-full rounded-lg border border-tinta/55 bg-transparent px-3 py-2.5 font-sans text-base text-tinta ' +
  'placeholder:text-tinta/65 focus:border-azul focus:outline-none aria-[invalid=true]:border-azul';

function BotonGuardar({ nuevo }: { nuevo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={CLASE_BOTON_PRIMARIO}
    >
      {pending ? 'Guardando…' : nuevo ? 'Agregar cliente' : 'Guardar cambios'}
    </button>
  );
}

/**
 * Alta y edición con el mismo formulario: sin `cliente` es uno nuevo. Al
 * guardar bien, React vacía el formulario y la página se vuelve a pintar con
 * los datos nuevos (la action llama revalidatePath). React también lo vacía
 * cuando la action falla: por eso el error trae `valores` y los campos los
 * toman como valor inicial, para no borrarle a la persona lo que escribió.
 */
export function FormularioCliente({ portafolioId, cliente }: { portafolioId: string; cliente?: ClienteNegocio }) {
  const [estado, accion] = useActionState(guardarCliente, ESTADO_INICIAL);
  // Hay un formulario por cliente en la misma página: ids fijos chocarían.
  const id = useId();
  const errores = estado.estado === 'error' ? (estado.errores ?? {}) : {};
  const valores = estado.estado === 'error' ? estado.valores : null;

  return (
    <form action={accion} className="flex flex-col gap-5">
      <input type="hidden" name="portafolio_id" value={portafolioId} />
      {cliente && <input type="hidden" name="id" value={cliente.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoFormulario id={`${id}-nombre`} etiqueta="Nombre" requerido errores={errores.nombre}>
          {(p) => (
            <input {...p} name="nombre" required maxLength={80} defaultValue={valores?.nombre ?? cliente?.nombre} placeholder="Doña Marta" className={claseInput} />
          )}
        </CampoFormulario>

        <CampoFormulario id={`${id}-telefono`} etiqueta="Celular o WhatsApp" errores={errores.telefono}>
          {(p) => (
            <input {...p} name="telefono" type="tel" inputMode="tel" maxLength={20} defaultValue={valores?.telefono ?? cliente?.telefono ?? ''} placeholder="300 123 4567" className={claseInput} />
          )}
        </CampoFormulario>

        <CampoFormulario id={`${id}-etapa`} etiqueta="¿Cómo va con este cliente?" requerido errores={errores.etapa}>
          {(p) => (
            <select {...p} name="etapa" defaultValue={valores?.etapa || cliente?.etapa || 'interesado'} className={claseInput}>
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
          etiqueta="Fecha para volver a escribirle"
          errores={errores.proximo_contacto}
        >
          {(p) => (
            <input {...p} name="proximo_contacto" type="date" defaultValue={valores?.proximo_contacto ?? cliente?.proximo_contacto ?? ''} className={claseInput} />
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
          <textarea {...p} name="nota" rows={2} maxLength={500} defaultValue={valores?.nota ?? cliente?.nota ?? ''} className={claseInput} />
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
  const [estado, accion, pendiente] = useActionState(borrarClienteAction, ESTADO_BORRAR_INICIAL);

  return (
    <form
      action={accion}
      onSubmit={(e) => {
        if (!confirm(`¿Borrar a ${nombre} de tu lista? No se puede deshacer.`)) e.preventDefault();
      }}
      className="flex flex-wrap items-center gap-x-4 gap-y-1"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pendiente}
        className="inline-flex min-h-[44px] items-center font-sans text-sm text-tinta/70 underline decoration-tinta/30 underline-offset-4 hover:text-azul-texto disabled:cursor-wait disabled:opacity-60"
      >
        {pendiente ? 'Borrando…' : 'Borrar'}
      </button>
      {estado.estado === 'error' && (
        <p role="alert" className="font-sans text-sm text-azul-texto">
          {estado.mensaje}
        </p>
      )}
    </form>
  );
}
