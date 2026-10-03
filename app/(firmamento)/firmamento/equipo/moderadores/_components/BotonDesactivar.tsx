'use client';

import { useActionState } from 'react';

import { CLASE_BOTON_PANEL } from '@/components/firmamento/panel/Tarjeta';
import { desactivarModeradorAction, type EstadoModerador } from '@/lib/actions/gestionarModeradores';

/** Quitarle el panel a un moderador. La regla (ni a ti mismo, ni al último) la cuida el servidor. */
export function BotonDesactivar({ email, nombre }: { email: string; nombre: string }) {
  const [estado, accion] = useActionState<EstadoModerador, FormData>(desactivarModeradorAction, { estado: 'inicial' });

  return (
    <form
      action={accion}
      onSubmit={(e) => {
        if (!window.confirm(`¿Quitarle a ${nombre} el acceso al panel del equipo? Pierde el acceso de inmediato.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="email" value={email} />
      <button type="submit" aria-label={`Quitar acceso a ${nombre}`} className={CLASE_BOTON_PANEL}>
        Quitar acceso
      </button>
      {estado.estado === 'error' && (
        <p role="alert" className="mt-1 max-w-xs font-sans text-sm text-morado-texto">
          {estado.mensaje}
        </p>
      )}
    </form>
  );
}
