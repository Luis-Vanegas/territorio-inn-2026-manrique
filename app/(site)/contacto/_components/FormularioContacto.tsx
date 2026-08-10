'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { registrarPeticion, type EstadoPeticion } from '@/lib/actions/registrarPeticion';

const ESTADO_INICIAL: EstadoPeticion = { estado: 'inicial' };

const claseInput =
  'w-full border-0 border-b border-tinta/20 bg-transparent px-0 py-2 font-sans text-[15px] text-tinta ' +
  'placeholder:text-tinta/30 focus:border-terracota focus:outline-none focus:ring-0 ' +
  'aria-[invalid=true]:border-terracota';

function BotonEnviar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-terracota bg-terracota px-6 py-3 font-mono text-sm text-hueso transition-colors hover:bg-transparent hover:text-terracota disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Enviando…' : 'Enviar mensaje →'}
    </button>
  );
}

export function FormularioContacto() {
  const [estado, accion] = useFormState(registrarPeticion, ESTADO_INICIAL);
  const errores = estado.estado === 'error' ? (estado.errores ?? {}) : {};
  const err = (campo: string): string[] | undefined => errores[campo];

  if (estado.estado === 'ok') {
    return (
      <div className="mt-14 max-w-xl border-t border-tinta/12 pt-10">
        <span className="font-mono text-xs uppercase tracking-wider text-terracota">
          Mensaje recibido
        </span>
        <h2 className="mt-3 font-display text-3xl font-medium leading-tight text-tinta">
          Gracias. El equipo lo va a revisar.
        </h2>
        <p className="mt-4 font-sans leading-relaxed text-tinta/70">
          Te respondemos por el contacto que dejaste.
        </p>
      </div>
    );
  }

  return (
    <form action={accion} className="mt-14 flex max-w-xl flex-col gap-6">
      {estado.estado === 'error' && estado.mensaje && (
        <p
          role="alert"
          className="border border-terracota/40 bg-terracota/5 px-4 py-3 font-sans text-sm text-terracota"
        >
          {estado.mensaje}
        </p>
      )}

      <div>
        <label htmlFor="nombre" className="block font-sans text-sm font-medium text-tinta">
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          maxLength={80}
          placeholder="Tu nombre"
          aria-invalid={err('nombre') ? true : undefined}
          className={`mt-2 ${claseInput}`}
        />
        {err('nombre') && (
          <p className="mt-1.5 font-mono text-xs text-terracota">{err('nombre')![0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="contacto" className="block font-sans text-sm font-medium text-tinta">
          Correo, teléfono o WhatsApp
        </label>
        <p className="mt-1 font-sans text-xs text-tinta/50">Es lo que vamos a usar para responderte.</p>
        <input
          id="contacto"
          name="contacto"
          type="text"
          required
          maxLength={120}
          placeholder="300 123 4567 o vos@correo.com"
          aria-invalid={err('contacto') ? true : undefined}
          className={`mt-2 ${claseInput}`}
        />
        {err('contacto') && (
          <p className="mt-1.5 font-mono text-xs text-terracota">{err('contacto')![0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="mensaje" className="block font-sans text-sm font-medium text-tinta">
          Tu mensaje
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          rows={5}
          required
          minLength={10}
          maxLength={1000}
          placeholder="Contanos tu caso o petición."
          aria-invalid={err('mensaje') ? true : undefined}
          className={`mt-2 resize-y ${claseInput}`}
        />
        {err('mensaje') && (
          <p className="mt-1.5 font-mono text-xs text-terracota">{err('mensaje')![0]}</p>
        )}
      </div>

      <div>
        <BotonEnviar />
      </div>
    </form>
  );
}
