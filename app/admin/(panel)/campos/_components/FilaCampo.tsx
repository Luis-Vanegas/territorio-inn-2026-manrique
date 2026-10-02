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
function InterruptorPublico({
  campo,
  conValor,
}: {
  campo: DefinicionCampo;
  /** Negocios con un valor ya cargado; null si no se pudo contar. */
  conValor: number | null;
}) {
  const [estado, accion, pendiente] = useActionState(cambiarPublicoCampoAction, ESTADO_INICIAL);

  return (
    <form
      action={accion}
      className="flex flex-col items-end gap-1"
      onSubmit={(e) => {
        // Publicar expone lo que ya escribieron cuando el campo era privado: se
        // confirma, con la cifra, antes de hacerlo (Ley 1581). Ocultar no pide nada.
        if (campo.publico) return;
        const cuantos =
          conValor === null
            ? 'Puede que algunos negocios ya tengan un valor cargado'
            : conValor === 0
              ? 'Ningún negocio tiene todavía un valor cargado'
              : `${conValor} ${conValor === 1 ? 'negocio ya tiene' : 'negocios ya tienen'} un valor cargado`;
        const ok = window.confirm(
          `«${campo.etiqueta}» pasará a mostrarse en la vitrina pública.\n\n${cuantos} en este campo, que se guardó como privado. Al publicarlo, esos valores serán visibles para cualquiera.\n\n¿Publicar el campo?`,
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={campo.id} />
      <input type="hidden" name="publico" value={String(!campo.publico)} />
      <button
        type="submit"
        role="switch"
        aria-label={`Mostrar «${campo.etiqueta}» en la vitrina`}
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

export function FilaCampo({ campo, conValor }: { campo: DefinicionCampo; conValor: number | null }) {
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
        <InterruptorPublico campo={campo} conValor={conValor} />

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
