'use client';

import { useEffect, useRef, useState } from 'react';

import { CLASE_BOTON_PRIMARIO } from '@/components/firmamento/panel/Tarjeta';

/**
 * El enlace de los datos abiertos, a la vista y con un botón para copiarlo. El
 * texto se puede seleccionar a mano si el navegador no deja usar el portapapeles
 * (por ejemplo, sin HTTPS): el botón es una comodidad, no la única vía.
 */
export function CopiarEnlace({ url }: { url: string }) {
  const [copiado, setCopiado] = useState<'no' | 'si' | 'fallo'>('no');
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (temporizador.current) clearTimeout(temporizador.current);
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado('si');
    } catch {
      setCopiado('fallo');
    }
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setCopiado('no'), 3000);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <p className="min-w-0 flex-1 select-all break-all rounded-lg border border-tinta/55 bg-tinta/[0.03] px-4 py-3 font-sans text-base text-tinta">
          {url}
        </p>
        <button
          type="button"
          onClick={copiar}
          className={`${CLASE_BOTON_PRIMARIO} shrink-0`}
        >
          Copiar enlace
        </button>
      </div>
      <p role="status" className="mt-2 min-h-[1.5rem] font-sans text-sm text-tinta/70">
        {copiado === 'si' && 'Enlace copiado.'}
        {copiado === 'fallo' && 'No se pudo copiar. Selecciona el enlace y cópialo a mano.'}
      </p>
    </div>
  );
}
