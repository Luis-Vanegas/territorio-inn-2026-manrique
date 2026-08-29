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
        className="border border-terracota-texto bg-terracota-texto px-4 py-2 font-mono text-xs text-hueso transition-colors hover:bg-transparent hover:text-terracota-texto"
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
        className="mt-4 font-mono text-xs text-tinta/45 hover:text-terracota-texto"
      >
        Cancelar
      </button>
    </div>
  );
}
