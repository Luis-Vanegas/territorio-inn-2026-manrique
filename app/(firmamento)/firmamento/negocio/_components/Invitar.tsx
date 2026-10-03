'use client';

import { useState } from 'react';

/**
 * «Invita a tus vecinos»: un mensaje ya escrito para mandar por WhatsApp o
 * copiar. El aviso de «Copiado» va en una región
 * `aria-live` para quien usa lector de pantalla.
 * (El texto se muestra completo: si el celular no deja copiar, se selecciona a mano.)
 */
export function Invitar({ mensaje }: { mensaje: string }) {
  const [copiado, setCopiado] = useState<'si' | 'no' | null>(null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado('si');
    } catch {
      // Sin permiso del portapapeles (http, navegador viejo): el texto está a la vista para copiarlo a mano.
      setCopiado('no');
    }
  }

  return (
    <div>
      <p className="rounded-lg border border-trazo bg-noche p-3 font-sans text-sm leading-relaxed text-estrella">
        {mensaje}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center rounded-lg bg-sodio px-4 font-sans text-sm font-medium text-noche"
        >
          Invitar por WhatsApp
          <span className="sr-only"> (se abre en otra pestaña)</span>
        </a>
        <button
          type="button"
          onClick={copiar}
          className="inline-flex min-h-[44px] items-center rounded-lg border border-trazo-2 px-4 font-sans text-sm text-estrella hover:bg-noche-3"
        >
          Copiar mensaje
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-[1.25rem] font-sans text-sm text-tenue">
        {copiado === 'si' && 'Mensaje copiado. Pégalo donde quieras.'}
        {copiado === 'no' && 'No pudimos copiarlo solo. Selecciona el texto de arriba y cópialo.'}
      </p>
    </div>
  );
}
