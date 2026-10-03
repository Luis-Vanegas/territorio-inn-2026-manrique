'use client';

import { useCallback, useState } from 'react';

import type { EstadoEdicion } from '@/lib/actions/gestionarEstado';

/**
 * «Borrar mi negocio», compartido por las dos puertas del dueño: el enlace con
 * token (`/aliados/estado/[token]`) y el panel de Firmamento. `borrar` es la
 * Server Action ya con su clave aplicada (`borrarPortafolio.bind(null, token)` o
 * `borrarFichaDeCuenta.bind(null, id)`): este componente no sabe cuál es.
 */
export function BorrarNegocio({
  borrar,
  alBorrar,
}: {
  borrar: () => Promise<EstadoEdicion>;
  alBorrar: () => void;
}) {
  const [estado, setEstado] = useState<EstadoEdicion>({ estado: 'inicial' });
  const [borrando, setBorrando] = useState(false);

  const handleBorrar = useCallback(async () => {
    if (!window.confirm('¿Seguro que quieres borrar tu negocio del directorio?')) return;

    setBorrando(true);
    const resultado = await borrar();
    setBorrando(false);
    setEstado(resultado);
    if (resultado.estado === 'ok') alBorrar();
  }, [borrar, alBorrar]);

  return (
    <div className="border-t border-tinta/12 pt-8">
      <h2 className="font-sans text-xs uppercase tracking-wider text-tinta/60">
        Borrar mi negocio
      </h2>
      <p className="mt-2 max-w-xl font-sans text-sm leading-relaxed text-tinta/65">
        Esto saca tu negocio del directorio y del mapa. No se puede deshacer — si más adelante
        quieres volver a aparecer, tienes que registrarte de nuevo.
      </p>

      {estado.estado === 'error' && (
        <p role="alert" className="mt-3 font-sans text-sm text-azul-texto">
          {estado.mensaje}
        </p>
      )}

      <button
        type="button"
        onClick={handleBorrar}
        disabled={borrando}
        className="mt-4 min-h-11 border border-azul-texto px-5 py-2.5 font-sans text-sm text-azul-texto transition-colors hover:bg-azul-texto hover:text-hueso disabled:cursor-not-allowed disabled:opacity-50"
      >
        {borrando ? 'Borrando…' : 'Borrar mi negocio'}
      </button>
    </div>
  );
}
