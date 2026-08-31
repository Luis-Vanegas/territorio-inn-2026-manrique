'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { iniciarSesion, type EstadoSesion } from '@/lib/actions/sesionAdmin';

const ESTADO_INICIAL: EstadoSesion = { estado: 'inicial' };

const claseInput =
  'w-full border-0 border-b border-tinta/20 bg-transparent px-0 py-2 font-sans text-[15px] ' +
  'text-tinta placeholder:text-tinta/30 focus:border-terracota focus:outline-none focus:ring-0';

function Boton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-8 w-full border border-terracota-texto bg-terracota-texto py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-terracota-texto disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Verificando…' : 'Entrar'}
    </button>
  );
}

export function FormularioLogin() {
  const [estado, accion] = useActionState(iniciarSesion, ESTADO_INICIAL);

  return (
    <form action={accion} className="mt-10">
      <div className="flex flex-col gap-6">
        <div>
          <label htmlFor="email" className="block font-sans text-sm font-medium text-tinta">
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className={`${claseInput} mt-2`}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block font-sans text-sm font-medium text-tinta"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={`${claseInput} mt-2`}
          />
        </div>
      </div>

      {estado.estado === 'error' && (
        <p role="alert" className="mt-5 font-mono text-xs text-terracota-texto">
          {estado.mensaje}
        </p>
      )}

      <Boton />
    </form>
  );
}
