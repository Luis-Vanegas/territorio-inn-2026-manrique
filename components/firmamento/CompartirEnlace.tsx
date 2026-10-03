'use client';

import { useState } from 'react';

import { CLASE_BOTON_PANEL } from '@/components/firmamento/panel/Tarjeta';
import { enlaceWhatsapp } from '@/lib/contacto';

/**
 * Un enlace de acceso para mandar por WhatsApp o copiar: «Enviar acceso» de una
 * ficha y las invitaciones del equipo. Con `numero`, el WhatsApp abre el chat de
 * esa persona (`enlaceWhatsapp`); sin él, WhatsApp pregunta a quién.
 *
 * El mensaje se muestra completo: si el celular no deja copiar, se selecciona a
 * mano. El aviso de «Copiado» va en una región `aria-live`.
 */
export function CompartirEnlace({
  mensaje,
  numero,
  etiquetaWhatsapp = 'Enviar por WhatsApp',
}: {
  mensaje: string;
  numero?: string | null;
  etiquetaWhatsapp?: string;
}) {
  const [copiado, setCopiado] = useState<'si' | 'no' | null>(null);
  const base = numero ? enlaceWhatsapp(numero) : 'https://wa.me/';

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado('si');
    } catch {
      setCopiado('no');
    }
  }

  return (
    <div>
      <p className="break-words rounded-lg border border-tinta/12 bg-tinta/[0.03] p-3 font-sans text-sm leading-relaxed text-tinta">
        {mensaje}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`${base}?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={CLASE_BOTON_PANEL}
        >
          {etiquetaWhatsapp}
          <span className="sr-only"> (se abre en otra pestaña)</span>
        </a>
        <button type="button" onClick={copiar} className={CLASE_BOTON_PANEL}>
          Copiar mensaje
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-[1.25rem] font-sans text-sm text-tinta/70">
        {copiado === 'si' && 'Mensaje copiado. Pégalo donde quieras.'}
        {copiado === 'no' && 'No pudimos copiarlo solo. Selecciona el texto de arriba y cópialo.'}
      </p>
    </div>
  );
}
