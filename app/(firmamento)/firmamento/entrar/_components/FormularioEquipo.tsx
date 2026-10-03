'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { iniciarSesion, type EstadoSesion } from '@/lib/actions/sesionAdmin';

const ESTADO_INICIAL: EstadoSesion = { estado: 'inicial' };

const claseInput =
  'mt-2 block min-h-[48px] w-full rounded-lg border border-trazo-2 bg-noche px-4 font-sans text-base text-estrella';

function Boton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-lg bg-sodio px-6 font-sans text-base font-medium text-noche disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Verificando…' : 'Entrar al panel del equipo'}
    </button>
  );
}

/**
 * Correo y contraseña del equipo. Es la misma Server Action de /admin/login
 * (`iniciarSesion`, con su cupo de intentos y su mensaje único para correo o
 * contraseña incorrectos); solo cambia el destino, que viaja en un campo oculto
 * y la acción valida como ruta interna.
 */
export function FormularioEquipo() {
  const [estado, accion] = useActionState(iniciarSesion, ESTADO_INICIAL);

  return (
    <form action={accion}>
      <input type="hidden" name="destino" value="/firmamento/equipo" />

      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="equipo-correo" className="block font-sans text-sm font-medium text-estrella">
            Correo
          </label>
          <input
            id="equipo-correo"
            name="email"
            type="email"
            required
            autoComplete="username"
            className={claseInput}
          />
        </div>

        <div>
          <label htmlFor="equipo-clave" className="block font-sans text-sm font-medium text-estrella">
            Contraseña
          </label>
          <input
            id="equipo-clave"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={claseInput}
          />
        </div>
      </div>

      {estado.estado === 'error' && (
        <p
          role="alert"
          className="mt-5 border-l-2 border-ladrillo bg-noche px-4 py-3 font-sans text-sm leading-relaxed text-estrella"
        >
          {estado.mensaje}
        </p>
      )}

      <Boton />
    </form>
  );
}
