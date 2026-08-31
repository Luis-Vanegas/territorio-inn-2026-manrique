'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { DefinicionCampo } from '@/lib/db/camposPersonalizados.repo';
import { editarCampoAction, cambiarActivoCampoAction } from '@/lib/actions/camposPersonalizados';
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
      className="font-mono text-xs text-tinta/45 underline decoration-terracota/40 underline-offset-4 hover:text-terracota-texto disabled:opacity-40"
    >
      {activo ? 'desactivar' : 'reactivar'}
    </button>
  );
}

export function FilaCampo({ campo }: { campo: DefinicionCampo }) {
  const [editando, setEditando] = useState(false);

  if (editando) {
    return (
      <div className="border-t border-tinta/12 py-6">
        <p className="mb-4 font-mono text-xs uppercase tracking-wider text-tinta/50">
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
          className="mt-4 font-mono text-xs text-tinta/45 hover:text-terracota-texto"
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
            <span className="font-mono text-xs uppercase text-terracota-texto">obligatorio</span>
          )}
          {!campo.activo && (
            <span className="font-mono text-xs uppercase text-tinta/40">inactivo</span>
          )}
        </div>
        <p className="mt-1 font-mono text-xs text-tinta/45">
          {ETIQUETA_TIPO[campo.tipo]}
          {campo.opciones && ` · ${campo.opciones.join(' · ')}`}
        </p>
        {campo.ayuda && <p className="mt-1 font-sans text-xs text-tinta/50">{campo.ayuda}</p>}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="font-mono text-xs text-tinta/45 underline decoration-terracota/40 underline-offset-4 hover:text-terracota-texto"
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
