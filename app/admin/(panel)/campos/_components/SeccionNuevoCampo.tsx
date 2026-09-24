'use client';

import { useState } from 'react';
import { crearCampoAction } from '@/lib/actions/camposPersonalizados';
import { FormularioCampo } from './FormularioCampo';

/** Colapsado por defecto: la vista principal es la lista, no el alta. */
export function SeccionNuevoCampo() {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="border border-azul-texto bg-azul-texto px-4 py-2 font-sans text-xs text-hueso transition-colors hover:bg-transparent hover:text-azul-texto"
      >
        + Agregar campo
      </button>
    );
  }

  return (
    <div className="max-w-md border border-tinta/12 p-6">
      <FormularioCampo accion={crearCampoAction} alGuardar={() => setAbierto(false)} />
      <button
        type="button"
        onClick={() => setAbierto(false)}
        className="mt-4 font-sans text-xs text-tinta/60 hover:text-azul-texto"
      >
        Cancelar
      </button>
    </div>
  );
}
