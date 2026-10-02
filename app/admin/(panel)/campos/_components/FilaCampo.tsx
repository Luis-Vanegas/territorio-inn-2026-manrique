'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { DefinicionCampo } from '@/lib/db/camposPersonalizados.repo';
import {
  editarCampoAction,
  cambiarActivoCampoAction,
  cambiarPublicoCampoAction,
  type EstadoCampo,
} from '@/lib/actions/camposPersonalizados';
import { FormularioCampo } from './FormularioCampo';

const ETIQUETA_TIPO: Record<DefinicionCampo['tipo'], string> = {
  texto: 'Texto',
  numero: 'Número',
  si_no: 'Sí / No',
  seleccion: 'Selección',
};

function BotonToggle({ activo }: { activo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-sans text-xs text-tinta/60 underline decoration-azul/40 underline-offset-4 hover:text-azul-texto disabled:opacity-40"
    >
      {activo ? 'desactivar' : 'reactivar'}
    </button>
  );
}

const ESTADO_INICIAL: EstadoCampo = { estado: 'inicial' };

/**
 * Interruptor «se ve en la vitrina». Un campo nuevo nace cerrado: lo que la gente
 * escribe ahí no se publica hasta que un moderador lo decide a propósito.
 */
function InterruptorPublico({ campo }: { campo: DefinicionCampo }) {
  const [estado, accion, pendiente] = useActionState(cambiarPublicoCampoAction, ESTADO_INICIAL);

  return (
    <form action={accion} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={campo.id} />
      <input type="hidden" name="publico" value={String(!campo.publico)} />
      <button
        type="submit"
        role="switch"
        aria-checked={campo.publico}
        disabled={pendiente}
        className="inline-flex min-h-11 items-center gap-2 font-sans text-xs text-tinta/70 hover:text-azul-texto disabled:opacity-40"
      >
        <span
          aria-hidden="true"
          className={`flex h-4 w-8 items-center border border-tinta/55 px-0.5 ${
            campo.publico ? 'justify-end bg-azul-texto' : 'justify-start'
          }`}
        >
          <span className={`h-2.5 w-2.5 ${campo.publico ? 'bg-hueso' : 'bg-tinta/55'}`} />
        </span>
        {campo.publico ? 'Se ve en la vitrina' : 'Solo lo ve el panel'}
      </button>
      <p role="status" className="font-sans text-xs text-tinta/65">
        {estado.estado === 'ok' || estado.estado === 'error' ? estado.mensaje : ''}
      </p>
    </form>
  );
}

export function FilaCampo({ campo }: { campo: DefinicionCampo }) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <div className="border-t border-tinta/12 py-6">
        <p className="mb-4 font-sans text-xs uppercase tracking-wider text-tinta/65">
          Editando · {campo.etiqueta}
        </p>
        <div className="max-w-md">
          <FormularioCampo
            accion={editarCampoAction}
            campoExistente={campo}
            alGuardar={() => setEditando(false)}
          />
        </div>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="mt-4 font-sans text-xs text-tinta/60 hover:text-azul-texto"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-4 border-t border-tinta/12 py-5 ${
        !campo.activo ? 'opacity-50' : ''
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="font-sans text-sm font-medium text-tinta">{campo.etiqueta}</p>
          {campo.requerido && (
            <span className="font-sans text-xs uppercase text-morado-texto">obligatorio</span>
          )}
          {!campo.activo && (
            <span className="font-sans text-xs uppercase text-tinta/60">inactivo</span>
          )}
        </div>
        <p className="mt-1 font-sans text-xs text-tinta/60">
          {ETIQUETA_TIPO[campo.tipo]}
          {campo.opciones && ` · ${campo.opciones.join(' · ')}`}
        </p>
        {campo.ayuda && <p className="mt-1 font-sans text-xs text-tinta/65">{campo.ayuda}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <InterruptorPublico campo={campo} />

        <button
          type="button"
          onClick={() => setEditando(true)}
          className="font-sans text-xs text-tinta/60 underline decoration-azul/40 underline-offset-4 hover:text-azul-texto"
        >
          editar
        </button>

        <form action={cambiarActivoCampoAction}>
          <input type="hidden" name="id" value={campo.id} />
          <input type="hidden" name="activo" value={String(!campo.activo)} />
          <BotonToggle activo={campo.activo} />
        </form>
      </div>
    </div>
  );
}
