'use client';

import { useActionState, useId } from 'react';
import { useFormStatus } from 'react-dom';

import {
  agregarMiembroAction,
  crearEntidadAction,
  quitarMiembroAction,
  type EstadoEntidad,
} from '@/lib/actions/gestionarEntidades';

const INICIAL: EstadoEntidad = { estado: 'inicial' };

const CLASE_CAMPO =
  'mt-1 block min-h-[44px] w-full rounded-lg border border-trazo-2 bg-noche px-3 font-sans text-base text-estrella placeholder:text-tenue-2';
const CLASE_ETIQUETA = 'block font-sans text-sm font-medium text-estrella';

function Enviar({ texto, pendiente, principal = false }: { texto: string; pendiente: string; principal?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 font-sans text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        principal ? 'bg-sodio text-noche' : 'border border-trazo-2 text-estrella hover:bg-noche-3'
      }`}
    >
      {pending ? pendiente : texto}
    </button>
  );
}

function Mensaje({ estado }: { estado: EstadoEntidad }) {
  if (estado.estado === 'inicial') return null;
  return (
    <p
      role={estado.estado === 'error' ? 'alert' : 'status'}
      className={`mt-3 font-sans text-sm ${estado.estado === 'error' ? 'text-ladrillo' : 'text-menta'}`}
    >
      {estado.mensaje}
    </p>
  );
}

export function FormularioNuevaEntidad() {
  const [estado, accion] = useActionState(crearEntidadAction, INICIAL);
  const id = useId();

  return (
    <form action={accion} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor={`${id}-nombre`} className={CLASE_ETIQUETA}>
          Nombre
        </label>
        <input id={`${id}-nombre`} name="nombre" required minLength={2} maxLength={120} className={CLASE_CAMPO} />
      </div>
      <fieldset>
        <legend className={CLASE_ETIQUETA}>Tipo</legend>
        <div className="mt-1 flex flex-col">
          <label className="flex min-h-[44px] items-center gap-2 font-sans text-sm text-estrella">
            <input type="radio" name="tipo" value="territorial" defaultChecked className="h-4 w-4 accent-sodio" />
            Territorial (mira el observatorio)
          </label>
          <label className="flex min-h-[44px] items-center gap-2 font-sans text-sm text-estrella">
            <input type="radio" name="tipo" value="oferente" className="h-4 w-4 accent-sodio" />
            Oferente (publica convocatorias)
          </label>
        </div>
      </fieldset>
      <div>
        <label htmlFor={`${id}-sitio`} className={CLASE_ETIQUETA}>
          Sitio web <span className="font-normal text-tenue">(opcional)</span>
        </label>
        <input
          id={`${id}-sitio`}
          name="sitio"
          type="url"
          inputMode="url"
          placeholder="https://"
          maxLength={300}
          className={CLASE_CAMPO}
        />
      </div>
      <div className="sm:col-span-2">
        <Enviar texto="Crear entidad" pendiente="Creando…" principal />
        <Mensaje estado={estado} />
      </div>
    </form>
  );
}

export function FormularioMiembro({ entidadId, entidadNombre }: { entidadId: string; entidadNombre: string }) {
  const [estado, accion] = useActionState(agregarMiembroAction, INICIAL);
  const id = useId();

  return (
    <form action={accion} className="mt-4">
      <input type="hidden" name="entidad_id" value={entidadId} />
      <label htmlFor={`${id}-correo`} className={CLASE_ETIQUETA}>
        Agregar a alguien a {entidadNombre} por su correo de Google
      </label>
      <div className="mt-1 flex flex-wrap gap-2">
        <input
          id={`${id}-correo`}
          name="correo"
          type="email"
          required
          autoComplete="off"
          aria-describedby={`${id}-ayuda`}
          className={`${CLASE_CAMPO} mt-0 min-w-0 flex-1 basis-56`}
        />
        <Enviar texto="Agregar" pendiente="Agregando…" />
      </div>
      <p id={`${id}-ayuda`} className="mt-1 font-sans text-sm text-tenue">
        La persona tiene que haber entrado una vez con Google en Constelaciones.
      </p>
      <Mensaje estado={estado} />
    </form>
  );
}

export function BotonQuitarMiembro({
  entidadId,
  usuarioId,
  nombre,
}: {
  entidadId: string;
  usuarioId: string;
  nombre: string;
}) {
  const [estado, accion] = useActionState(quitarMiembroAction, INICIAL);

  return (
    <form
      action={accion}
      onSubmit={(e) => {
        if (!window.confirm(`¿Quitarle a ${nombre} el acceso al panel de esta entidad?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="entidad_id" value={entidadId} />
      <input type="hidden" name="usuario_id" value={usuarioId} />
      <button
        type="submit"
        aria-label={`Quitar a ${nombre}`}
        className="inline-flex min-h-[44px] items-center rounded-lg border border-trazo-2 px-3 font-sans text-sm text-ladrillo transition-colors hover:bg-noche-3"
      >
        Quitar
      </button>
      {estado.estado === 'error' && (
        <p role="alert" className="mt-1 font-sans text-sm text-ladrillo">
          {estado.mensaje}
        </p>
      )}
    </form>
  );
}
